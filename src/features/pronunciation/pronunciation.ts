/**
 * Pronunciation material from the owner's export (`content/<language>/pronunciation.json`):
 * a sound chart, minimal pairs, word stress (English, Spanish), tones (Chinese) and links to
 * dictionaries with audio. Turned here into listening drills that use the browser voice.
 */
import { tr } from '../../i18n/locale';
import { createRng, shuffle } from '../../utils/random';
import type { ChoiceExercise } from '../exercises';
import { CURRICULUM_DIRS, type Bi, type CurriculumLang } from '../levels/types';

export interface SoundRow {
  symbol: string;
  examples: string;
  tip: Bi;
}

export interface SoundGroup {
  title: Bi;
  rows: SoundRow[];
}

export interface MinimalPair {
  a: string;
  b: string;
  contrast: string;
}

export interface StressWord {
  word: string;
  syllables: string[];
  stressed: number;
}

export interface ToneSet {
  syllable: string;
  hanzi: string[];
  pinyin: string[];
}

export interface PronunciationSource {
  name: string;
  about: Bi;
  /** URL with `{w}` where the word goes, or a plain URL. */
  url: string;
}

export interface Pronunciation {
  lang: CurriculumLang;
  chart: SoundGroup[];
  pairs: MinimalPair[];
  stress: StressWord[];
  tones: ToneSet[];
  sources: PronunciationSource[];
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const bi = (v: unknown): Bi =>
  Array.isArray(v) ? [str(v[0]), str(v[1]) || str(v[0])] : [str(v), str(v)];
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Reads the raw file. Malformed rows are dropped. Pure. */
export function parsePronunciation(raw: unknown, lang: CurriculumLang): Pronunciation {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    lang,
    chart: arr(r.chart)
      .map((g) => arr(g))
      .map(([title, rows]) => ({
        title: bi(title),
        rows: arr(rows)
          .map((row) => arr(row))
          .filter((row) => str(row[0]))
          .map((row) => ({
            symbol: str(row[0]),
            examples: str(row[1]),
            tip: [str(row[2]), str(row[3]) || str(row[2])] as Bi,
          })),
      }))
      .filter((g) => g.rows.length > 0),
    pairs: arr(r.pairs)
      .map((p) => arr(p))
      .filter((p) => str(p[0]) && str(p[1]))
      .map((p) => ({ a: str(p[0]), b: str(p[1]), contrast: str(p[2]) })),
    stress: arr(r.stress)
      .map((s) => arr(s))
      .map((s) => ({
        word: str(s[0]),
        syllables: arr(s[1]).map(str),
        stressed: typeof s[2] === 'number' ? s[2] : -1,
      }))
      .filter((s) => s.word && s.syllables.length > 1 && s.syllables[s.stressed] !== undefined),
    tones: arr(r.tones)
      .map((t) => arr(t))
      .map((t) => ({ syllable: str(t[0]), hanzi: arr(t[1]).map(str), pinyin: arr(t[2]).map(str) }))
      .filter((t) => t.hanzi.length >= 2 && t.hanzi.length === t.pinyin.length),
    sources: arr(r.src)
      .map((s) => arr(s))
      .filter((s) => /^https:\/\//.test(str(s[3])))
      .map((s) => ({ name: str(s[0]), about: [str(s[1]), str(s[2])] as Bi, url: str(s[3]) })),
  };
}

/** Link to a dictionary page for a word, when the source has one per word. */
export function sourceLink(source: PronunciationSource, word: string): string {
  return source.url.replace('{w}', encodeURIComponent(word.toLowerCase()));
}

/** Syllables with the stressed one in capitals: "pho·TO·gra·phy". */
export function markStress(word: StressWord, index = word.stressed): string {
  return word.syllables.map((s, i) => (i === index ? s.toUpperCase() : s)).join('·');
}

type Drill = ChoiceExercise;

const base = (id: string, lang: CurriculumLang) => ({
  id: `sound:${lang}:${id}`,
  lessonId: `sound:${lang}`,
  skill: 'listening' as const,
  lang,
  passage: null,
});

/** Hear one word of a minimal pair and pick it. */
export function pairDrill(pair: MinimalPair, lang: CurriculumLang, seed: number): Drill {
  const rng = createRng(seed);
  const target = rng() < 0.5 ? pair.a : pair.b;
  const options = shuffle([pair.a, pair.b], rng);
  return {
    ...base(`pair:${pair.a}:${pair.b}:${target}`, lang),
    kind: 'choice',
    instruction: tr('Nghe và chọn từ bạn nghe thấy', 'Listen and pick the word you hear'),
    prompt: tr('Bạn nghe thấy từ nào?', 'Which word do you hear?'),
    options,
    answerIndex: options.indexOf(target),
    audioText: target,
    explain: pair.contrast
      ? tr(`Hai âm cần phân biệt: ${pair.contrast}.`, `The sounds to tell apart: ${pair.contrast}.`)
      : null,
  };
}

/** Pick the stressed syllable of a word (English, Spanish). */
export function stressDrill(word: StressWord, lang: CurriculumLang): Drill {
  const options = word.syllables.map((_, i) => markStress(word, i));
  return {
    ...base(`stress:${word.word}`, lang),
    kind: 'choice',
    skill: 'listening',
    instruction: tr('Trọng âm rơi vào âm tiết nào?', 'Which syllable is stressed?'),
    prompt: word.word,
    options,
    answerIndex: word.stressed,
    audioText: word.word,
    explain: tr(
      `Đọc là ${markStress(word)}: âm tiết in hoa được nhấn mạnh hơn và dài hơn.`,
      `Say ${markStress(word)}: the capital syllable is louder and longer.`,
    ),
  };
}

/** Hear one character of a tone set and pick its tone (Chinese). */
export function toneDrill(set: ToneSet, seed: number): Drill {
  const rng = createRng(seed);
  const i = Math.floor(rng() * set.hanzi.length);
  return {
    ...base(`tone:${set.syllable}:${i}`, 'zh'),
    kind: 'choice',
    instruction: tr('Nghe và chọn đúng thanh điệu', 'Listen and pick the tone'),
    prompt: tr(`Âm “${set.syllable}” — thanh nào?`, `“${set.syllable}” — which tone?`),
    options: set.pinyin,
    answerIndex: i,
    audioText: set.hanzi[i] ?? '',
    explain: set.hanzi.map((h, k) => `${h} ${set.pinyin[k]}`).join(' · '),
  };
}

/** A mixed pronunciation session: minimal pairs plus stress or tones. */
export function soundDrills(p: Pronunciation, seed: number, size = 12): Drill[] {
  const rng = createRng(seed);
  const pairs = shuffle(p.pairs, rng).map((pair, i) => pairDrill(pair, p.lang, seed + i));
  const second =
    p.lang === 'zh'
      ? shuffle(p.tones, rng).map((t, i) => toneDrill(t, seed + 100 + i))
      : shuffle(p.stress, rng).map((w) => stressDrill(w, p.lang));
  const out: Drill[] = [];
  for (let i = 0; out.length < size && (i < pairs.length || i < second.length); i++) {
    if (pairs[i]) out.push(pairs[i]!);
    if (second[i] && out.length < size) out.push(second[i]!);
  }
  return out;
}

const files = import.meta.glob<unknown>('../../../content/*/pronunciation.json', {
  import: 'default',
});
const cache = new Map<CurriculumLang, Promise<Pronunciation>>();

export function loadPronunciation(lang: CurriculumLang): Promise<Pronunciation> {
  let pending = cache.get(lang);
  if (!pending) {
    const loader = files[`../../../content/${CURRICULUM_DIRS[lang]}/pronunciation.json`];
    pending = (loader ? loader() : Promise.resolve({})).then((raw) =>
      parsePronunciation(raw, lang),
    );
    pending.catch(() => cache.delete(lang));
    cache.set(lang, pending);
  }
  return pending;
}
