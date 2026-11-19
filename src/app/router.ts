import { useSyncExternalStore } from 'react';
import type { CurriculumLang } from '../features/levels/types';

const LANGS: readonly string[] = ['en', 'es', 'zh'];
const isLang = (v: string | undefined): v is CurriculumLang => !!v && LANGS.includes(v);

export type Route =
  | { name: 'learn' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'practice' }
  | { name: 'practice-session'; kind: 'mistakes' | 'mix' }
  | { name: 'review' }
  | { name: 'profile' }
  | { name: 'levels' }
  | { name: 'level'; lang: CurriculumLang; level: string }
  | { name: 'unit'; lang: CurriculumLang; level: string; unitId: string; challenge?: boolean }
  | { name: 'level-test'; lang: CurriculumLang; level: string }
  | { name: 'level-review'; lang: CurriculumLang }
  | { name: 'topics' }
  | { name: 'topic'; topicId: string }
  | { name: 'topic-practice'; topicId: string; lang: CurriculumLang };

/** Tiny hash router: works on any static host with no server rewrites. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [head, arg] = parts;
  const [, a, b, c, d] = parts.map((p) => decodeURIComponent(p));
  switch (head) {
    case 'levels':
      return { name: 'levels' };
    case 'level':
      return isLang(a) && b ? { name: 'level', lang: a, level: b } : { name: 'levels' };
    case 'unit':
      return isLang(a) && b && c
        ? {
            name: 'unit',
            lang: a,
            level: b,
            unitId: c,
            ...(d === 'challenge' ? { challenge: true } : {}),
          }
        : { name: 'levels' };
    case 'test':
      return isLang(a) && b ? { name: 'level-test', lang: a, level: b } : { name: 'levels' };
    case 'words':
      return isLang(a) ? { name: 'level-review', lang: a } : { name: 'levels' };
    case 'topics':
      return { name: 'topics' };
    case 'topic':
      if (!a) return { name: 'topics' };
      return isLang(b) && c === 'practice'
        ? { name: 'topic-practice', topicId: a, lang: b }
        : { name: 'topic', topicId: a };
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
    case 'level':
      return `#/level/${route.lang}/${encodeURIComponent(route.level)}`;
    case 'unit':
      return `#/unit/${route.lang}/${encodeURIComponent(route.level)}/${encodeURIComponent(route.unitId)}${route.challenge ? '/challenge' : ''}`;
    case 'level-test':
      return `#/test/${route.lang}/${encodeURIComponent(route.level)}`;
    case 'level-review':
      return `#/words/${route.lang}`;
    case 'topic':
      return `#/topic/${encodeURIComponent(route.topicId)}`;
    case 'topic-practice':
      return `#/topic/${encodeURIComponent(route.topicId)}/${route.lang}/practice`;
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
