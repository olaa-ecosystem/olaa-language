/**
 * Review inside new lessons (Ecosystem PRD v1.0 §6.2 step 2 "warm-up/retrieval", §6.4):
 * earlier mistakes and due flashcards are mixed into a lesson instead of living only in a
 * separate review page.
 */
import type { SrsCard } from '../flashcards-srs/srs';
import type { LanguageCode } from '../../types';
import { createRng, shuffle } from '../../utils/random';
import type { Exercise, SelectExercise } from './types';

/** Share of a lesson that may be review (target 20–40%, PRD 01 REQ-01-002). */
export const REVIEW_SHARE = 0.25;

/** A quick recall question for a due flashcard: pick the meaning of the word. */
export function cardExercise(
  card: SrsCard,
  others: SrsCard[],
  targetLang: LanguageCode,
  baseLang: LanguageCode,
  seed: number,
): SelectExercise | null {
  const rng = createRng(seed);
  const distractors = shuffle(
    [...new Set(others.filter((c) => c.id !== card.id && c.back !== card.back).map((c) => c.back))],
    rng,
  ).slice(0, 3);
  if (distractors.length < 2) return null;
  return {
    id: `review:card:${card.id}`,
    lessonId: card.lessonId,
    kind: 'select',
    prompt: card.front,
    promptLang: targetLang,
    optionLang: baseLang,
    answer: card.back,
    options: shuffle([card.back, ...distractors], rng),
    review: true,
    cardId: card.id,
  };
}

/**
 * Put up to `REVIEW_SHARE` review items into a lesson: first earlier mistakes (from other
 * lessons), then due cards. The first slot is a warm-up review; the rest are spread out.
 */
export function interleaveReview(
  lesson: Exercise[],
  input: { mistakes: Exercise[]; dueCards: Exercise[]; lessonId: string },
  seed: number,
): Exercise[] {
  const slots = Math.max(1, Math.round(lesson.length * REVIEW_SHARE));
  const seen = new Set(lesson.map((e) => e.id));
  const pool = [
    ...shuffle(
      input.mistakes.filter((m) => m.lessonId !== input.lessonId && m.kind !== 'match'),
      createRng(seed),
    ),
    ...input.dueCards,
  ].filter((e) => !seen.has(e.id));
  const picked = pool.slice(0, slots).map((e) => ({ ...e, review: true as const }));
  if (picked.length === 0) return lesson;
  const out = [...lesson];
  const [warmUp, ...rest] = picked;
  out.unshift(warmUp!);
  rest.forEach((item, i) => {
    const at = Math.min(out.length, Math.round(((i + 1) * out.length) / (rest.length + 1)));
    out.splice(at, 0, item);
  });
  return out;
}
