import { useState } from 'react';
import { navigate } from '../../app/router';
import { CloseIcon } from '../../components/Icons';
import { Mascot } from '../../components/mascots';
import { EmptyState, ProgressBar } from '../../components/ui';
import { appStore, useAppState } from '../../stores/appStore';
import { applyCardReview, awardXp, courseProgress } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { playFeedback } from '../../utils/sound';
import type { Course } from '../curriculum';
import { SpeakButton } from '../lesson-player/exercises/common';
import { dueCards, type ReviewGrade, type SrsCard } from './srs';

const MAX_CARDS_PER_SESSION = 20;

export function ReviewPage({ course }: { course: Course }) {
  const state = useAppState();
  const buddy = state.profile?.buddy ?? course.mascot;
  const [queue, setQueue] = useState<SrsCard[]>(() =>
    dueCards(courseProgress(appStore.getState(), course.id).cards, toDayKey(new Date())).slice(
      0,
      MAX_CARDS_PER_SESSION,
    ),
  );
  const [total] = useState(queue.length);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const card = queue[0];
  const exit = () => navigate({ name: 'practice' });

  const grade = (g: ReviewGrade) => {
    if (!card) return;
    const today = toDayKey(new Date());
    appStore.update((s) => applyCardReview(s, course.id, card.id, g, today));
    const nextReviewed = reviewed.includes(card.id) ? reviewed : [...reviewed, card.id];
    setReviewed(nextReviewed);
    // "Again" cards come back at the end of this session.
    const rest = g === 'again' ? [...queue.slice(1), card] : queue.slice(1);
    setQueue(rest);
    setFlipped(false);
    if (!rest.length) {
      const xp = Math.min(10, nextReviewed.length);
      appStore.update((s) => awardXp(s, xp, today));
      if (state.soundOn) playFeedback('complete');
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div className="result-screen">
        <Mascot id={buddy} size={190} mood="happy" />
        <h1>Review complete!</h1>
        <p className="result-screen__sub">
          You reviewed {reviewed.length} word{reviewed.length === 1 ? '' : 's'} · +
          {Math.min(10, reviewed.length)} XP
        </p>
        <button
          type="button"
          className="btn btn--block result-screen__cta"
          onClick={exit}
          autoFocus
        >
          Continue
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="page page--center">
        <EmptyState mascot={<Mascot id="elephant" size={150} />} title="All caught up!">
          <p>No flashcards are due right now. Ellie will remind you when it’s time to review.</p>
          <button type="button" className="btn" onClick={exit}>
            Back to practice
          </button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="lesson">
      <header className="lesson__top">
        <button type="button" className="icon-btn" aria-label="Close review" onClick={exit}>
          <CloseIcon />
        </button>
        <ProgressBar value={total ? (total - queue.length) / total : 0} label="Review progress" />
        <span className="stat">
          {total - queue.length}/{total}
        </span>
      </header>
      <main className="lesson__body">
        <div className="exercise">
          <h2 className="exercise-title">Do you remember this word?</h2>
          <button
            type="button"
            className={`flashcard ${flipped ? 'is-flipped' : ''}`}
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? 'Hide answer' : 'Show answer'}
          >
            <span className="flashcard__inner">
              <span className="flashcard__face flashcard__front" lang={course.targetLang}>
                {card.front}
                <small>Tap to flip</small>
              </span>
              <span className="flashcard__face flashcard__back" lang={course.baseLang}>
                {card.back}
                <small lang={course.targetLang}>{card.front}</small>
              </span>
            </span>
          </button>
          <div className="listen-controls">
            <SpeakButton text={card.front} lang={course.targetLang} />
          </div>
        </div>
      </main>
      <footer className="lesson__footer">
        <div className="lesson__footer-inner lesson__footer-inner--grades">
          {flipped ? (
            <>
              <button type="button" className="btn btn--danger" onClick={() => grade('again')}>
                Again
              </button>
              <button type="button" className="btn btn--success" onClick={() => grade('good')}>
                Good
              </button>
              <button type="button" className="btn" onClick={() => grade('easy')}>
                Easy
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn--block"
              onClick={() => setFlipped(true)}
              autoFocus
            >
              Show answer
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
