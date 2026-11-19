import type { ReactNode } from 'react';
import { navigate } from '../../app/router';
import { CardsIcon, DumbbellIcon, HeartIcon } from '../../components/Icons';
import { Mascot } from '../../components/mascots';
import { useNow } from '../../hooks/useNow';
import type { MascotId } from '../../types';
import { useAppState } from '../../stores/appStore';
import { courseProgress } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import type { Course } from '../curriculum';
import { dueCards } from '../flashcards-srs/srs';
import { currentHearts, MAX_HEARTS, msUntilNextHeart } from '../learning-progress/hearts';

export function PracticePage({ course }: { course: Course }) {
  const state = useAppState();
  const now = useNow();
  const progress = courseProgress(state, course.id);
  const mistakes = Object.keys(progress.mistakes).length;
  const due = dueCards(progress.cards, toDayKey(new Date(now))).length;
  const anyCompleted = Object.values(progress.lessonLevels).some((l) => l > 0);
  const hearts = currentHearts(state.hearts, now).current;
  const nextHeart = msUntilNextHeart(state.hearts, now);
  const buddy = state.profile?.buddy ?? course.mascot;

  return (
    <div className="page">
      <header className="page-hero page-hero--practice">
        <div>
          <h1>Practice hub</h1>
          <p>Strengthen what you’ve learned. Every practice earns a heart back.</p>
        </div>
        <Mascot id={buddy} size={120} mood="wave" />
      </header>

      <div className="hearts-panel card">
        <div className="hearts-row" aria-label={`${hearts} of ${MAX_HEARTS} hearts`}>
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <HeartIcon key={i} size={30} className={i < hearts ? 'heart-on' : 'heart-off'} />
          ))}
        </div>
        <p>
          {nextHeart === null
            ? 'Your hearts are full!'
            : `Next heart in ${Math.ceil(nextHeart / 60000)} min — or practise to refill now.`}
        </p>
      </div>

      <div className="practice-grid">
        <PracticeCard
          mascot="rabbit"
          title="Fix mistakes"
          detail={
            mistakes
              ? `${mistakes} exercise${mistakes === 1 ? '' : 's'} to review`
              : 'No mistakes — great job!'
          }
          icon={<DumbbellIcon />}
          disabled={!mistakes}
          onClick={() => navigate({ name: 'practice-session', kind: 'mistakes' })}
        />
        <PracticeCard
          mascot="elephant"
          title="Flashcards"
          detail={
            due ? `${due} word${due === 1 ? '' : 's'} due for review` : 'All caught up for today'
          }
          icon={<CardsIcon />}
          disabled={!Object.keys(progress.cards).length}
          onClick={() => navigate({ name: 'review' })}
        />
        <PracticeCard
          mascot="turtle"
          title="Quick practice"
          detail={anyCompleted ? 'A mixed session from your lessons' : 'Finish a lesson to unlock'}
          icon={<HeartIcon />}
          disabled={!anyCompleted}
          onClick={() => navigate({ name: 'practice-session', kind: 'mix' })}
        />
      </div>
    </div>
  );
}

function PracticeCard({
  mascot,
  title,
  detail,
  icon,
  disabled,
  onClick,
}: {
  mascot: MascotId;
  title: string;
  detail: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="practice-card" disabled={disabled} onClick={onClick}>
      <Mascot id={mascot} size={88} />
      <span className="practice-card__text">
        <strong>
          {icon} {title}
        </strong>
        <span>{detail}</span>
      </span>
    </button>
  );
}
