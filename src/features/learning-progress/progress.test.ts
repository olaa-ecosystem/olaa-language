import { currentHearts, gainHeart, HEART_REFILL_MS, loseHeart, msUntilNextHeart } from './hearts';
import { recordActivity, visibleStreak } from './streak';

describe('hearts', () => {
  const t0 = 1_000_000;

  it('loses a heart and starts the refill timer when dropping from full', () => {
    const after = loseHeart({ current: 5, updatedAt: 0 }, t0);
    expect(after).toEqual({ current: 4, updatedAt: t0 });
    expect(msUntilNextHeart(after, t0)).toBe(HEART_REFILL_MS);
  });

  it('refills over time without exceeding the maximum', () => {
    const hearts = { current: 2, updatedAt: t0 };
    expect(currentHearts(hearts, t0 + HEART_REFILL_MS * 2 + 5).current).toBe(4);
    expect(currentHearts(hearts, t0 + HEART_REFILL_MS * 10).current).toBe(5);
  });

  it('never drops below zero and can be topped up', () => {
    expect(loseHeart({ current: 0, updatedAt: t0 }, t0).current).toBe(0);
    expect(gainHeart({ current: 0, updatedAt: t0 }, t0).current).toBe(1);
    expect(msUntilNextHeart({ current: 5, updatedAt: t0 }, t0)).toBeNull();
  });
});

describe('streak', () => {
  const empty = { count: 0, longest: 0, lastActive: null };

  it('starts, continues and resets', () => {
    const day1 = recordActivity(empty, '2026-11-17');
    const day2 = recordActivity(day1, '2026-11-18');
    expect(day2).toEqual({ count: 2, longest: 2, lastActive: '2026-11-18' });
    expect(recordActivity(day2, '2026-11-18')).toBe(day2);
    expect(recordActivity(day2, '2026-11-21')).toEqual({
      count: 1,
      longest: 2,
      lastActive: '2026-11-21',
    });
  });

  it('shows 0 once a full day was missed', () => {
    const streak = { count: 4, longest: 4, lastActive: '2026-11-18' };
    expect(visibleStreak(streak, '2026-11-19')).toBe(4);
    expect(visibleStreak(streak, '2026-11-20')).toBe(0);
  });
});
