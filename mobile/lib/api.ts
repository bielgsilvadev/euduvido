import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGE_SEED_CATALOG } from '@/constants/badgeSeed';
import { uploadProfileAvatar } from '@/lib/uploadProfileAvatar';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  BadgeDefinition,
  BadgeWithEarned,
  LeagueMemberRow,
  LeagueRow,
  PostRow,
  PostWithAuthor,
  Profile,
  UserBadgeEarned,
} from '@/types/models';

const DEMO_BADGE_CATALOG: BadgeDefinition[] = BADGE_SEED_CATALOG;

/**
 * Gravado quando o treino não tem descrição e a BD ainda exige texto não vazio (`description_not_empty`).
 * O cartão do post não mostra este texto — equivale a “sem descrição”.
 */
export const WORKOUT_DESCRIPTION_EMPTY_SENTINEL = '(sem descrição)';

const STORAGE_POSTS_WORKOUT_TYPE_COL = '@dryleague/posts_workout_type_column';

type PostsWorkoutColumnState = 'yes' | 'no' | 'unknown';

type PostsInsertShape = { modernVisibility: boolean; workoutColumn: PostsWorkoutColumnState };

/** Cache em memória + AsyncStorage para `workout_type` (evita POST 400 quando a coluna ainda não existe). */
let cachedPostsInsertShape: PostsInsertShape | null = null;

const PROFILE_LIST_SELECT =
  'id, username, display_name, avatar_url, points, level, streak_current, streak_best, onboarding_completed, bio, created_at, total_challenges_created, reputation_score';

function mapPost(row: Record<string, unknown>, author?: Profile | null, extras?: Partial<PostWithAuthor>): PostWithAuthor {
  const p = row as PostWithAuthor;
  return {
    ...p,
    author: author ?? (row.profiles as Profile) ?? undefined,
    ...extras,
  };
}

/** Supabase ainda com `visibility` enum em vez de `visible_*` (migration não aplicada). */
function isLegacyPostsSchemaError(err: { message?: string; code?: string; details?: string } | null | undefined): boolean {
  const m = (err?.message ?? '').toLowerCase();
  const d = (err?.details ?? '').toLowerCase();
  const blob = `${m} ${d}`;
  const code = String(err?.code ?? '');
  if (code === '42703' || code === 'PGRST204') {
    if (
      blob.includes('visible_global') ||
      blob.includes('visible_followers') ||
      blob.includes('visible_league')
    ) {
      return true;
    }
  }
  if (blob.includes('visible_global') || blob.includes('visible_followers') || blob.includes('visible_league')) {
    return (
      blob.includes('does not exist') ||
      blob.includes('could not find') ||
      blob.includes('schema cache') ||
      blob.includes('unknown column') ||
      blob.includes('undefined column') ||
      blob.includes("could not find the 'visible_") ||
      blob.includes('failed to parse')
    );
  }
  return false;
}

/**
 * Feed global: schema novo primeiro (`visible_global`). Se ainda não houver migration, faz fallback para `visibility`.
 * Depois de `post_multi_visibility`, `visibility` deixa de existir — tentar legacy primeiro gera 400 à toa.
 */
async function fetchGlobalFeedQuery() {
  const modern = await supabase
    .from('posts')
    .select('*')
    .eq('visible_global', true)
    .order('created_at', { ascending: false })
    .limit(40);
  if (!modern.error) return modern;
  const legacy = await supabase
    .from('posts')
    .select('*')
    .eq('visibility', 'global')
    .order('created_at', { ascending: false })
    .limit(40);
  if (!legacy.error) return legacy;
  return modern;
}

function isPostKindSchemaError(err: { message?: string } | null | undefined): boolean {
  const m = (err?.message ?? '').toLowerCase();
  if (!m || !m.includes('post_kind')) return false;
  return m.includes('does not exist') || m.includes('could not find') || m.includes('schema cache') || m.includes('column');
}

/** Violação do índice único “um treino por dia”. */
function isWorkoutDayUniqueViolation(err: { code?: string; message?: string; details?: string } | null | undefined): boolean {
  if (String(err?.code ?? '') !== '23505') return false;
  const blob = `${err?.message ?? ''} ${err?.details ?? ''}`.toLowerCase();
  return (
    blob.includes('posts_one_workout_per_user_per_day') ||
    (blob.includes('user_id') && blob.includes('workout_date'))
  );
}

const WORKOUT_DUPLICATE_DAY_MSG =
  'Já registaste um treino para esta data. Só é permitido um treino por dia.';

/**
 * True se já existir post de treino (`post_kind` workout ou null) para o utilizador nessa data.
 */
