/**
 * The glossary from the owner's lesson export (`content/<language>/glossary.json`): for every
 * unit, each word or phrase that appears in its theory, passage and questions, with its sound
 * (IPA, or pinyin for Chinese) and meaning in Vietnamese and English. 6–8k entries per language.
 *
 * Used for: tap-to-translate in reading passages and examples, the word search on the Words
 * page, and adding any word to the learner's flashcards.
 */
import { normalize, stripDiacritics } from '../../utils/text';
import { CURRICULUM_DIRS, type CurriculumLang } from '../levels/types';

export interface GlossEntry {
  /** As written in the content (Chinese: characters). */
  word: string;
  /** IPA (English, Spanish; Spanish also has a respelling) or pinyin (Chinese). */
  sound: string;
  vi: string;
  en: string;
  /** Unit the entry belongs to, e.g. "a1-1" or "h1-1". */
  unitId: string;
}

export interface Glossary {
  lang: CurriculumLang;
  entries: GlossEntry[];
  /** Lookup key (see `glossKey`) → entries, the entry of the earliest unit first. */
  index: Map<string, GlossEntry[]>;
  /** Longest entry, in characters (Chinese) or words (others); bounds phrase matching. */
  maxSpan: number;
}

/** Raw file shape: unit id → word → [sound, vi, en]. */
export type RawGlossary = Record<string, Record<string, unknown>>;

/** Lookup key: lower case, no apostrophes or punctuation. Chinese is kept as written. */
export function glossKey(text: string, lang: CurriculumLang): string {
  return lang === 'zh' ? text.trim() : normalize(text);
}

const span = (key: string, lang: CurriculumLang) =>
  lang === 'zh' ? [...key].length : key.split(' ').length;

/** Builds the glossary from the raw file. Malformed rows are skipped. Pure. */
export function buildGlossary(raw: RawGlossary, lang: CurriculumLang): Glossary {
  const entries: GlossEntry[] = [];
  const index = new Map<string, GlossEntry[]>();
  let maxSpan = 1;
  for (const [unitId, words] of Object.entries(raw ?? {})) {
    if (!words || typeof words !== 'object') continue;
    for (const [word, row] of Object.entries(words)) {
      if (!Array.isArray(row)) continue;
      const [sound, vi, en] = row as unknown[];
      if (typeof vi !== 'string' || !vi.trim()) continue;
      const entry: GlossEntry = {
        word,
        sound: typeof sound === 'string' ? sound : '',
        vi,
        en: typeof en === 'string' ? en : '',
        unitId,
      };
      entries.push(entry);
      const key = glossKey(word, lang);
      if (!key) continue;
      index.set(key, [...(index.get(key) ?? []), entry]);
      maxSpan = Math.max(maxSpan, Math.min(6, span(key, lang)));
    }
  }
  return { lang, entries, index, maxSpan };
}

/** The entry for a word, preferring the meaning given in `unitId` (meanings depend on context). */
export function lookup(g: Glossary, text: string, unitId?: string): GlossEntry | null {
  const found = g.index.get(glossKey(text, g.lang));
  if (!found?.length) return null;
  return found.find((e) => e.unitId === unitId) ?? found[0] ?? null;
}

export interface Token {
  text: string;
  /** Set when this piece of text is in the glossary. */
  entry: GlossEntry | null;
}

