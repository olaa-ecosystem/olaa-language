import { levenshtein, normalize, stripDiacritics } from '../../utils/text';
import type { Exercise, GradeResult } from './types';

/**
 * Compares free text against accepted answers.
 * - exact (after normalisation) → correct
 * - only accents differ → correct, with an "accents" note
 * - one-letter slip on longer answers → correct, with a "typo" note
 */
export function gradeText(input: string, accepted: string[]): GradeResult {
  const correctAnswer = accepted[0] ?? '';
  const given = normalize(input);
  if (!given) return { correct: false, correctAnswer };

  const candidates = accepted.map(normalize);
  if (candidates.includes(given)) return { correct: true, correctAnswer };

  const loose = stripDiacritics(given);
  if (candidates.some((c) => stripDiacritics(c) === loose)) {
    return { correct: true, note: 'accents', correctAnswer };
  }

  if (candidates.some((c) => c.length >= 5 && levenshtein(c, given) <= 1)) {
    return { correct: true, note: 'typo', correctAnswer };
  }
  return { correct: false, correctAnswer };
}

/** Grades a learner response. Build/listen responses are tiles joined by spaces. */
export function gradeExercise(exercise: Exercise, response: string): GradeResult {
  switch (exercise.kind) {
    case 'select':
      return { correct: response === exercise.answer, correctAnswer: exercise.answer };
    case 'build':
    case 'listen': {
      // Tiles are exact words, so only exact (normalised) matches count.
      const result = gradeText(response, exercise.accepted);
      return result.note ? { correct: false, correctAnswer: result.correctAnswer } : result;
    }
    case 'type':
      return gradeText(response, exercise.accepted);
    case 'match':
      // Matching is validated pair-by-pair in the UI; finishing it is always a success.
      return { correct: true, correctAnswer: '' };
    case 'choice':
      return {
        correct: response === String(exercise.answerIndex),
        correctAnswer: exercise.options[exercise.answerIndex] ?? '',
      };
    case 'text':
      return gradeText(response, exercise.accepted);
    case 'dictation': {
      const result = gradeText(response, [exercise.audioText]);
      return result.note === 'typo'
        ? { correct: false, correctAnswer: exercise.audioText }
        : result;
    }
    case 'say':
      // Self-checked: the learner confirms they said it aloud.
      return { correct: response === 'said', correctAnswer: exercise.text };
    case 'free':
      return { correct: response.trim().length > 0, correctAnswer: exercise.model ?? '' };
  }
}
