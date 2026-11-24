import { describe, expect, it } from 'vitest';
import { href, isSession, parseRoute, sectionOf, type Route } from './router';

const routes: Route[] = [
  { name: 'today' },
  { name: 'path' },
  { name: 'level', lang: 'zh', level: 'HSK1' },
  { name: 'unit', lang: 'en', level: 'A1', unitId: 'a1-1', challenge: false },
  { name: 'unit', lang: 'es', level: 'B2', unitId: 'b2-3', challenge: true },
  { name: 'test', lang: 'en', level: 'C1' },
  { name: 'topics' },
  { name: 'topic', topicId: 'chu-de-1' },
  { name: 'topic-practice', topicId: 'chu-de-1', lang: 'zh' },
  { name: 'practice' },
  { name: 'practice-session', kind: 'sounds' },
  { name: 'sounds' },
  { name: 'words' },
  { name: 'review' },
  { name: 'notes' },
  { name: 'me' },
];

describe('router', () => {
  it.each(routes)('round-trips %o', (route) => {
    expect(parseRoute(href(route))).toEqual(route);
  });

  it('falls back on bad input', () => {
    expect(parseRoute('#/level/fr/A1')).toEqual({ name: 'path' });
    expect(parseRoute('#/nope')).toEqual({ name: 'today' });
    expect(parseRoute('#/topic/%E0%A4%A')).toEqual({ name: 'topic', topicId: '%E0%A4%A' });
  });

  it('knows sections and full-screen sessions', () => {
    expect(sectionOf({ name: 'review' })).toBe('words');
    expect(sectionOf({ name: 'notes' })).toBe('me');
    expect(isSession({ name: 'test', lang: 'en', level: 'A1' })).toBe(true);
    expect(isSession({ name: 'unit', lang: 'en', level: 'A1', unitId: 'x', challenge: false })).toBe(false);
  });
});
