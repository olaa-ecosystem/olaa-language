import { addDays, type DayKey } from '../../utils/date';

/** Leitner-style spaced repetition: each box waits longer before the card is due again. */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;

export interface SrsCard {
  id: string;
  /** Text in the language being learned. */
  front: string;
  /** Translation in the learner's language. */
  back: string;
  lessonId: string;
  box: number;
  dueOn: DayKey;
  reviews: number;
}

export type ReviewGrade = 'again' | 'good' | 'easy';

export function newCard(
  id: string,
  front: string,
  back: string,
  lessonId: string,
  today: DayKey,
): SrsCard {
  // New words come back tomorrow so the first review follows the lesson.
  return { id, front, back, lessonId, box: 1, dueOn: addDays(today, 1), reviews: 0 };
}

export function reviewCard(card: SrsCard, grade: ReviewGrade, today: DayKey): SrsCard {
  const box = grade === 'again' ? 0 : Math.min(MAX_BOX, card.box + (grade === 'easy' ? 2 : 1));
  return {
    ...card,
    box,
    dueOn: addDays(today, BOX_INTERVAL_DAYS[box] ?? 0),
    reviews: card.reviews + 1,
  };
}

export function isDue(card: SrsCard, today: DayKey): boolean {
  return card.dueOn <= today;
}

export function dueCards(cards: Record<string, SrsCard>, today: DayKey): SrsCard[] {
  return Object.values(cards)
    .filter((c) => isDue(c, today))
    .sort((a, b) => (a.dueOn === b.dueOn ? a.box - b.box : a.dueOn < b.dueOn ? -1 : 1));
}

/** Rough mastery: share of cards that have climbed to box 3+. */
export function masteredCount(cards: Record<string, SrsCard>): number {
  return Object.values(cards).filter((c) => c.box >= 3).length;
}