export async function hasWorkoutPostForDate(userId: string, workoutDate: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  let res = await supabase
    .from('posts')
    .select('id, post_kind')
    .eq('user_id', userId)
    .eq('workout_date', workoutDate)
    .limit(30);
  if (res.error && isPostKindSchemaError(res.error)) {
    res = (await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId)
      .eq('workout_date', workoutDate)
      .limit(30)) as typeof res;
  }
  if (res.error || !res.data?.length) return false;
  const rows = res.data as { id: string; post_kind?: string | null }[];
  if (!('post_kind' in rows[0])) return true;
  return rows.some((r) => !r.post_kind || r.post_kind === 'workout');
}

function isWorkoutTypeSchemaError(err: { message?: string; details?: string; code?: string } | null | undefined): boolean {
  const blob = `${err?.message ?? ''} ${err?.details ?? ''}`.toLowerCase();
  const code = String(err?.code ?? '');
  if (code === '42703' || code === 'PGRST204') {
    if (blob.includes('workout_type')) return true;
  }
  if (!blob.includes('workout_type')) return false;
  return (
    blob.includes('does not exist') ||
    blob.includes('could not find') ||
    blob.includes('schema cache') ||
    blob.includes('column') ||
    blob.includes('unknown')
  );
}

async function getPostsInsertShape(): Promise<PostsInsertShape> {
  if (cachedPostsInsertShape) return cachedPostsInsertShape;
  if (!isSupabaseConfigured) {
    cachedPostsInsertShape = { modernVisibility: true, workoutColumn: 'yes' };
    return cachedPostsInsertShape;
  }
  let workoutColumn: PostsWorkoutColumnState = 'unknown';
  try {
    const p = await AsyncStorage.getItem(STORAGE_POSTS_WORKOUT_TYPE_COL);
    if (p === '1') workoutColumn = 'yes';
    else if (p === '0') workoutColumn = 'no';
  } catch {
    /* ignore */
  }
  const visRes = await supabase.from('posts').select('visible_global').limit(1);
  const modernVisibility = !isLegacyPostsSchemaError(visRes.error);
  cachedPostsInsertShape = { modernVisibility, workoutColumn };
  return cachedPostsInsertShape;
}

function includeWorkoutTypeInInsert(shape: PostsInsertShape): boolean {
  return shape.workoutColumn === 'yes';
}

async function markWorkoutTypeColumnAbsent(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_POSTS_WORKOUT_TYPE_COL, '0');
  } catch {
    /* ignore */
  }
  if (cachedPostsInsertShape) cachedPostsInsertShape.workoutColumn = 'no';
}

async function markWorkoutTypeColumnPresent(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_POSTS_WORKOUT_TYPE_COL, '1');
  } catch {
    /* ignore */
  }
  if (cachedPostsInsertShape) cachedPostsInsertShape.workoutColumn = 'yes';
}

/**
 * Quando a coluna `workout_type` ainda não está confirmada no remoto, não fazemos nenhum pedido extra
 * (evita PATCH 400 no browser). O tipo de treino ficará a null até a migration ser aplicada.
 * Quando `workoutColumn === 'yes'` a coluna já foi incluída no INSERT; nada a fazer aqui.
 */
async function applyWorkoutTypeAfterInsert(
  _postId: string,
  _workoutType: 'musculacao' | 'corrida' | 'lutas' | 'outros',
  shape: PostsInsertShape,
): Promise<string | null> {
  if (shape.workoutColumn === 'unknown') {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        '[Eu Duvido!] workout_type não gravado: aplica `20260328230000_posts_workout_type.sql` no Supabase.',
      );
    }
    await markWorkoutTypeColumnAbsent();
  }
  return null;
}

/** Tabela `post_league_audiences` ainda não criada (migration não aplicada) ou indisponível no PostgREST. */
function isPostLeagueAudiencesUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  const status = e.status ?? e.statusCode;
  if (status === 404 || status === '404') return true;
  const blob = `${e.message ?? ''} ${e.details ?? ''} ${e.hint ?? ''} ${e.code ?? ''}`.toLowerCase();
  if (blob.includes('post_league_audiences')) return true;
  if (blob.includes('pgrst205')) return true;
  if (blob.includes('relation') && blob.includes('does not exist')) return true;
  if (blob.includes('could not find') && blob.includes('schema cache')) return true;
  return false;
}

/** `league_ids` (ordem estável) define a 1ª na coluna `posts.league_id` e o resto em `post_league_audiences`. */
function splitLeagueTargets(input: {
  visible_league: boolean;
  league_id?: string | null;
  league_ids?: string[] | null;
}): { primary: string | null; extras: string[] } {
  if (!input.visible_league) return { primary: null, extras: [] };
  const raw = input.league_ids?.filter(Boolean) ?? [];
  const uniq = [...new Set(raw)];
  if (uniq.length) return { primary: uniq[0]!, extras: uniq.slice(1) };
  if (input.league_id) return { primary: input.league_id, extras: [] };
  return { primary: null, extras: [] };
}

