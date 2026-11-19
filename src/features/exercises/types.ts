import type { LanguageCode, MascotId } from '../../types';

interface ExerciseBase {
  /** Stable id (lesson + kind + item) so mistakes can be tracked and resolved. */
  id: string;
  lessonId: string;
  /** Brought back from earlier lessons to be retrieved again (PRD v1.0 §6.2 step 2, §6.4). */
  review?: true;
  /** For review items made from a flashcard: the card whose schedule this answer updates. */
  cardId?: string;
}

/** Choose the translation of a word from a list. */
export interface SelectExercise extends ExerciseBase {
  kind: 'select';
  prompt: string;
  promptLang: LanguageCode;
  optionLang: LanguageCode;
  options: string[];
  answer: string;
}

/** "Which one is …?" — pick the right animal picture. */
export interface PictureExercise extends ExerciseBase {
  kind: 'picture';
  prompt: string;
  promptLang: LanguageCode;
  labelLang: LanguageCode;
  options: { image: MascotId; label: string }[];
  answer: MascotId;
}

/** Translate a sentence by tapping word tiles. */
export interface BuildExercise extends ExerciseBase {
  kind: 'build';
  prompt: string;
  promptLang: LanguageCode;
  answerLang: LanguageCode;
  tiles: string[];
  accepted: string[];
}

/** Tap matching pairs. */
export interface MatchExercise extends ExerciseBase {
  kind: 'match';
  leftLang: LanguageCode;
  rightLang: LanguageCode;
  pairs: { left: string; right: string }[];
}

/** Type the translation. */
export interface TypeExercise extends ExerciseBase {
  kind: 'type';
  prompt: string;
  promptLang: LanguageCode;
  answerLang: LanguageCode;
  accepted: string[];
}

/** Listen and build what you hear. */
export interface ListenExercise extends ExerciseBase {
  kind: 'listen';
  audioText: string;
  audioLang: LanguageCode;
  tiles: string[];
  accepted: string[];
}

export type Exercise =
  | SelectExercise
  | PictureExercise
  | BuildExercise
  | MatchExercise
  | TypeExercise
  | ListenExercise;

export type ExerciseKind = Exercise['kind'];

export interface GradeResult {
  correct: boolean;
  /** Accepted with a gentle correction. */
  note?: 'accents' | 'typo';
  /** Best answer to show the learner. */
  correctAnswer: string;
}
