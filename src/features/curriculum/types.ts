import type { LanguageCode, MascotId } from '../../types';

/** A bilingual pair. `accept*` lists extra correct answers beyond the canonical text. */
export interface Phrase {
  en: string;
  vi: string;
  acceptEn?: string[];
  acceptVi?: string[];
  /** Optional mascot picture that illustrates the word (enables picture exercises). */
  image?: MascotId;
}

export interface Lesson {
  id: string;
  title: string;
  icon: string;
  words: Phrase[];
  sentences: Phrase[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  guide: MascotId;
  lessons: Lesson[];
}

export type CourseId = 'en-from-vi' | 'vi-from-en';

export interface Course {
  id: CourseId;
  title: string;
  subtitle: string;
  targetLang: LanguageCode;
  baseLang: LanguageCode;
  mascot: MascotId;
  units: Unit[];
}

export const MAX_LESSON_LEVEL = 5;