async function insertPostLeagueAudiences(postId: string, extras: string[]): Promise<string | null> {
  if (!extras.length) return null;
  const { error } = await supabase.from('post_league_audiences').insert(
    extras.map((league_id) => ({ post_id: postId, league_id })),
  );
  if (!error) return null;
  if (isPostLeagueAudiencesUnavailableError(error)) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        '[Eu Duvido!] Tabela post_league_audiences ausente: só a 1.ª liga fica ligada ao post. Aplica `20260328220000_post_league_audiences.sql` no Supabase para várias ligas.',
      );
    }
    return null;
  }
  return error.message ?? 'Erro ao associar ligas extra';
}

function legacyVisibilityForInsert(input: {
  visible_global: boolean;
  visible_followers: boolean;
  visible_league: boolean;
  league_id?: string | null;
}): { visibility: 'global' | 'followers' | 'league_only'; league_id: string | null } {
  const leagueId = input.league_id ?? null;
  if (input.visible_global) {
    return { visibility: 'global', league_id: leagueId };
  }
  if (input.visible_followers) {
    return { visibility: 'followers', league_id: leagueId };
  }
  return { visibility: 'league_only', league_id: leagueId };
}

export async function fetchLeaguePosts(leagueId: string, currentUserId: string | undefined): Promise<PostWithAuthor[]> {
  if (!isSupabaseConfigured) return [];
  const modern = await supabase
    .from('posts')
    .select('*')
    .eq('league_id', leagueId)
    .eq('visible_league', true)
    .order('created_at', { ascending: false })
    .limit(30);
  let res = modern;
  if (modern.error) {
    const legacy = await supabase
      .from('posts')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!legacy.error) res = legacy;
  }
  const { data, error } = res;
  if (error) {
    console.warn('fetchLeaguePosts', error.message);
    return [];
  }
  const primaryPosts = (data ?? []) as PostRow[];

  let audiencePosts: PostRow[] = [];
  const linkRes = await supabase.from('post_league_audiences').select('post_id').eq('league_id', leagueId);
  if (!linkRes.error && linkRes.data?.length) {
    const extraIds = [...new Set(linkRes.data.map((r) => r.post_id as string))];
    const { data: extraRows, error: exErr } = await supabase
      .from('posts')
      .select('*')
      .in('id', extraIds)
      .eq('visible_league', true);
    if (!exErr && extraRows?.length) audiencePosts = extraRows as PostRow[];
  }

  const merged = new Map<string, PostRow>();
  for (const p of primaryPosts) merged.set(p.id, p);
  for (const p of audiencePosts) {
    if (!merged.has(p.id)) merged.set(p.id, p);
  }
  const posts = [...merged.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ).slice(0, 30);
  const userIds = [...new Set(posts.map((p) => p.user_id))];
  let profileMap: Record<string, Profile> = {};
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds);
    profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p as Profile]));
  }
  const ids = posts.map((r) => r.id);
  let liked = new Set<string>();
  let likeCounts: Record<string, number> = {};
  if (ids.length && currentUserId) {
    const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', currentUserId).in('post_id', ids);
    liked = new Set((likes ?? []).map((l) => l.post_id as string));
  }
  if (ids.length) {
    const { data: counts } = await supabase.from('post_likes').select('post_id').in('post_id', ids);
    for (const row of counts ?? []) {
      const pid = row.post_id as string;
      likeCounts[pid] = (likeCounts[pid] ?? 0) + 1;
    }
  }
  const commentCounts: Record<string, number> = {};
  if (ids.length) {
    const { data: cc } = await supabase.from('post_comments').select('post_id').in('post_id', ids);
    for (const row of cc ?? []) {
      const pid = row.post_id as string;
      commentCounts[pid] = (commentCounts[pid] ?? 0) + 1;
    }
  }
  return posts.map((row) =>
    mapPost({ ...(row as unknown as Record<string, unknown>) }, profileMap[row.user_id], {
      liked_by_me: liked.has(row.id),
      like_count: likeCounts[row.id] ?? 0,
      comment_count: commentCounts[row.id] ?? 0,
    }),
  );
}

