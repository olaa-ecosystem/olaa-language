/**
 * Level curriculum (Ecosystem PRD v1.0 §6.1 Curriculum: course → level → unit). Content lives in
 * `content/<language>/levels/<LEVEL>.json` (imported from the content team's export) and is
 * read as-is; `normalize.ts` turns it into the shapes below.
 */
import type { SpeechLang } from '../../utils/speech';

/** [Vietnamese, English] */
export type Bi = [string, string];

export type CurriculumLang = 'en' | 'es' | 'zh';
export type CurriculumCourseId = 'en-vi' | 'es-vi' | 'zh-vi';

export const CURRICULUM_DIRS: Record<CurriculumLang, string> = {
  en: 'english',
  es: 'spanish',
  zh: 'chinese',
};

export interface LevelMeta {
  /** "A1" … "C2", "HSK1" … "HSK6" */
  code: string;
  name: Bi;
  /** Exam equivalent, e.g. "Cambridge A2 Key (KET)". */
  exam: string;
  /** Approximate vocabulary size, e.g. "~1,200". */
  words: string;
}

export interface LanguageMeta {
  lang: CurriculumLang;
  name: Bi;
  tts: string;
  levels: LevelMeta[];
}

export interface VocabItem {
  word: string;
  /** IPA for English/Spanish, pinyin for Chinese. */
  sound: string;
  vi: string;
  en: string;
}

export interface Passage {
  text: string;
  translation: string;
}

/** One question from the content, before it becomes a player exercise. */
export type ContentItem =
  | {
      kind: 'choice';
      source: string;
      skill: Skill;
      instruction: string | null;
      prompt: string;
      options: string[];
      answer: number;
      explain: string | null;
      audio: string | null;
      passage: boolean;
    }
  | {
      kind: 'text';
      source: string;
      skill: Skill;
      instruction: string | null;
      prompt: string;
      accepted: string[];
      explain: string | null;
    }
  | {
      kind: 'order';
      source: string;
      skill: Skill;
      parts: string[];
      meaning: string | null;
      explain: string | null;
    }
  | { kind: 'dictation'; source: string; skill: Skill; audio: string; explain: string | null }
  | { kind: 'say'; source: string; skill: Skill; text: string; explain: string | null }
  | { kind: 'free'; source: string; skill: Skill; prompt: string; model: string | null };

export type Skill =
  | 'grammar'
  | 'vocabulary'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'translation';

export interface LevelUnit {
  id: string;
  level: string;
  title: Bi;
  /** Theory paragraphs (Markdown-light: **bold**, line breaks, bullets). */
  theory: Bi[];
  /** First row is the header. */
  table: string[][] | null;
  vocab: VocabItem[];
  /** Chinese characters to learn in this unit. */
  hanzi: string | null;
  passage: Passage | null;
  /** Warm-up, practice and application, in teaching order. */
  items: ContentItem[];
  /** Harder optional challenge questions. */
  challenge: ContentItem[];
}

export const COURSE_LANG: Record<CurriculumCourseId, CurriculumLang> = {
  'en-vi': 'en',
  'es-vi': 'es',
  'zh-vi': 'zh',
};

export function isCurriculumCourseId(value: unknown): value is CurriculumCourseId {
  return value === 'en-vi' || value === 'es-vi' || value === 'zh-vi';
}

export function speechLang(lang: CurriculumLang): SpeechLang {
  return lang;
}
