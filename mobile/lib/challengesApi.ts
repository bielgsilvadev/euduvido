import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ChallengeMeta, ChallengeWithCreator, PayoutDestination, Profile } from '@/types/models';

const CHALLENGE_SELECT = `
  id,
  creator_id,
  title,
  description,
  category,
  cover_image_url,
  bet_amount,
  currency,
  failure_destination,
  failure_destination_details,
  start_date,
  end_date,
  status,
  is_public,
  proof_type,
  proof_frequency,
  tags,
  views_count,
  cheers_count,
  doubters_count,
  escrow_payment_intent_id,
  escrow_status,
  created_at,
  updated_at
`;

const CREATOR_EMBED =
  'creator:profiles!challenges_creator_id_fkey ( id, username, display_name, avatar_url, bio, points, level, streak_current, streak_best, onboarding_completed, created_at )';

const SELECT_WITH_CREATOR = `${CHALLENGE_SELECT}, ${CREATOR_EMBED}`;

const FEED_STATUSES = ['active', 'pending_proof', 'judging'] as const;

async function challengesRowsWithReactions(
  rows: Record<string, unknown>[],
  currentUserId?: string | null,
): Promise<ChallengeWithCreator[]> {
  const reactionByChallenge = new Map<string, 'cheer' | 'doubt'>();
  if (currentUserId && rows.length) {
    const ids = rows.map((r) => r.id as string);
    const { data: rx } = await supabase
      .from('challenge_reactions')
      .select('challenge_id, reaction_type')
      .eq('user_id', currentUserId)
      .in('challenge_id', ids);
    for (const r of rx ?? []) {
      if (r.reaction_type === 'cheer' || r.reaction_type === 'doubt') {
        reactionByChallenge.set(r.challenge_id as string, r.reaction_type);
      }
    }
  }
  return rows.map((row) => {
    const { creator: cr, ...rest } = row;
    const id = rest.id as string;
    return mapChallengeRow(rest, cr as Profile, reactionByChallenge.get(id) ?? null);
  });
}

function mapChallengeRow(
  row: Record<string, unknown>,
  creator?: Profile | null,
  myReaction?: 'cheer' | 'doubt' | null,
): ChallengeWithCreator {
  const r = row as ChallengeWithCreator;
  return {
    ...r,
    creator: creator ?? (row.creator as Profile) ?? undefined,
    my_reaction: myReaction ?? r.my_reaction ?? null,
  };
}

function isMissingChallengesTable(err: { message?: string; code?: string } | null): boolean {
  const m = (err?.message ?? '').toLowerCase();
  const c = String(err?.code ?? '');
  if (c === 'PGRST205' || c === 'PGRST202') return true;
  return (
    /challenges/.test(m) &&
    (/does not exist|could not find|schema cache|relation/i.test(m) || /42p01/i.test(m))
  );
}

export async function fetchPublicChallenges(
  limit = 40,
  currentUserId?: string | null,
): Promise<ChallengeWithCreator[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('challenges')
    .select(SELECT_WITH_CREATOR)
    .eq('is_public', true)
    .in('status', [...FEED_STATUSES])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingChallengesTable(error)) return [];
    console.warn('fetchPublicChallenges', error.message);
    return [];
  }

  return challengesRowsWithReactions((data ?? []) as Record<string, unknown>[], currentUserId);
}

/** Desafios em que participas: criaste ou estás aceite como desafiado/árbitro/etc. */
export async function fetchMineFeedChallenges(userId: string, limit = 50): Promise<ChallengeWithCreator[]> {
  if (!isSupabaseConfigured || !userId) return [];
  const [{ data: createdRows, error: e1 }, { data: partRows, error: e2 }] = await Promise.all([
    supabase
      .from('challenges')
      .select('id')
      .eq('creator_id', userId)
      .in('status', [...FEED_STATUSES])
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('challenge_participants').select('challenge_id').eq('user_id', userId).eq('status', 'accepted'),
  ]);
  if (e1 && !isMissingChallengesTable(e1)) console.warn('fetchMineFeedChallenges created', e1.message);
  if (e2) console.warn('fetchMineFeedChallenges participants', e2.message);

  const idSet = new Set<string>();
  for (const r of createdRows ?? []) idSet.add(r.id as string);
  for (const r of partRows ?? []) idSet.add(r.challenge_id as string);
  const ids = [...idSet].slice(0, Math.max(limit, 80));
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('challenges')
    .select(SELECT_WITH_CREATOR)
    .in('id', ids)
    .in('status', [...FEED_STATUSES])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingChallengesTable(error)) return [];
    console.warn('fetchMineFeedChallenges', error.message);
    return [];
  }
  return challengesRowsWithReactions((data ?? []) as Record<string, unknown>[], userId);
}