export async function fetchGlobalFeed(currentUserId: string | undefined): Promise<PostWithAuthor[]> {
  if (!isSupabaseConfigured) return [];
  const res = await fetchGlobalFeedQuery();
  const { data, error } = res;
  if (error) {
    console.warn('fetchGlobalFeed', error.message);
    return [];
  }

  const posts = (data ?? []) as PostRow[];
  const userIds = [...new Set(posts.map((p) => p.user_id))];
  let profileMap: Record<string, Profile> = {};
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds);
    profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p as Profile]));
  }

  const ids = posts.map((r) => r.id);
  let liked = new Set<string>();
  let likeCounts: Record<string, number> = {};

  if (ids.length && currentUserId) {
    const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', currentUserId).in('post_id', ids);
    liked = new Set((likes ?? []).map((l) => l.post_id as string));
  }

  if (ids.length) {
    const { data: counts } = await supabase.from('post_likes').select('post_id').in('post_id', ids);
    for (const row of counts ?? []) {
      const id = row.post_id as string;
      likeCounts[id] = (likeCounts[id] ?? 0) + 1;
    }
  }

  const commentCounts: Record<string, number> = {};
  if (ids.length) {
    const { data: cc } = await supabase.from('post_comments').select('post_id').in('post_id', ids);
    for (const row of cc ?? []) {
      const pid = row.post_id as string;
      commentCounts[pid] = (commentCounts[pid] ?? 0) + 1;
    }
  }

  return posts.map((row) =>
    mapPost({ ...(row as unknown as Record<string, unknown>) }, profileMap[row.user_id], {
      liked_by_me: liked.has(row.id),
      like_count: likeCounts[row.id] ?? 0,
      comment_count: commentCounts[row.id] ?? 0,
    }),
  );
}

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return currentlyLiked;
  if (currentlyLiked) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    return false;
  }
  await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
  return true;
}

export async function fetchLeagues(): Promise<LeagueRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .in('status', ['active', 'draft'])
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('fetchLeagues', error.message);
    return [];
  }
  return (data ?? []) as LeagueRow[];
}

export async function fetchMyLeagues(userId: string): Promise<LeagueRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data: m, error } = await supabase.from('league_members').select('league_id').eq('user_id', userId);
  if (error || !m?.length) return [];
  const ids = m.map((x) => x.league_id as string);
  const { data: leagues } = await supabase.from('leagues').select('*').in('id', ids).order('created_at', { ascending: false });
  return (leagues ?? []) as LeagueRow[];
}

export async function fetchUserGlobalRank(userId: string): Promise<number | null> {
  const list = await fetchRanking(300);
  const i = list.findIndex((p) => p.id === userId);
  return i >= 0 ? i + 1 : null;
}

export async function fetchLeagueMemberCounts(leagueIds: string[]): Promise<Record<string, number>> {
  if (!isSupabaseConfigured || !leagueIds.length) return {};
  const { data, error } = await supabase.from('league_members').select('league_id').in('league_id', leagueIds);
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.league_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchLeagueDetail(leagueId: string): Promise<LeagueRow | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('leagues').select('*').eq('id', leagueId).single();
  if (error) return null;
  return data as LeagueRow;
}

export async function fetchLeagueLeaderboard(leagueId: string): Promise<LeagueMemberRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('league_members')
    .select('league_id, user_id, points_in_league, payment_status, abandoned')
    .eq('league_id', leagueId)
    .order('points_in_league', { ascending: false });
  if (error) {
    console.warn('leaderboard', error.message);
    return [];
  }
  const members = (data ?? []) as Omit<LeagueMemberRow, 'profile'>[];
  const uids = members.map((m) => m.user_id);
  let profileMap: Record<string, Profile> = {};
  if (uids.length) {
    const { data: profs } = await supabase.from('profiles').select('*').in('id', uids);
    profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p as Profile]));
  }
  return members.map((m) => ({ ...m, profile: profileMap[m.user_id] }));
}

export async function isLeagueMember(leagueId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function fetchUserLeagues(userId: string): Promise<{ id: string; name: string }[]> {
  if (!isSupabaseConfigured) return [];
  const { data: m, error } = await supabase.from('league_members').select('league_id').eq('user_id', userId);
  if (error || !m?.length) return [];
  const ids = m.map((x) => x.league_id as string);
  const { data: leagues } = await supabase.from('leagues').select('id, name').in('id', ids);
  return (leagues ?? []) as { id: string; name: string }[];
}

export async function joinLeague(leagueId: string, userId: string, league: LeagueRow): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase não configurado';
  if (league.league_type === 'paid' && league.entry_fee_cents > 0) {
    return 'Ligas pagas: conclua o pagamento no fluxo web (Stripe) antes de entrar.';
  }
  const { error } = await supabase.from('league_members').insert({
    league_id: leagueId,
    user_id: userId,
    payment_status: 'waived',
  });
  if (error) {
    if (error.code === '23505') return 'Você já está nesta liga';
    return error.message;
  }
  return null;
}

