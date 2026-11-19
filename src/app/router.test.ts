import { parseRoute, routeHref, type Route } from './router';

describe('router', () => {
  it.each<[string, Route]>([
    ['', { name: 'learn' }],
    ['#/learn', { name: 'learn' }],
    ['#/lesson/u1-greetings', { name: 'lesson', lessonId: 'u1-greetings' }],
    ['#/practice', { name: 'practice' }],
    ['#/practice/mistakes', { name: 'practice-session', kind: 'mistakes' }],
    ['#/practice/unknown', { name: 'practice' }],
    ['#/review', { name: 'review' }],
    ['#/profile', { name: 'profile' }],
    ['#/nope', { name: 'learn' }],
  ])('parses %s', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
  });

  it.each<Route>([
    { name: 'lesson', lessonId: 'u2-food' },
    { name: 'levels' },
    { name: 'level', lang: 'zh', level: 'HSK1' },
    { name: 'unit', lang: 'en', level: 'A1', unitId: 'a1-1' },
    { name: 'unit', lang: 'es', level: 'B1', unitId: 'es-b1-3', challenge: true },
    { name: 'level-test', lang: 'en', level: 'C1' },
    { name: 'level-review', lang: 'zh' },
    { name: 'topics' },
    { name: 'topic', topicId: 't01' },
    { name: 'topic-practice', topicId: 't15', lang: 'es' },
  ])('round-trips %o', (route) => {
    expect(parseRoute(routeHref(route))).toEqual(route);
  });

  it('rejects unknown curriculum languages', () => {
    expect(parseRoute('#/level/fr/A1')).toEqual({ name: 'levels' });
  });
});