/** Apostas públicas criadas por quem segues. */
export async function fetchFriendsFeedChallenges(userId: string, limit = 50): Promise<ChallengeWithCreator[]> {
  if (!isSupabaseConfigured || !userId) return [];
  const { data: followsRows, error: fe } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (fe) {
    console.warn('fetchFriendsFeedChallenges follows', fe.message);
    return [];
  }
  const friendIds = [...new Set((followsRows ?? []).map((r) => r.following_id as string))];
  if (!friendIds.length) return [];

  const { data, error } = await supabase
    .from('challenges')
    .select(SELECT_WITH_CREATOR)
    .in('creator_id', friendIds.slice(0, 120))
    .eq('is_public', true)
    .in('status', [...FEED_STATUSES])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingChallengesTable(error)) return [];
    console.warn('fetchFriendsFeedChallenges', error.message);
    return [];
  }
  return challengesRowsWithReactions((data ?? []) as Record<string, unknown>[], userId);
}

export async function fetchChallengeById(
  id: string,
  currentUserId?: string | null,
): Promise<ChallengeWithCreator | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('challenges').select(SELECT_WITH_CREATOR).eq('id', id).maybeSingle();

  if (error || !data) {
    if (error && !isMissingChallengesTable(error)) console.warn('fetchChallengeById', error.message);
    return null;
  }

  const row = data as Record<string, unknown>;
  const { creator: cr, ...rest } = row;
  let myReaction: 'cheer' | 'doubt' | null = null;
  if (currentUserId) {
    const { data: rx } = await supabase
      .from('challenge_reactions')
      .select('reaction_type')
      .eq('challenge_id', id)
      .eq('user_id', currentUserId)
      .maybeSingle();
    if (rx?.reaction_type === 'cheer' || rx?.reaction_type === 'doubt') {
      myReaction = rx.reaction_type;
    }
  }

  return mapChallengeRow(rest, cr as Profile, myReaction);
}

export async function fetchUserChallenges(creatorId: string, limit = 60): Promise<ChallengeWithCreator[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('challenges')
    .select(CHALLENGE_SELECT)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingChallengesTable(error)) return [];
    return [];
  }

  return (data ?? []).map((row) => mapChallengeRow(row as Record<string, unknown>));
}

export type ChallengePaymentMode = 'social' | 'stripe';

export type CreateChallengeInput = {
  title: string;
  description: string;
  category: string;
  bet_amount: number;
  payout_destination: PayoutDestination;
  payment_mode?: ChallengePaymentMode;
  open_challenge?: boolean;
  challenged_username?: string | null;
  arbiter_username?: string | null;
  start_date: string;
  end_date: string;
  proof_type: string;
  proof_frequency?: string | null;
  challenge_rules?: string | null;
  proof_requirements?: string | null;
  is_public: boolean;
  status?: 'draft' | 'active';
  cover_image_url?: string | null;
  stripe_function_name?: string | null;
};

export type CreateChallengeResult = {
  id: string | null;
  error: string | null;
  warning?: string | null;
  checkout_url?: string | null;
};

function normalizeUsername(input?: string | null): string | null {
  const raw = (input ?? '').trim().replace(/^@+/, '').toLowerCase();
  return raw || null;
}

async function resolveProfileByUsername(username: string): Promise<{ id: string; username: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username')
    .ilike('username', username)
    .maybeSingle();
  if (error || !data?.id || !data?.username) return null;
  return { id: data.id, username: data.username };
}

function failureDestinationFromPayout(dest: PayoutDestination): 'rival' | 'developers' {
  return dest === 'developers' ? 'developers' : 'rival';
}

