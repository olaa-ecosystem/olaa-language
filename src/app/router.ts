import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'learn' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'practice' }
  | { name: 'practice-session'; kind: 'mistakes' | 'mix' }
  | { name: 'review' }
  | { name: 'profile' };

/** Tiny hash router: works on any static host with no server rewrites. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [head, arg] = parts;
  switch (head) {
    case 'lesson':
      return arg ? { name: 'lesson', lessonId: decodeURIComponent(arg) } : { name: 'learn' };
    case 'practice':
      return arg === 'mistakes' || arg === 'mix'
        ? { name: 'practice-session', kind: arg }
        : { name: 'practice' };
    case 'review':
      return { name: 'review' };
    case 'profile':
      return { name: 'profile' };
    default:
      return { name: 'learn' };
  }
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'lesson':
      return `#/lesson/${encodeURIComponent(route.lessonId)}`;
    case 'practice-session':
      return `#/practice/${route.kind}`;
    default:
      return `#/${route.name}`;
  }
}

export function navigate(route: Route): void {
  window.location.hash = routeHref(route);
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

export function useHash(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  );
}