const WORD = /[\p{L}\p{M}][\p{L}\p{M}'’-]*/gu;

/**
 * Splits text into tappable pieces. Chinese has no spaces, so the longest glossary match is
 * taken at each position. English and Spanish match the longest phrase of up to `maxSpan`
 * words first ("nice to meet you"), then single words. Text between words is kept as is,
 * so joining every `text` gives back the input exactly.
 */
export function tokenizeForGloss(g: Glossary, text: string, unitId?: string): Token[] {
  return g.lang === 'zh' ? tokenizeChinese(g, text, unitId) : tokenizeSpaced(g, text, unitId);
}

function tokenizeChinese(g: Glossary, text: string, unitId?: string): Token[] {
  const chars = [...text];
  const out: Token[] = [];
  let plain = '';
  for (let i = 0; i < chars.length; ) {
    let matched = 0;
    let entry: GlossEntry | null = null;
    for (let len = Math.min(g.maxSpan, chars.length - i); len >= 1; len--) {
      entry = lookup(g, chars.slice(i, i + len).join(''), unitId);
      if (entry) {
        matched = len;
        break;
      }
    }
    if (matched) {
      if (plain) out.push({ text: plain, entry: null });
      plain = '';
      out.push({ text: chars.slice(i, i + matched).join(''), entry });
      i += matched;
    } else {
      plain += chars[i];
      i += 1;
    }
  }
  if (plain) out.push({ text: plain, entry: null });
  return out;
}

function tokenizeSpaced(g: Glossary, text: string, unitId?: string): Token[] {
  const words = [...text.matchAll(WORD)].map((m) => ({ start: m.index ?? 0, text: m[0] }));
  const out: Token[] = [];
  let cursor = 0;
  for (let i = 0; i < words.length; ) {
    let taken = 1;
    let entry: GlossEntry | null = null;
    for (let len = Math.min(g.maxSpan, words.length - i); len >= 1; len--) {
      const first = words[i]!;
      const last = words[i + len - 1]!;
      const phrase = text.slice(first.start, last.start + last.text.length);
      entry = lookup(g, phrase, unitId);
      if (entry) {
        taken = len;
        break;
      }
    }
    const first = words[i]!;
    const last = words[i + taken - 1]!;
    const end = last.start + last.text.length;
    if (first.start > cursor) out.push({ text: text.slice(cursor, first.start), entry: null });
    out.push({ text: text.slice(first.start, end), entry });
    cursor = end;
    i += taken;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), entry: null });
  return out;
}

const fold = (s: string) => stripDiacritics(s.toLowerCase()).replace(/\s+/g, ' ').trim();

/**
 * Search by the word, its sound (pinyin without tone marks works too) or its meaning.
 * Exact word matches come first, then words that start with the query, then meanings.
 * One result per distinct word.
 */
export function searchGlossary(g: Glossary, query: string, limit = 30): GlossEntry[] {
  const q = fold(query);
  if (!q) return [];
  const qNoSpace = q.replace(/ /g, '');
  const scored: { e: GlossEntry; score: number }[] = [];
  const seen = new Set<string>();
  for (const e of g.entries) {
    const key = glossKey(e.word, g.lang);
    if (seen.has(key)) continue;
    const word = fold(e.word);
    const sound = fold(e.sound).replace(/[ /ˈˌ.]/g, '');
    let score = -1;
    if (word === q) score = 0;
    else if (word.startsWith(q)) score = 1;
    else if (sound && sound.startsWith(qNoSpace)) score = 2;
    else if (fold(e.vi).split(/[,;()–]/).some((m) => m.trim() === q)) score = 3;
    else if (fold(e.vi).includes(q) || fold(e.en).includes(q)) score = 4;
    if (score < 0) continue;
    seen.add(key);
    scored.push({ e, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.e.word.length - b.e.word.length)
    .slice(0, limit)
    .map((s) => s.e);
}

/** A stable flashcard id for a glossary word, shared by every place it is added from. */
export function glossCardId(entry: GlossEntry): string {
  return `gloss:${entry.unitId}:${entry.word}`;
}

const files = import.meta.glob<RawGlossary>('../../../content/*/glossary.json', {
  import: 'default',
});
const cache = new Map<CurriculumLang, Promise<Glossary>>();

/** Loads one language's glossary on demand (its own download chunk). */
export function loadGlossary(lang: CurriculumLang): Promise<Glossary> {
  let pending = cache.get(lang);
  if (!pending) {
    const loader = files[`../../../content/${CURRICULUM_DIRS[lang]}/glossary.json`];
    pending = loader
      ? loader().then((raw) => buildGlossary(raw, lang))
      : Promise.resolve(buildGlossary({}, lang));
    pending.catch(() => cache.delete(lang));
    cache.set(lang, pending);
  }
  return pending;
}
