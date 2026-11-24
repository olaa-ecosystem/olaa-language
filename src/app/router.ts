/** Hash router: works on any static host (Firebase Hosting) with no rewrites. */
import { useSyncExternalStore } from 'react';
import type { CurriculumLang } from '../features/levels/types';

const isLang = (v: string | undefined): v is CurriculumLang => v === 'en' || v === 'es' || v === 'zh';

export type PracticeKind = 'mistakes' | 'mix' | 'sounds';

export type Route =
  | { name: 'today' }
  | { name: 'path' }
  | { name: 'level'; lang: CurriculumLang; level: string }
  | { name: 'unit'; lang: CurriculumLang; level: string; unitId: string; challenge: boolean }
  | { name: 'test'; lang: CurriculumLang; level: string }
  | { name: 'topics' }
  | { name: 'topic'; topicId: string }
  | { name: 'topic-practice'; topicId: string; lang: CurriculumLang }
  | { name: 'practice' }
  | { name: 'practice-session'; kind: PracticeKind }
  | { name: 'sounds' }
  | { name: 'words' }
  | { name: 'review' }
  | { name: 'notes' }
  | { name: 'me' };

/** Main sections, for the navigation. */
export type Section = 'today' | 'path' | 'topics' | 'practice' | 'words' | 'me';

export function sectionOf(route: Route): Section {
  switch (route.name) {
    case 'path':
    case 'level':
    case 'unit':
    case 'test':
      return 'path';
    case 'topics':
    case 'topic':
    case 'topic-practice':
      return 'topics';
    case 'practice':
    case 'practice-session':
    case 'sounds':
      return 'practice';
    case 'words':
    case 'review':
      return 'words';
    case 'me':
    case 'notes':
      return 'me';
    default:
      return 'today';
  }
}

/** Full-screen sessions hide the navigation and app switcher (UI buttons PRD 7.3). */
export function isSession(route: Route): boolean {
  return (
    (route.name === 'unit' && route.challenge) ||
    route.name === 'test' ||
    route.name === 'topic-practice' ||
    route.name === 'practice-session' ||
    route.name === 'review'
  );
}

export function parseRoute(hash: string): Route {
  const parts = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    });
  const [head, a, b, c, d] = parts;
  switch (head) {
    case 'path':
      return { name: 'path' };
    case 'level':
      return isLang(a) && b ? { name: 'level', lang: a, level: b } : { name: 'path' };
    case 'unit':
      return isLang(a) && b && c
        ? { name: 'unit', lang: a, level: b, unitId: c, challenge: d === 'challenge' }
        : { name: 'path' };
    case 'test':
      return isLang(a) && b ? { name: 'test', lang: a, level: b } : { name: 'path' };
    case 'topics':
      return { name: 'topics' };
    case 'topic':
      if (!a) return { name: 'topics' };
      return isLang(b) && c === 'practice'
        ? { name: 'topic-practice', topicId: a, lang: b }
        : { name: 'topic', topicId: a };
    case 'practice':
      return a === 'mistakes' || a === 'mix' || a === 'sounds'
        ? { name: 'practice-session', kind: a }
        : { name: 'practice' };
    case 'sounds':
      return { name: 'sounds' };
    case 'words':
      return a === 'review' ? { name: 'review' } : { name: 'words' };
    case 'notes':
      return { name: 'notes' };
    case 'me':
      return { name: 'me' };
    default:
      return { name: 'today' };
  }
}

const enc = encodeURIComponent;

export function href(route: Route): string {
  switch (route.name) {
    case 'today':
      return '#/';
    case 'level':
      return `#/level/${route.lang}/${enc(route.level)}`;
    case 'unit':
      return `#/unit/${route.lang}/${enc(route.level)}/${enc(route.unitId)}${route.challenge ? '/challenge' : ''}`;
    case 'test':
      return `#/test/${route.lang}/${enc(route.level)}`;
    case 'topic':
      return `#/topic/${enc(route.topicId)}`;
    case 'topic-practice':
      return `#/topic/${enc(route.topicId)}/${route.lang}/practice`;
    case 'practice-session':
      return `#/practice/${route.kind}`;
    case 'review':
      return '#/words/review';
    default:
      return `#/${route.name}`;
  }
}

export function navigate(route: Route | string): void {
  window.location.hash = typeof route === 'string' ? route : href(route);
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return parseRoute(hash);
}

/** Sibling Olaa apps (Firebase Hosting sites in project olaa-ecosystem). */
export const OLAA_APPS = {
  note: 'https://olaa-takenote.web.app/',
  habits: 'https://olaa-habits.web.app/',
} as const;
