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
};

export type PostRow = {
  id: string;
  user_id: string;
  image_url: string;
  description: string;
  workout_date: string;
  visibility: 'global' | 'followers' | 'league_only';
  league_id: string | null;
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

export type LeagueMemberRow = {
  league_id: string;
  user_id: string;
  points_in_league: number;
  payment_status: 'unpaid' | 'paid' | 'waived';
  abandoned: boolean;
  profile?: Profile;
};
