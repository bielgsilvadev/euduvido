export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  points: number;
  level: number;
  streak_current: number;
  streak_best: number;
  onboarding_completed: boolean;
  created_at: string;
  /** Eu Duvido! — opcional até a migration `eu_duvido_challenges` estar aplicada. */
  total_challenges_created?: number;
  total_challenges_completed?: number;
  total_challenges_failed?: number;
  total_money_won?: number;
  total_money_lost?: number;
  total_money_donated?: number;
  reputation_score?: number;
};

export type ChallengeRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  cover_image_url: string | null;
  bet_amount: number;
  currency: string;
  failure_destination: 'charity' | 'friend' | 'rival' | 'developers';
  failure_destination_details: Record<string, unknown> | null;
  start_date: string;
  end_date: string;
  status: string;
  is_public: boolean;
  proof_type: string;
  proof_frequency: string | null;
  tags: string[] | null;
  views_count: number;
  cheers_count: number;
  doubters_count: number;
  escrow_payment_intent_id: string | null;
  escrow_status: string;
  created_at: string;
  updated_at: string;
};

export type PayoutDestination = 'winner' | 'developers';

export type ChallengeDuelMeta = {
  mode: 'open' | 'direct';
  challenged_id?: string | null;
  challenged_username?: string | null;
  arbiter_id?: string | null;
  arbiter_username?: string | null;
};

export type ChallengeMeta = {
  /** Legado: desafios antigos (caridade / terceiro). */
  destination_label?: string;
  payout_destination?: PayoutDestination | 'charity' | 'third_party';
  payout_fee_percent?: number;
  duel?: ChallengeDuelMeta;
  [k: string]: unknown;
};

export type ChallengeWithCreator = ChallengeRow & {
  creator?: Profile;
  my_reaction?: 'cheer' | 'doubt' | null;
  comments_count?: number;
};

export type PostRow = {
  id: string;
  user_id: string;
  image_url: string;
  description: string;
  workout_date: string;
  /** Colunas novas (após migration multi-visibilidade). */
  visible_global?: boolean;
  visible_followers?: boolean;
  visible_league?: boolean;
  /** Enum legado quando a migration `post_multi_visibility` ainda não correu. */
  visibility?: 'global' | 'followers' | 'league_only';
  league_id: string | null;
  /** `'alcohol'`: post de honestidade (−15 pts); omitido ou `'workout'` = treino. */
  post_kind?: 'workout' | 'alcohol';
  /** Categoria escolhida ao publicar treino; ausente em posts antigos ou álcool. */
  workout_type?: 'musculacao' | 'corrida' | 'lutas' | 'outros' | null;
  created_at: string;
};

export type PostWithAuthor = PostRow & {
  author?: Profile;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
};

export type LeagueRow = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  league_type: 'free' | 'paid';
  entry_fee_cents: number;
  duration_days: number;
  max_participants: number;
  prize_distribution: 'winner_take_all' | 'top_3' | 'proportional';
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  prize_pool_cents: number;
  starts_at: string;
  ends_at: string | null;
  rules_locked_at: string | null;
};

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon_key: string;
};

export type UserBadgeEarned = {
  badge_id: string;
  earned_at: string;
};

export type BadgeWithEarned = BadgeDefinition & {
  earned: boolean;
  earned_at: string | null;
};

export type LeagueMemberRow = {
  league_id: string;
  user_id: string;
  points_in_league: number;
  payment_status: 'unpaid' | 'paid' | 'waived';
  abandoned: boolean;
  profile?: Profile;
};