export async function fetchBadgeCatalog(): Promise<BadgeDefinition[]> {
  if (!isSupabaseConfigured) return DEMO_BADGE_CATALOG;
  const { data, error } = await supabase.from('badges').select('id, name, description, icon_key').order('id');
  if (error) {
    console.warn('fetchBadgeCatalog', error.message);
    return DEMO_BADGE_CATALOG;
  }
  const rows = (data ?? []) as BadgeDefinition[];
  return rows.length ? rows : DEMO_BADGE_CATALOG;
}

export async function fetchUserBadgeRows(userId: string): Promise<UserBadgeEarned[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId);
  if (error) {
    console.warn('fetchUserBadgeRows', error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    badge_id: row.badge_id as string,
    earned_at: row.earned_at as string,
  }));
}

export async function fetchBadgesWithEarned(userId: string): Promise<BadgeWithEarned[]> {
  const [catalog, earnedRows] = await Promise.all([fetchBadgeCatalog(), fetchUserBadgeRows(userId)]);
  const earnedMap = new Map(earnedRows.map((r) => [r.badge_id, r.earned_at]));
  const merged: BadgeWithEarned[] = catalog.map((b) => ({
    ...b,
    earned: earnedMap.has(b.id),
    earned_at: earnedMap.get(b.id) ?? null,
  }));
  merged.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    return a.name.localeCompare(b.name, 'pt');
  });
  return merged;
}

export async function fetchUserLeagueWinsCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { data, error } = await supabase.rpc('count_user_league_wins', { p_user_id: userId });
  if (error) {
    console.warn('fetchUserLeagueWinsCount', error.message);
    return 0;
  }
  return typeof data === 'number' ? data : Number(data) || 0;
}

export async function fetchRanking(limit = 50): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_LIST_SELECT)
    .order('points', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Profile[];
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data as Profile;
}

/** Envia imagem para Storage e atualiza `profiles.avatar_url` (reflete em feed, ranking, perfis de outros). */
export async function updateProfileAvatar(userId: string, localImageUri: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase não configurado';
  const url = await uploadProfileAvatar(userId, localImageUri);
  if (!url) {
    return 'Não foi possível enviar a imagem. Confirme o bucket workout-photos e as policies no Supabase.';
  }
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
  return error?.message ?? null;
}

export async function fetchUserPosts(userId: string): Promise<PostWithAuthor[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  const posts = (data ?? []) as PostRow[];
  const prof = await fetchProfile(userId);
  return posts.map((row) => mapPost({ ...(row as unknown as Record<string, unknown>) }, prof));
}

export type FollowCounts = { followers: number; following: number };

export async function fetchFollowCounts(userId: string): Promise<FollowCounts> {
  if (!isSupabaseConfigured) return { followers: 0, following: 0 };
  const [followersRes, followingRes] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

async function profilesByIdsOrdered(ids: string[]): Promise<Profile[]> {
  if (!ids.length) return [];
  const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
  const map = Object.fromEntries((profs ?? []).map((p) => [p.id, p as Profile]));
  return ids.map((id) => map[id]).filter(Boolean) as Profile[];
}

export async function fetchFollowersProfiles(userId: string): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data: rows, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId)
    .order('created_at', { ascending: false });
  if (error || !rows?.length) return [];
  const ids = rows.map((r) => r.follower_id as string);
  return profilesByIdsOrdered(ids);
}

export async function fetchFollowingProfiles(userId: string): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data: rows, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });
  if (error || !rows?.length) return [];
  const ids = rows.map((r) => r.following_id as string);
  return profilesByIdsOrdered(ids);
}

/** Treinos de contas que você segue (o RLS filtra o que você pode ver). */
export async function fetchFollowingFeed(currentUserId: string | undefined): Promise<PostWithAuthor[]> {
  if (!isSupabaseConfigured || !currentUserId) return [];
  const { data: followsRows, error: fe } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);
  if (fe || !followsRows?.length) return [];
  const authorIds = [...new Set(followsRows.map((r) => r.following_id as string))];
  if (!authorIds.length) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .in('user_id', authorIds)
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) {
    console.warn('fetchFollowingFeed', error.message);
    return [];
  }
  const posts = (data ?? []) as PostRow[];
  const userIds = [...new Set(posts.map((p) => p.user_id))];
  let profileMap: Record<string, Profile> = {};
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds);
    profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p as Profile]));
  }
  const postIds = posts.map((r) => r.id);
  let liked = new Set<string>();
  let likeCounts: Record<string, number> = {};
  if (postIds.length) {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in('post_id', postIds);
    liked = new Set((likes ?? []).map((l) => l.post_id as string));
  }
  if (postIds.length) {
    const { data: counts } = await supabase.from('post_likes').select('post_id').in('post_id', postIds);
    for (const row of counts ?? []) {
      const pid = row.post_id as string;
      likeCounts[pid] = (likeCounts[pid] ?? 0) + 1;
    }
  }
  const commentCounts: Record<string, number> = {};
  if (postIds.length) {
    const { data: cc } = await supabase.from('post_comments').select('post_id').in('post_id', postIds);
    for (const row of cc ?? []) {
      const pid = row.post_id as string;
      commentCounts[pid] = (commentCounts[pid] ?? 0) + 1;
    }
  }
  return posts.map((row) =>
    mapPost({ ...(row as unknown as Record<string, unknown>) }, profileMap[row.user_id], {
      liked_by_me: liked.has(row.id),
      like_count: likeCounts[row.id] ?? 0,
      comment_count: commentCounts[row.id] ?? 0,
    }),
  );
}