export async function createChallenge(
  creatorId: string,
  input: CreateChallengeInput,
): Promise<CreateChallengeResult> {
  if (!isSupabaseConfigured) return { id: null, error: 'Supabase não configurado.' };
  const openChallenge = Boolean(input.open_challenge);
  const challengedUsername = normalizeUsername(input.challenged_username);
  const arbiterUsername = normalizeUsername(input.arbiter_username);

  if (!openChallenge && !challengedUsername) {
    return { id: null, error: 'Informe o @usuário desafiado ou marque como aposta aberta.' };
  }

  const challenged = challengedUsername ? await resolveProfileByUsername(challengedUsername) : null;
  if (challengedUsername && !challenged) {
    return { id: null, error: `Não encontrei o usuário @${challengedUsername}.` };
  }
  if (challenged?.id === creatorId) {
    return { id: null, error: 'Você não pode se desafiar em aposta P2P.' };
  }

  const arbiter = arbiterUsername ? await resolveProfileByUsername(arbiterUsername) : null;
  if (arbiterUsername && !arbiter) {
    return { id: null, error: `Não encontrei o árbitro @${arbiterUsername}.` };
  }
  if (arbiter?.id === creatorId || (challenged?.id && arbiter?.id === challenged.id)) {
    return { id: null, error: 'O árbitro precisa ser uma terceira pessoa no duelo.' };
  }

  const payoutDestination = input.payout_destination;
  const paymentMode = input.payment_mode ?? 'social';
  const failureDestination = failureDestinationFromPayout(payoutDestination);
  const rules = input.challenge_rules?.trim();
  const proofReq = input.proof_requirements?.trim();
  const meta: ChallengeMeta = {
    payout_destination: payoutDestination,
    payout_fee_percent: 10,
    payment: {
      mode: paymentMode,
      provider: paymentMode === 'stripe' ? 'stripe' : 'none',
      currency: 'BRL',
      each_side_amount: input.bet_amount,
      platform_fee_percent: 10,
    },
    ...(rules ? { challenge_rules: rules } : {}),
    ...(proofReq ? { proof_requirements: proofReq } : {}),
    duel: {
      mode: openChallenge ? 'open' : 'direct',
      challenged_id: challenged?.id ?? null,
      challenged_username: challenged?.username ?? challengedUsername,
      arbiter_id: arbiter?.id ?? null,
      arbiter_username: arbiter?.username ?? arbiterUsername,
    },
  };

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      creator_id: creatorId,
      title: input.title.trim(),
      description: input.description.trim() || '(sem descrição)',
      category: input.category,
      bet_amount: input.bet_amount,
      failure_destination: failureDestination,
      failure_destination_details: meta,
      start_date: input.start_date,
      end_date: input.end_date,
      proof_type: input.proof_type,
      proof_frequency: input.proof_frequency ?? null,
      is_public: input.is_public,
      status: input.status ?? 'active',
      cover_image_url: input.cover_image_url ?? null,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    return { id: null, error: error.message };
  }

  const challengeId = data?.id ?? null;
  if (challengeId) {
    const participants: Array<{
      challenge_id: string;
      user_id: string;
      role: 'judge' | 'supporter' | 'observer';
      invited_by: string;
      status: 'pending' | 'accepted';
    }> = [];

    if (challenged?.id) {
      participants.push({
        challenge_id: challengeId,
        user_id: challenged.id,
        role: 'supporter',
        invited_by: creatorId,
        status: 'pending',
      });
    }
    if (arbiter?.id) {
      participants.push({
        challenge_id: challengeId,
        user_id: arbiter.id,
        role: 'judge',
        invited_by: creatorId,
        status: 'pending',
      });
    }

    if (participants.length) {
      const { error: participantsError } = await supabase.from('challenge_participants').insert(participants);
      if (participantsError) {
        return {
          id: challengeId,
          error:
            'Desafio criado, mas falhou ao gravar convites de desafiado/árbitro. Verifique RLS de challenge_participants.',
        };
      }
    }

    if (paymentMode === 'stripe') {
      const functionName = (input.stripe_function_name ?? '').trim() || 'create_challenge_checkout';
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(functionName, {
        body: {
          challenge_id: challengeId,
          creator_id: creatorId,
          amount_each_side: input.bet_amount,
          currency: 'BRL',
          payout_destination: payoutDestination,
        },
      });

      if (checkoutError) {
        return {
          id: challengeId,
          error: null,
          warning:
            'Desafio criado, mas não foi possível iniciar o checkout Stripe. Verifique a Edge Function e as variáveis STRIPE no Supabase.',
        };
      }

      const checkoutUrl =
        (checkoutData as { checkout_url?: string; url?: string } | null)?.checkout_url ??
        (checkoutData as { checkout_url?: string; url?: string } | null)?.url ??
        null;

      return {
        id: challengeId,
        error: null,
        checkout_url: checkoutUrl,
      };
    }
  }
  return { id: challengeId, error: null };
}

export async function setChallengeReaction(
  challengeId: string,
  userId: string,
  reaction: 'cheer' | 'doubt' | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'offline' };
  if (reaction === null) {
    const { error } = await supabase
      .from('challenge_reactions')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }
  const { error } = await supabase.from('challenge_reactions').upsert(
    {
      challenge_id: challengeId,
      user_id: userId,
      reaction_type: reaction,
    },
    { onConflict: 'challenge_id,user_id' },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
