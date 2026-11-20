/**
 * Turn the content team's JSON into typed units. Two shapes exist side by side:
 * array items in `ex` (["fill", sentence, options, answer, explain]) and object items in
 * `warm`, `ex2` and `hard` ({ t, s, q, o, a, e, m }). Unknown or malformed items are
 * dropped (and counted by the validation test) rather than shown broken.
 */
import type {
  Bi,
  ContentItem,
  CurriculumLang,
  LevelMeta,
  LevelUnit,
  Skill,
  VocabItem,
} from './types';
import { tr } from '../../i18n/locale';

const langName = (lang: CurriculumLang): string =>
  ({
    en: tr('tiếng Anh', 'English'),
    es: tr('tiếng Tây Ban Nha', 'Spanish'),
    zh: tr('tiếng Trung', 'Chinese'),
  })[lang];

const SKILL: Record<string, Skill> = {
  fill: 'grammar',
  mc: 'grammar',
  gap: 'grammar',
  fix: 'grammar',
  rewrite: 'grammar',
  order: 'grammar',
  tr: 'translation',
  trans: 'translation',
  read: 'reading',
  listen: 'listening',
  dict: 'listening',
  say: 'speaking',
  free: 'writing',
  type: 'vocabulary',
};

type Raw = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
/** Bilingual [vi, en] text in the interface language (Vietnamese when no English is given). */
const vi = (v: unknown): string | null =>
  Array.isArray(v)
    ? (str(tr(String(v[0] ?? ''), String(v[1] ?? v[0] ?? ''))) ?? str(v[0]))
    : str(v);
/** Answer options: bilingual options follow the interface language; the answer index is unchanged. */
const optionList = (v: unknown): string[] | null =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every((x) => typeof x === 'string' || (Array.isArray(x) && typeof x[0] === 'string'))
    ? v.map((x) => (Array.isArray(x) ? (vi(x) ?? String(x[0])) : (x as string)))
    : null;
const strings = (v: unknown): string[] | null =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every((x) => typeof x === 'string' || (Array.isArray(x) && typeof x[0] === 'string'))
    ? v.map((x) => (Array.isArray(x) ? (x[0] as string) : (x as string)))
    : null;

function defaultInstruction(t: string, lang: CurriculumLang): string | null {
  switch (t) {
    case 'gap':
      return tr('Điền từ còn thiếu', 'Fill in the missing word');
    case 'fix':
      return tr('Sửa lỗi sai trong câu', 'Correct the mistake in the sentence');
    case 'trans':
    case 'tr':
      return tr(`Dịch sang ${langName(lang)}`, `Translate into ${langName(lang)}`);
    case 'fill':
      return tr('Chọn từ đúng để điền vào chỗ trống', 'Choose the word that fills the gap');
    case 'read':
      return tr('Đọc bài và trả lời', 'Read and answer');
    case 'listen':
      return tr('Nghe và chọn đáp án đúng', 'Listen and choose the right answer');
    default:
      return null;
  }
}