/** Ranking entre você e quem você segue (inclui você). */
export async function fetchFriendsRanking(userId: string, limit = 80): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data: followsRows } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
  const ids = new Set<string>([userId]);
  for (const r of followsRows ?? []) ids.add(r.following_id as string);
  const idList = [...ids];
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_LIST_SELECT)
    .in('id', idList)
    .order('points', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Profile[];
}

/** Busca por @ ou nome (mín. 2 caracteres). */
export async function searchProfilesByQuery(query: string, limit = 25): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const raw = query.trim();
  if (raw.length < 2) return [];
  const safe = raw.replace(/%/g, '').replace(/_/g, '').slice(0, 40);
  if (safe.length < 2) return [];
  const pattern = `%${safe}%`;
  const [byUser, byName] = await Promise.all([
    supabase.from('profiles').select(PROFILE_LIST_SELECT).ilike('username', pattern).limit(limit),
    supabase.from('profiles').select(PROFILE_LIST_SELECT).ilike('display_name', pattern).limit(limit),
  ]);
  const map = new Map<string, Profile>();
  for (const row of [...(byUser.data ?? []), ...(byName.data ?? [])]) {
    const p = row as Profile;
    map.set(p.id, p);
  }
  return [...map.values()].slice(0, limit);
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(followerId: string, followingId: string, following: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (following) {
    await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  }
}

export async function logAlcohol(userId: string, note?: string, leagueId?: string | null): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase não configurado';
  const { error } = await supabase.from('alcohol_logs').insert({
    user_id: userId,
    note: note ?? null,
    league_id: leagueId ?? null,
  });
  return error?.message ?? null;
}

export type CreateLeagueResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

function formatSupabaseWriteError(
  context: string,
  error: { message?: string; code?: string; details?: string; hint?: string } | null,
): string {
  if (!error) return `${context}. Tenta de novo.`;
  const bits = [error.message, error.hint, error.details].filter(Boolean);
  const tail = bits.length ? bits.join(' — ') : `código ${error.code ?? '?'}`;
  return `${context}: ${tail}`;
}

export async function createLeague(
  creatorId: string,
  payload: {
    name: string;
    description?: string;
    league_type: 'free' | 'paid';
    entry_fee_cents: number;
    duration_days: number;
    max_participants: number;
    prize_distribution: LeagueRow['prize_distribution'];
  },
): Promise<CreateLeagueResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase não configurado. Verifica o .env.' };
  }
  const starts = new Date();
  const ends = new Date(starts.getTime() + payload.duration_days * 86400000);
  const { data, error } = await supabase
    .from('leagues')
    .insert({
      creator_id: creatorId,
      name: payload.name.trim(),
      description: payload.description?.trim() ?? null,
      league_type: payload.league_type,
      entry_fee_cents: payload.league_type === 'paid' ? Math.max(0, payload.entry_fee_cents) : 0,
      duration_days: payload.duration_days,
      max_participants: payload.max_participants,
      prize_distribution: payload.prize_distribution,
      status: 'active',
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      rules_locked_at: starts.toISOString(),
      rules_json: {
        workout_points: 1,
        inactivity_penalty: 2,
        alcohol_penalty: 15,
        progressive_inactivity: false,
      },
      prize_pool_cents: 0,
    })
    .select('id')
    .single();
  if (error || !data) {
    console.warn('createLeague insert leagues', error);
    return {
      ok: false,
      message: formatSupabaseWriteError('Não foi possível criar a liga', error),
    };
  }
  const leagueId = data.id as string;
  const { error: memErr } = await supabase.from('league_members').insert({
    league_id: leagueId,
    user_id: creatorId,
    payment_status: 'waived',
  });
  if (memErr && memErr.code !== '23505') {
    console.warn('createLeague insert league_members', memErr);
    await supabase.from('leagues').delete().eq('id', leagueId);
    return {
      ok: false,
      message: formatSupabaseWriteError(
        'A liga foi criada mas não foi possível adicionar-te como membro (entrada revertida)',
        memErr,
      ),
    };
  }
  return { ok: true, id: leagueId };
}

