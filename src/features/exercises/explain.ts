/**
 * Explanations for wrong answers (Ecosystem PRD v1.0 §6.3: "Feedback should teach context/rule,
 * not only reveal correctness", "Track mistakes by skill/item/error category").
 */
import { levenshtein, normalize, stripDiacritics } from '../../utils/text';
import type { Exercise, GradeResult } from './types';
import { tr } from '../../i18n/locale';

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

const LABELS: Record<ErrorCategory, [string, string]> = {
  grammar: ['Ngữ pháp', 'Grammar'],
  reading: ['Đọc hiểu', 'Reading'],
  speaking: ['Nói', 'Speaking'],
  writing: ['Viết', 'Writing'],
  vocabulary: ['Từ vựng', 'Vocabulary'],
  meaning: ['Nghĩa của từ', 'Word meaning'],
  'word-order': ['Trật tự từ', 'Word order'],
  'missing-words': ['Thiếu hoặc thừa từ', 'Missing or extra words'],
  spelling: ['Chính tả', 'Spelling'],
  translation: ['Dịch', 'Translation'],
  listening: ['Nghe', 'Listening'],
  skipped: ['Bỏ qua', 'Skipped'],
};

/** Name of a mistake category in the interface language. */
export function errorLabel(category: ErrorCategory): string {
  const [vi, en] = LABELS[category];
  return tr(vi, en);
}

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
      why: tr(
        `Đúng từ nhưng sai thứ tự. Câu đúng là “${target}”.`,
        `You have the right words in the wrong order. It is “${target}”.`,
      ),
    };
  }
  const remaining = [...got];
  const missing = want.filter((w) => {
    const i = remaining.indexOf(w);
    if (i >= 0) remaining.splice(i, 1);
    return i < 0;
  });
  const parts: string[] = [];
  if (missing.length) parts.push(tr(`Thiếu ${quote(missing)}.`, `Missing ${quote(missing)}.`));
  if (remaining.length)
    parts.push(tr(`Không cần: ${quote(remaining)}.`, `Not needed: ${quote(remaining)}.`));
  return {
    category: listening ? 'listening' : 'missing-words',
    why: listening
      ? tr(`Câu bạn nghe là “${target}”.`, `You heard “${target}”.`) +
        (parts.length ? ` ${parts.join(' ')}` : '')
      : parts.join(' '),
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
      why:
        exercise.explain ??
        tr(`Đáp án là “${result.correctAnswer}”.`, `The answer is “${result.correctAnswer}”.`),
    };
  }
  if (!response.trim() && exercise.kind !== 'match') {
    return {
      category: 'skipped',
      why: tr(
        `Đáp án là “${result.correctAnswer}”. Câu này sẽ quay lại sau.`,
        `The answer is “${result.correctAnswer}”. It will come back later.`,
      ),
    };
  }
  switch (exercise.kind) {
    case 'select':
      return {
        category: 'meaning',
        why: tr(
          `“${exercise.prompt}” nghĩa là “${exercise.answer}”.`,
          `“${exercise.prompt}” means “${exercise.answer}”.`,
        ),
      };
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
            ? tr(
                `Gần đúng! Xem lại chính tả của ${quote(wrong)}.`,
                `Close! Check the spelling of ${quote(wrong)}.`,
              )
            : tr(`Gần đúng! So với “${target}”.`, `Close! Compare with “${target}”.`),
        };
      }
      return {
        category: 'translation',
        why: tr(`Một cách dịch đúng là “${target}”.`, `A correct translation is “${target}”.`),
      };
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