/** Normalise one item; returns null when it cannot be shown correctly. */
export function normalizeItem(raw: unknown, lang: CurriculumLang): ContentItem | null {
  if (Array.isArray(raw)) {
    const [t, a, b, c, d] = raw as unknown[];
    if (typeof t !== 'string') return null;
    const skill = SKILL[t] ?? 'grammar';
    const source = t;
    switch (t) {
      case 'fill':
      case 'mc':
      case 'tr':
      case 'listen': {
        const options = optionList(b);
        const prompt = Array.isArray(a) ? vi(a) : str(a);
        if (!prompt || !options || typeof c !== 'number' || c < 0 || c >= options.length)
          return null;
        return {
          kind: 'choice',
          source,
          skill,
          instruction: t === 'mc' ? null : defaultInstruction(t, lang),
          prompt,
          options,
          answer: c,
          explain: vi(d),
          audio: t === 'listen' ? prompt : null,
          passage: false,
        };
      }
      case 'order': {
        const sentence = str(a);
        if (!sentence) return null;
        const parts = sentence.includes('|')
          ? sentence.split('|').map((p) => p.trim())
          : [sentence];
        return { kind: 'order', source, skill, parts, meaning: vi(b), explain: null };
      }
      case 'dict': {
        const s = str(a);
        return s ? { kind: 'dictation', source, skill, audio: s, explain: null } : null;
      }
      case 'say': {
        const s = str(a);
        return s ? { kind: 'say', source, skill, text: s, explain: null } : null;
      }
      case 'type': {
        const prompt = vi(a);
        const accepted = strings(b);
        return prompt && accepted
          ? { kind: 'text', source, skill, instruction: null, prompt, accepted, explain: null }
          : null;
      }
      default:
        return null;
    }
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Raw;
  const t = str(o.t);
  if (!t) return null;
  const skill = SKILL[t] ?? 'grammar';
  const explain = vi(o.e);
  const s = str(o.s);
  const question = vi(o.q);
  switch (t) {
    case 'order': {
      if (!s) return null;
      return {
        kind: 'order',
        source: t,
        skill,
        parts: s.includes('|') ? s.split('|').map((p) => p.trim()) : [s],
        meaning: vi(o.m),
        explain,
      };
    }
    case 'dict':
      return s ? { kind: 'dictation', source: t, skill, audio: s, explain } : null;
    case 'say':
      return s ? { kind: 'say', source: t, skill, text: s, explain } : null;
    case 'free':
      return question
        ? { kind: 'free', source: t, skill, prompt: question, model: str(o.m) ?? vi(o.m) }
        : null;
  }
  const options = optionList(o.o);
  if (options && typeof o.a === 'number') {
    if (o.a < 0 || o.a >= options.length) return null;
    const prompt = t === 'read' || t === 'listen' ? question : (s ?? question);
    if (!prompt) return null;
    return {
      kind: 'choice',
      source: t,
      skill,
      instruction:
        t === 'read' || t === 'listen'
          ? defaultInstruction(t, lang)
          : question && s
            ? question
            : defaultInstruction(t, lang),
      prompt,
      options,
      answer: o.a,
      explain,
      audio: t === 'listen' ? s : null,
      passage: t === 'read',
    };
  }
  const accepted = strings(o.a);
  if (accepted) {
    const prompt = s ?? question;
    if (!prompt) return null;
    return {
      kind: 'text',
      source: t,
      skill,
      instruction: t === 'rewrite' || t === 'type' ? question : defaultInstruction(t, lang),
      prompt,
      accepted,
      explain,
    };
  }
  return null;
}

function vocab(raw: unknown): VocabItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is string[] => Array.isArray(v) && typeof v[0] === 'string')
    .map(([word, sound, vi, en]) => ({
      word: word!,
      sound: sound ?? '',
      vi: vi ?? '',
      en: en ?? '',
    }));
}

function items(list: unknown, lang: CurriculumLang): ContentItem[] {
  if (!Array.isArray(list)) return [];
  return list.map((x) => normalizeItem(x, lang)).filter((x): x is ContentItem => x !== null);
}

export function normalizeUnit(raw: unknown, level: string, lang: CurriculumLang): LevelUnit | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const u = raw as Raw;
  const id = str(u.id);
  const title = Array.isArray(u.t) ? (u.t as Bi) : null;
  if (!id || !title) return null;
  const rd = (u.rd2 ?? u.rd) as Raw | undefined;
  return {
    id,
    level,
    title,
    theory: Array.isArray(u.th)
      ? (u.th as Bi[]).filter((p) => Array.isArray(p) && typeof p[0] === 'string')
      : [],
    table: Array.isArray(u.tb) && u.tb.length > 1 ? (u.tb as string[][]) : null,
    vocab: vocab(u.vo),
    hanzi: str(u.hz),
    passage: rd && str(rd.tx) ? { text: rd.tx as string, translation: str(rd.tr) ?? '' } : null,
    items: [...items(u.warm, lang), ...items(u.ex, lang), ...items(u.ex2, lang)],
    challenge: items(u.hard, lang),
  };
}

export function normalizeLevels(raw: unknown): LevelMeta[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((l: Raw) => ({
    code: String(l.c),
    name: l.n as Bi,
    exam: String(l.x ?? ''),
    words: String(l.w ?? ''),
  }));
}

/** Count raw items so the validation test can prove nothing was silently dropped. */
export function rawItemCount(raw: unknown): number {
  const u = raw as Raw;
  return ['warm', 'ex', 'ex2', 'hard'].reduce(
    (n, k) => n + (Array.isArray(u[k]) ? (u[k] as unknown[]).length : 0),
    0,
  );
}
