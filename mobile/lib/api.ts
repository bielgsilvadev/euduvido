import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { LeagueMemberRow, LeagueRow, PostRow, PostWithAuthor, Profile } from '@/types/models';

function mapPost(row: Record<string, unknown>, author?: Profile | null, extras?: Partial<PostWithAuthor>): PostWithAuthor {
  const p = row as PostWithAuthor;
  return {
    ...p,
    author: author ?? (row.profiles as Profile) ?? undefined,
    ...extras,
  };
}

export async function fetchLeaguePosts(leagueId: string, currentUserId: string | undefined): Promise<PostWithAuthor[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) {
    console.warn('fetchLeaguePosts', error.message);
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
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('visibility', 'global')
    .order('created_at', { ascending: false })
    .limit(40);

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

export async function fetchRanking(limit = 50): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, points, level, streak_current, streak_best, onboarding_completed, bio, created_at')
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
): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured) return null;
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
    console.warn('createLeague', error?.message);
    return null;
  }
  await supabase.from('league_members').insert({
    league_id: data.id,
    user_id: creatorId,
    payment_status: 'waived',
  });
  return { id: data.id as string };
}

export async function createWorkoutPost(
  userId: string,
  input: {
    image_url: string;
    description: string;
    workout_date: string;
    visibility: PostRow['visibility'];
    league_id?: string | null;
  },
): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase não configurado';
  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    image_url: input.image_url,
    description: input.description.trim(),
    workout_date: input.workout_date,
    visibility: input.visibility,
    league_id: input.league_id ?? null,
  });
  return error?.message ?? null;
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