/** Remove a tua filiação (sair da liga). Requer política RLS de DELETE em `league_members`. */
export async function leaveLeagueMembership(leagueId: string, userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase não configurado';
  const { error } = await supabase.from('league_members').delete().eq('league_id', leagueId).eq('user_id', userId);
  if (error) {
    if (error.code === '42501' || error.message?.toLowerCase().includes('policy')) {
      return 'Sair da liga: atualiza o projeto no Supabase (migration `league_members` DELETE) ou contacta o suporte.';
    }
    return error.message;
  }
  return null;
}

/** Apenas o criador pode alterar nome e descrição (regras e duração ficam travadas). */
export async function updateLeagueByCreator(
  leagueId: string,
  creatorId: string,
  patch: { name?: string; description?: string | null },
): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase não configurado';
  const updates: Record<string, string | null> = {};
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.description !== undefined) updates.description = patch.description?.trim() ? patch.description.trim() : null;
  if (!Object.keys(updates).length) return null;
  const { error } = await supabase.from('leagues').update(updates).eq('id', leagueId).eq('creator_id', creatorId);
  return error?.message ?? null;
}

export async function createWorkoutPost(
  userId: string,
  input: {
    image_url: string;
    description: string;
    workout_date: string;
    visible_global: boolean;
    visible_followers: boolean;
    visible_league: boolean;
    workout_type: 'musculacao' | 'corrida' | 'lutas' | 'outros';
    /** Legado: uma liga. Preferir `league_ids`. */
    league_id?: string | null;
    /** Todas as ligas do feed da liga (a 1ª grava-se em `league_id`). */
    league_ids?: string[] | null;
  },
): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase não configurado';
  if (await hasWorkoutPostForDate(userId, input.workout_date)) return WORKOUT_DUPLICATE_DAY_MSG;
  const { primary, extras } = splitLeagueTargets(input);
  let usedLegacy = false;
  const descTrim = input.description.trim();
  const descriptionStored = descTrim || WORKOUT_DESCRIPTION_EMPTY_SENTINEL;
  const shape = await getPostsInsertShape();
  const wtInInsert = includeWorkoutTypeInInsert(shape);

  let inserted: { id: string } | null = null;
  let error = null as { message?: string } | null;

  if (!shape.modernVisibility) {
    usedLegacy = true;
    const leg = legacyVisibilityForInsert({ ...input, league_id: primary });
    const row: Record<string, unknown> = {
      user_id: userId,
      image_url: input.image_url,
      description: descriptionStored,
      workout_date: input.workout_date,
      visibility: leg.visibility,
      league_id: leg.league_id,
    };
    if (wtInInsert) row.workout_type = input.workout_type;
    let ins = await supabase.from('posts').insert(row).select('id').single();
    inserted = ins.data as { id: string } | null;
    error = ins.error;
    if (error && wtInInsert && isWorkoutTypeSchemaError(ins.error)) {
      await markWorkoutTypeColumnAbsent();
      delete row.workout_type;
      ins = await supabase.from('posts').insert(row).select('id').single();
      inserted = ins.data as { id: string } | null;
      error = ins.error;
    }
  } else {
    const baseRow = {
      user_id: userId,
      image_url: input.image_url,
      description: descriptionStored,
      workout_date: input.workout_date,
      visible_global: input.visible_global,
      visible_followers: input.visible_followers,
      visible_league: input.visible_league,
      league_id: primary ?? null,
      ...(wtInInsert ? { workout_type: input.workout_type } : {}),
    };
    let ins = await supabase.from('posts').insert(baseRow).select('id').single();
    inserted = ins.data as { id: string } | null;
    error = ins.error;
    if (error && wtInInsert && isWorkoutTypeSchemaError(ins.error)) {
      await markWorkoutTypeColumnAbsent();
      const { workout_type: _w, ...withoutType } = baseRow;
      ins = await supabase.from('posts').insert(withoutType).select('id').single();
      inserted = ins.data as { id: string } | null;
      error = ins.error;
    }
    if (error && isLegacyPostsSchemaError(ins.error)) {
      usedLegacy = true;
      shape.modernVisibility = false;
      const leg = legacyVisibilityForInsert({ ...input, league_id: primary });
      const legacyRow: Record<string, unknown> = {
        user_id: userId,
        image_url: input.image_url,
        description: descriptionStored,
        workout_date: input.workout_date,
        visibility: leg.visibility,
        league_id: leg.league_id,
      };
      if (includeWorkoutTypeInInsert(shape)) legacyRow.workout_type = input.workout_type;
      const retry = await supabase.from('posts').insert(legacyRow).select('id').single();
      inserted = retry.data as { id: string } | null;
      error = retry.error;
      if (error && includeWorkoutTypeInInsert(shape) && isWorkoutTypeSchemaError(retry.error)) {
        await markWorkoutTypeColumnAbsent();
        delete legacyRow.workout_type;
        const r2 = await supabase.from('posts').insert(legacyRow).select('id').single();
        inserted = r2.data as { id: string } | null;
        error = r2.error;
      }
    }
  }

  if (error) {
    if (isWorkoutDayUniqueViolation(error)) return WORKOUT_DUPLICATE_DAY_MSG;
    return error.message ?? null;
  }
  const postId = inserted?.id;
  if (!postId) return 'Erro ao criar post';

  if (!usedLegacy && extras.length) {
    const extraErr = await insertPostLeagueAudiences(postId, extras);
    if (extraErr) {
      await supabase.from('posts').delete().eq('id', postId);
      return extraErr;
    }
  }

  const patchErr = await applyWorkoutTypeAfterInsert(postId, input.workout_type, cachedPostsInsertShape ?? shape);
  if (patchErr) return patchErr;

  return null;
}

