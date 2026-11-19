import { addDays, lastNDays, toDayKey } from './date';

describe('date utils', () => {
  it('formats local day keys', () => {
    expect(toDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('lists the last N days ending today', () => {
    expect(lastNDays('2026-11-19', 3)).toEqual(['2026-11-17', '2026-11-18', '2026-11-19']);
  });
});
