import { useState } from 'react';
import { navigate } from '../../app/router';
import { CloseIcon } from '../../components/Icons';
import { Mascot } from '../../components/mascots';
import { EmptyState, ProgressBar } from '../../components/ui';
import { appStore, useAppState } from '../../stores/appStore';
import { applyCardReview, awardXp, courseProgress } from '../../stores/appState';
import { toDayKey, type DayKey } from '../../utils/date';
import type { SpeechLang } from '../../utils/speech';
import type { MascotId } from '../../types';
import { playFeedback } from '../../utils/sound';
import type { Course } from '../curriculum';
import { SpeakButton } from '../lesson-player/exercises/common';
import { dueCards, type ReviewGrade, type SrsCard } from './srs';
import { tr } from '../../i18n/locale';

const MAX_CARDS_PER_SESSION = 20;

export function ReviewPage({ course }: { course: Course }) {
  const state = useAppState();
  return (
    <FlashcardSession
      cards={courseProgress(state, course.id).cards}
      frontLang={course.targetLang}
      backLang={course.baseLang}
      buddy={state.profile?.buddy ?? course.mascot}
      soundOn={state.soundOn}
      onGrade={(cardId, g, today) =>
        appStore.update((s) => applyCardReview(s, course.id, cardId, g, today))
      }
      onExit={() => navigate({ name: 'practice' })}
    />
  );
}

/** A review session over any deck of cards (course words or level vocabulary). */
export function FlashcardSession({
  cards,
  frontLang,
  backLang,
  buddy,
  soundOn,
  onGrade,
  onExit,
}: {
  cards: Record<string, SrsCard>;
  frontLang: SpeechLang;
  backLang: SpeechLang;
  buddy: MascotId;
  soundOn: boolean;
  onGrade: (cardId: string, grade: ReviewGrade, today: DayKey) => void;
  onExit: () => void;
}) {
  const [queue, setQueue] = useState<SrsCard[]>(() =>
    dueCards(cards, toDayKey(new Date())).slice(0, MAX_CARDS_PER_SESSION),
  );
  const [total] = useState(queue.length);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const card = queue[0];
  const exit = onExit;

  const grade = (g: ReviewGrade) => {
    if (!card) return;
    const today = toDayKey(new Date());
    onGrade(card.id, g, today);
    const nextReviewed = reviewed.includes(card.id) ? reviewed : [...reviewed, card.id];
    setReviewed(nextReviewed);
    // "Again" cards come back at the end of this session.
    const rest = g === 'again' ? [...queue.slice(1), card] : queue.slice(1);
    setQueue(rest);
    setFlipped(false);
    if (!rest.length) {
      const xp = Math.min(10, nextReviewed.length);
      appStore.update((s) => awardXp(s, xp, today));
      if (soundOn) playFeedback('complete');
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div className="result-screen">
        <Mascot id={buddy} size={190} mood="happy" />
        <h1>{tr('Ôn xong rồi!', 'Review complete!')}</h1>
        <p className="result-screen__sub">
          {tr(
            `Bạn đã ôn ${reviewed.length} từ · +${Math.min(10, reviewed.length)} XP`,
            `You reviewed ${reviewed.length} word${reviewed.length === 1 ? '' : 's'} · +${Math.min(10, reviewed.length)} XP`,
          )}
        </p>
        <button
          type="button"
          className="btn btn--block result-screen__cta"
          onClick={exit}
          autoFocus
        >
          {tr('Tiếp tục', 'Continue')}
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="page page--center">
        <EmptyState
          mascot={<Mascot id="elephant" size={150} />}
          title={tr('Đã ôn hết!', 'All caught up!')}
        >
          <p>
            {tr(
              'Chưa có thẻ nào đến hạn. Ellie sẽ nhắc khi đến lúc ôn.',
              'No flashcards are due right now. Ellie will remind you when it’s time to review.',
            )}
          </p>
          <button type="button" className="btn" onClick={exit}>
            {tr('Quay lại', 'Back')}
          </button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="lesson">
      <header className="lesson__top">
        <button
          type="button"
          className="icon-btn"
          aria-label={tr('Đóng phần ôn', 'Close review')}
          onClick={exit}
        >
          <CloseIcon />
        </button>
        <ProgressBar
          value={total ? (total - queue.length) / total : 0}
          label={tr('Tiến độ ôn tập', 'Review progress')}
        />
        <span className="stat">
          {total - queue.length}/{total}
        </span>
      </header>
      <main className="lesson__body">
        <div className="exercise">
          <h2 className="exercise-title">
            {tr('Bạn còn nhớ từ này không?', 'Do you remember this word?')}
          </h2>
          <button
            type="button"
            className={`flashcard ${flipped ? 'is-flipped' : ''}`}
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? tr('Ẩn đáp án', 'Hide answer') : tr('Xem đáp án', 'Show answer')}
          >
            <span className="flashcard__inner">
              <span className="flashcard__face flashcard__front" lang={frontLang}>
                {card.front}
                <small>{tr('Chạm để lật', 'Tap to flip')}</small>
              </span>
              <span className="flashcard__face flashcard__back" lang={backLang}>
                {card.back}
                <small lang={frontLang}>{card.front}</small>
              </span>
            </span>
          </button>
          <div className="listen-controls">
            <SpeakButton text={card.front} lang={frontLang} />
          </div>
        </div>
      </main>
      <footer className="lesson__footer">
        <div className="lesson__footer-inner lesson__footer-inner--grades">
          {flipped ? (
            <>
              <button type="button" className="btn btn--danger" onClick={() => grade('again')}>
                {tr('Chưa nhớ', 'Again')}
              </button>
              <button type="button" className="btn btn--success" onClick={() => grade('good')}>
                {tr('Nhớ', 'Good')}
              </button>
              <button type="button" className="btn" onClick={() => grade('easy')}>
                {tr('Dễ', 'Easy')}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn--block"
              onClick={() => setFlipped(true)}
              autoFocus
            >
              {tr('Xem đáp án', 'Show answer')}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
