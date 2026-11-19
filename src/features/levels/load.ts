/**
 * Loads curriculum content. Each level file is its own chunk, fetched only when opened, so the
 * app does not download 4–5 MB of lessons up front.
 */
import { normalizeLevels, normalizeUnit } from './normalize';
import {
  CURRICULUM_DIRS,
  type Bi,
  type CurriculumLang,
  type LevelMeta,
  type LevelUnit,
} from './types';

type Loader = () => Promise<unknown>;

const levelFiles = import.meta.glob<unknown>('../../../content/*/levels/*.json', {
  import: 'default',
});
const metaFiles = import.meta.glob<{ name: Bi; levels: unknown }>('../../../content/*/meta.json', {
  import: 'default',
  eager: true,
});

export const CURRICULUM_LANGS: CurriculumLang[] = ['en', 'es', 'zh'];

export function languageName(lang: CurriculumLang): Bi {
  return metaFiles[`../../../content/${CURRICULUM_DIRS[lang]}/meta.json`]?.name ?? [lang, lang];
}

export function levelsOf(lang: CurriculumLang): LevelMeta[] {
  const meta = metaFiles[`../../../content/${CURRICULUM_DIRS[lang]}/meta.json`];
  return meta ? normalizeLevels(meta.levels) : [];
}

const cache = new Map<string, Promise<LevelUnit[]>>();

export function loadLevel(lang: CurriculumLang, code: string): Promise<LevelUnit[]> {
  const key = `${lang}/${code}`;
  let pending = cache.get(key);
  if (!pending) {
    const loader = levelFiles[`../../../content/${CURRICULUM_DIRS[lang]}/levels/${code}.json`] as
      | Loader
      | undefined;
    pending = loader
      ? loader().then((raw) =>
          (Array.isArray(raw) ? raw : [])
            .map((u) => normalizeUnit(u, code, lang))
            .filter((u): u is LevelUnit => u !== null),
        )
      : Promise.resolve([]);
    pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

let hanViet: Promise<Record<string, string>> | null = null;

/** Sino-Vietnamese reading of each character (Hán Việt), a strong memory aid for Vietnamese. */
export function loadHanViet(): Promise<Record<string, string>> {
  hanViet ??= import('../../../content/chinese/hanviet.json').then(
    (m) => m.default as Record<string, string>,
  );
  return hanViet;
}

export function hanVietOf(text: string, table: Record<string, string>): string {
  return [...text]
    .map((ch) => table[ch])
    .filter(Boolean)
    .join(' ');
}
