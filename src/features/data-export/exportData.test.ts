import { initialState } from '../../stores/appState';
import { buildExport, exportFileName } from './exportData';

describe('data export', () => {
  const now = new Date('2026-11-20T08:00:00Z');

  it('contains all saved state and a format version', () => {
    const state = { ...initialState(), totalXp: 42 };
    const out = buildExport(state, now, 'a@b.c');
    expect(out).toMatchObject({
      format: 'olaa-language-export',
      formatVersion: 1,
      exportedAt: '2026-11-20T08:00:00.000Z',
      account: { email: 'a@b.c' },
    });
    expect(JSON.parse(JSON.stringify(out)).data).toEqual(state);
  });

  it('names the file by date', () => {
    expect(exportFileName(now)).toBe('olaa-language-2026-11-20.json');
  });
});
