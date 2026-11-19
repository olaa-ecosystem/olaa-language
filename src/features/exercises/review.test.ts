import type { Exercise } from './types';
import { cardExercise, interleaveReview } from './review';

const ex = (id: string, lessonId = 'now'): Exercise => ({
  id,
  lessonId,
  kind: 'select',
  prompt: id,
  promptLang: 'en',
  optionLang: 'vi',
  options: [],
  answer: 'x',
});
const card = (id: string, back: string) => ({
  id,
  front: id,
  back,
  lessonId: 'old',
  box: 1,
  dueOn: '2026-11-01',
  reviews: 0,
});

describe('interleaveReview', () => {
  const lesson = Array.from({ length: 8 }, (_, i) => ex(`n${i}`));

  it('adds about a quarter of review, warm-up first, from other lessons only', () => {
    const out = interleaveReview(
      lesson,
      {
        mistakes: [ex('m1', 'old'), ex('m2', 'old'), ex('same', 'now')],
        dueCards: [ex('c1', 'old')],
        lessonId: 'now',
      },
      1,
    );
    const review = out.filter((e) => e.review);
    expect(review).toHaveLength(2);
    expect(out[0]?.review).toBe(true);
    expect(review.map((e) => e.id)).not.toContain('same');
    expect(out.filter((e) => !e.review).map((e) => e.id)).toEqual(lesson.map((e) => e.id));
  });

  it('leaves the lesson unchanged when there is nothing to review', () => {
    expect(interleaveReview(lesson, { mistakes: [], dueCards: [], lessonId: 'now' }, 1)).toBe(
      lesson,
    );
  });
});

describe('cardExercise', () => {
  it('makes a recall question tied to the card', () => {
    const cards = [card('cat', 'con mèo'), card('dog', 'con chó'), card('bear', 'con gấu')];
    const e = cardExercise(cards[0]!, cards, 'en', 'vi', 1)!;
    expect(e).toMatchObject({
      kind: 'select',
      prompt: 'cat',
      answer: 'con mèo',
      review: true,
      cardId: 'cat',
    });
    expect(e.options).toContain('con mèo');
    expect(cardExercise(cards[0]!, cards.slice(0, 1), 'en', 'vi', 1)).toBeNull();
  });
});
