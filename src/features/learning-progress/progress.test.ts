import { recordActivity, visibleStreak } from './streak';

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
