export const MAX_HEARTS = 5;
/** One heart refills every 30 minutes. */
export const HEART_REFILL_MS = 30 * 60 * 1000;

export interface HeartsState {
  current: number;
  /** When `current` was last recalculated (ms since epoch). */
  updatedAt: number;
}

/** Applies time-based refill. Pure: returns the effective hearts at `now`. */
export function currentHearts(hearts: HeartsState, now: number): HeartsState {
  if (hearts.current >= MAX_HEARTS) return { current: MAX_HEARTS, updatedAt: now };
  const elapsed = Math.max(0, now - hearts.updatedAt);
  const refills = Math.floor(elapsed / HEART_REFILL_MS);
  if (refills === 0) return hearts;
  const current = Math.min(MAX_HEARTS, hearts.current + refills);
  // Keep the partial progress toward the next heart.
  const updatedAt = current >= MAX_HEARTS ? now : hearts.updatedAt + refills * HEART_REFILL_MS;
  return { current, updatedAt };
}

export function loseHeart(hearts: HeartsState, now: number): HeartsState {
  const effective = currentHearts(hearts, now);
  const wasFull = effective.current >= MAX_HEARTS;
  return {
    current: Math.max(0, effective.current - 1),
    // Refill timer starts when you drop below full.
    updatedAt: wasFull ? now : effective.updatedAt,
  };
}

export function gainHeart(hearts: HeartsState, now: number, amount = 1): HeartsState {
  const effective = currentHearts(hearts, now);
  const current = Math.min(MAX_HEARTS, effective.current + amount);
  return { current, updatedAt: current >= MAX_HEARTS ? now : effective.updatedAt };
}

/** Milliseconds until the next heart, or null when full. */
export function msUntilNextHeart(hearts: HeartsState, now: number): number | null {
  const effective = currentHearts(hearts, now);
  if (effective.current >= MAX_HEARTS) return null;
  return HEART_REFILL_MS - (now - effective.updatedAt);
}
