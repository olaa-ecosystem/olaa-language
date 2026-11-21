import type { SpeechLang } from '../../utils/speech';

interface ExerciseBase {
  /** Stable id (lesson + kind + item) so mistakes can be tracked and resolved. */
  id: string;
  lessonId: string;
  /** Brought back from earlier lessons to be retrieved again (PRD v1.0 §6.2 step 2, §6.4). */
  review?: true;
  /** For review items made from a flashcard: the card whose schedule this answer updates. */
  cardId?: string;
  /** Teacher-written explanation shown after a wrong answer (level curriculum). */
  explain?: string | null;
  /** Skill practised, for mistake categories (level curriculum). */
  skill?: string;
}

/** Choose the translation of a word from a list. */
export interface SelectExercise extends ExerciseBase {
  kind: 'select';
  prompt: string;
  promptLang: SpeechLang;
  optionLang: SpeechLang;
  options: string[];
  answer: string;
}

/** Translate a sentence by tapping word tiles. */
export interface BuildExercise extends ExerciseBase {
  kind: 'build';
  prompt: string;
  promptLang: SpeechLang;
  answerLang: SpeechLang;
  tiles: string[];
  accepted: string[];
}

/** Choose one option (fill-in, multiple choice, translation, listening, reading). */
export interface ChoiceExercise extends ExerciseBase {
  kind: 'choice';
  instruction: string | null;
  prompt: string;
  lang: SpeechLang;
  options: string[];
  answerIndex: number;
  /** Text read aloud before answering (listening). */
  audioText: string | null;
  /** Reading passage shown above the question. */
  passage: { text: string; translation: string } | null;
}

/** Type the answer (gap fill, correct the sentence, rewrite, translate). */
export interface TextExercise extends ExerciseBase {
  kind: 'text';
  instruction: string | null;
  prompt: string;
  lang: SpeechLang;
  accepted: string[];
}

/** Listen and type exactly what you hear. */
export interface DictationExercise extends ExerciseBase {
  kind: 'dictation';
  audioText: string;
  lang: SpeechLang;
}

/** Say a sentence aloud after the model; self-checked (speaking is P1 in PRD v1.0). */
export interface SayExercise extends ExerciseBase {
  kind: 'say';
  text: string;
  lang: SpeechLang;
}

/** Write freely, then compare with a model answer; self-checked. */
export interface FreeExercise extends ExerciseBase {
  kind: 'free';
  prompt: string;
  model: string | null;
  lang: SpeechLang;
}

export type Exercise =
  | ChoiceExercise
  | TextExercise
  | DictationExercise
  | SayExercise
  | FreeExercise
  | SelectExercise
  | BuildExercise;

export type ExerciseKind = Exercise['kind'];

export interface GradeResult {
  correct: boolean;
  /** Accepted with a gentle correction. */
  note?: 'accents' | 'typo';
  /** Best answer to show the learner. */
  correctAnswer: string;
}
