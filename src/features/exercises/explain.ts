/**
 * Explanations for wrong answers (Ecosystem PRD v1.0 §6.3: "Feedback should teach context/rule,
 * not only reveal correctness", "Track mistakes by skill/item/error category").
 */
import { levenshtein, normalize, stripDiacritics } from '../../utils/text';
import type { Exercise, GradeResult } from './types';

export type ErrorCategory =
  | 'grammar'
  | 'reading'
  | 'speaking'
  | 'writing'
  | 'vocabulary'
  | 'meaning'
  | 'word-order'
  | 'missing-words'
  | 'spelling'
  | 'translation'
  | 'listening'
  | 'skipped';

export const ERROR_LABELS: Record<ErrorCategory, string> = {
  grammar: 'Grammar',
  reading: 'Reading',
  speaking: 'Speaking',
  writing: 'Writing',
  vocabulary: 'Vocabulary',
  meaning: 'Word meaning',
  'word-order': 'Word order',
  'missing-words': 'Missing or extra words',
  spelling: 'Spelling',
  translation: 'Translation',
  listening: 'Listening',
  skipped: 'Skipped',
};

export interface Explanation {
  category: ErrorCategory;
  /** One or two short sentences shown under the correct answer. */
  why: string;
}

const words = (text: string) => normalize(text).split(' ').filter(Boolean);

function quote(list: string[]): string {
  return list.map((w) => `“${w}”`).join(', ');
}

/** The accepted answer closest to what the learner wrote. */
function closest(response: string, accepted: string[]): string {
  const given = stripDiacritics(normalize(response));
  let best = accepted[0] ?? '';
  let bestDist = Infinity;
  for (const a of accepted) {
    const d = levenshtein(stripDiacritics(normalize(a)), given);
    if (d < bestDist) {
      best = a;
      bestDist = d;
    }
  }
  return best;
}

function tileExplanation(response: string, accepted: string[], listening: boolean): Explanation {
  const target = closest(response, accepted);
  const want = words(target);
  const got = words(response);
  const sameWords =
    want.length === got.length && [...want].sort().join(' ') === [...got].sort().join(' ');
  if (sameWords) {
    return {
      category: listening ? 'listening' : 'word-order',
      why: `You have the right words in the wrong order. It is “${target}”.`,
    };
  }
  const remaining = [...got];
  const missing = want.filter((w) => {
    const i = remaining.indexOf(w);
    if (i >= 0) remaining.splice(i, 1);
    return i < 0;
  });
  const parts: string[] = [];
  if (missing.length) parts.push(`Missing ${quote(missing)}.`);
  if (remaining.length) parts.push(`Not needed: ${quote(remaining)}.`);
  return {
    category: listening ? 'listening' : 'missing-words',
    why: listening ? `You heard “${target}”. ${parts.join(' ')}`.trim() : parts.join(' '),
  };
}

export function explainMistake(
  exercise: Exercise,
  response: string,
  result: GradeResult,
): Explanation | null {
  if (result.correct) return null;
  if (exercise.explain || exercise.skill) {
    // Level curriculum: the teacher wrote the explanation; the skill is the category.
    const category = (exercise.skill === 'translation' ? 'translation' : exercise.skill) as
      | ErrorCategory
      | undefined;
    return {
      category: !response.trim() ? 'skipped' : (category ?? 'grammar'),
      why: exercise.explain ?? `The answer is “${result.correctAnswer}”.`,
    };
  }
  if (!response.trim() && exercise.kind !== 'match') {
    return {
      category: 'skipped',
      why: `The answer is “${result.correctAnswer}”. It will come back later.`,
    };
  }
  switch (exercise.kind) {
    case 'select':
      return { category: 'meaning', why: `“${exercise.prompt}” means “${exercise.answer}”.` };
    case 'picture':
      return { category: 'meaning', why: `“${exercise.prompt}” is ${result.correctAnswer}.` };
    case 'build':
      return tileExplanation(response, exercise.accepted, false);
    case 'listen':
      return tileExplanation(response, exercise.accepted, true);
    case 'type': {
      const target = closest(response, exercise.accepted);
      const a = stripDiacritics(normalize(target));
      const b = stripDiacritics(normalize(response));
      const near = levenshtein(a, b) <= Math.max(2, Math.round(a.length * 0.25));
      if (near) {
        const want = words(target);
        const got = words(response);
        const wrong = want.filter((w, i) => got[i] !== w);
        return {
          category: 'spelling',
          why: wrong.length
            ? `Close! Check the spelling of ${quote(wrong)}.`
            : `Close! Compare with “${target}”.`,
        };
      }
      return { category: 'translation', why: `A correct translation is “${target}”.` };
    }
    case 'match':
    case 'choice':
    case 'text':
    case 'dictation':
    case 'say':
    case 'free':
      return null;
  }
}
