/** Alinhado a `profile_level_from_bet_count` no Supabase (migration 20260329160000). */
export const BETS_PER_LEVEL = 3;
export const MAX_USER_LEVEL = 99;

export function levelFromBetCount(bets: number): number {
  const b = Math.max(0, Math.floor(Number(bets) || 0));
  return Math.max(1, Math.min(MAX_USER_LEVEL, 1 + Math.floor(b / BETS_PER_LEVEL)));
}

export type UserLevelProgress = {
  level: number;
  /** Apostas já contadas dentro do nível atual (0 .. BETS_PER_LEVEL-1) */
  inLevel: number;
  betsUntilNext: number;
  maxed: boolean;
};

export function userLevelProgress(bets: number): UserLevelProgress {
  const b = Math.max(0, Math.floor(Number(bets) || 0));
  const level = levelFromBetCount(b);
  if (level >= MAX_USER_LEVEL) {
    return {
      level: MAX_USER_LEVEL,
      inLevel: BETS_PER_LEVEL,
      betsUntilNext: 0,
      maxed: true,
    };
  }
  const start = (level - 1) * BETS_PER_LEVEL;
  const nextThreshold = level * BETS_PER_LEVEL;
  return {
    level,
    inLevel: b - start,
    betsUntilNext: Math.max(0, nextThreshold - b),
    maxed: false,
  };
}