/** Post no feed com `post_kind: alcohol` (−15 pts via trigger). Sem coluna `post_kind`, cai em `alcohol_logs` só (sem post). */
export async function createAlcoholPost(
  userId: string,
  input: {
    image_url: string;
    description: string;
    workout_date: string;
    visible_global: boolean;
    visible_followers: boolean;
    visible_league: boolean;
    league_id?: string | null;
    league_ids?: string[] | null;
  },
): Promise<{ error: string | null; feedPost: boolean }> {
  if (!isSupabaseConfigured) return { error: 'Supabase não configurado', feedPost: false };
  const trimmed = input.description.trim();
  const { primary, extras } = splitLeagueTargets(input);
  let usedLegacy = false;
  const base = {
    user_id: userId,
    image_url: input.image_url,
    description: trimmed,
    workout_date: input.workout_date,
    visible_global: input.visible_global,
    visible_followers: input.visible_followers,
    visible_league: input.visible_league,
    league_id: primary ?? null,
    post_kind: 'alcohol' as const,
  };
  let { data: inserted, error } = await supabase.from('posts').insert(base).select('id').single();
  if (error && isLegacyPostsSchemaError(error)) {
    usedLegacy = true;
    const leg = legacyVisibilityForInsert({ ...input, league_id: primary });
    const retry = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        image_url: input.image_url,
        description: trimmed,
        workout_date: input.workout_date,
        visibility: leg.visibility,
        league_id: leg.league_id,
        post_kind: 'alcohol',
      })
      .select('id')
      .single();
    inserted = retry.data;
    error = retry.error;
  }
  if (error && isPostKindSchemaError(error)) {
    const alt = await logAlcohol(userId, trimmed || undefined, primary ?? null);
    return {
      error:
        alt ??
        'Servidor sem coluna post_kind: penalidade registrada em log, mas não aparece no feed. Atualize o schema.',
      feedPost: false,
    };
  }
  if (error) return { error: error.message ?? 'Erro ao publicar', feedPost: false };
  const postId = (inserted as { id: string } | null)?.id;
  if (!postId) return { error: 'Erro ao criar post', feedPost: false };

  if (!usedLegacy && extras.length) {
    const extraErr = await insertPostLeagueAudiences(postId, extras);
    if (extraErr) {
      await supabase.from('posts').delete().eq('id', postId);
      return { error: extraErr, feedPost: false };
    }
  }
  return { error: null, feedPost: true };
}

export async function fetchPostById(postId: string): Promise<PostWithAuthor | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('posts').select('*').eq('id', postId).single();
  if (error || !data) return null;
  const row = data as PostRow;
  const prof = await fetchProfile(row.user_id);
  return mapPost({ ...(row as unknown as Record<string, unknown>) }, prof);
}

export type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profile?: Profile | null;
};

export async function fetchPostComments(postId: string): Promise<CommentRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('post_comments')
    .select('id, body, created_at, user_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  const uids = [...new Set(data.map((c) => c.user_id as string))];
  let profileMap: Record<string, Profile> = {};
  if (uids.length) {
    const { data: profs } = await supabase.from('profiles').select('*').in('id', uids);
    profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p as Profile]));
  }
  return data.map((c) => ({
    id: c.id as string,
    body: c.body as string,
    created_at: c.created_at as string,
    user_id: c.user_id as string,
    profile: profileMap[c.user_id as string],
  }));
}

export async function addPostComment(postId: string, userId: string, body: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase não configurado';
  const { error } = await supabase.from('post_comments').insert({
    post_id: postId,
    user_id: userId,
    body: body.trim(),
  });
  return error?.message ?? null;
}
