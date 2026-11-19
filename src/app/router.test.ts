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

  it('round-trips hrefs', () => {
    const route: Route = { name: 'lesson', lessonId: 'u2-food' };
    expect(parseRoute(routeHref(route))).toEqual(route);
  });
});
