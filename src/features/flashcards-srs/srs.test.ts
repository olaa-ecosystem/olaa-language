import { dueCards, MAX_BOX, newCard, reviewCard } from './srs';

const today = '2026-11-19';

describe('spaced repetition', () => {
  it('schedules new cards for tomorrow', () => {
    const card = newCard('c1', 'cat', 'con mèo', 'l1', today);
    expect(card.dueOn).toBe('2026-11-20');
    expect(dueCards({ c1: card }, today)).toHaveLength(0);
    expect(dueCards({ c1: card }, '2026-11-20')).toHaveLength(1);
  });

  it('moves cards up a box on "good" and two on "easy"', () => {
    const card = newCard('c1', 'cat', 'con mèo', 'l1', today);
    expect(reviewCard(card, 'good', today)).toMatchObject({ box: 2, dueOn: '2026-11-22' });
    expect(reviewCard(card, 'easy', today)).toMatchObject({ box: 3, dueOn: '2026-11-26' });
  });

  it('resets to box 0 (due today) on "again" and caps at the top box', () => {
    const card = { ...newCard('c1', 'cat', 'con mèo', 'l1', today), box: MAX_BOX };
    expect(reviewCard(card, 'again', today)).toMatchObject({ box: 0, dueOn: today });
    expect(reviewCard(card, 'easy', today).box).toBe(MAX_BOX);
  });
});
