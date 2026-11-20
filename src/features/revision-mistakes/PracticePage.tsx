import type { ReactNode } from 'react';
import { navigate } from '../../app/router';
import { CardsIcon, DumbbellIcon } from '../../components/Icons';
import { Mascot } from '../../components/mascots';
import { useNow } from '../../hooks/useNow';
import type { MascotId } from '../../types';
import { useAppState } from '../../stores/appStore';
import { courseProgress } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import type { Course } from '../curriculum';
import { dueCards } from '../flashcards-srs/srs';
import { tr } from '../../i18n/locale';

export function PracticePage({ course }: { course: Course }) {
  const state = useAppState();
  const now = useNow();
  const progress = courseProgress(state, course.id);
  const mistakes = Object.keys(progress.mistakes).length;
  const due = dueCards(progress.cards, toDayKey(new Date(now))).length;
  const anyCompleted = Object.values(progress.lessonLevels).some((l) => l > 0);
  const buddy = state.profile?.buddy ?? course.mascot;

  return (
    <div className="page">
      <header className="page-hero page-hero--practice">
        <div>
          <h1>{tr('Luyện tập', 'Practice hub')}</h1>
          <p>
            {tr(
              'Củng cố những gì đã học. Phần ôn cũng xuất hiện trong các bài mới.',
              'Strengthen what you’ve learned. Review comes back inside new lessons too.',
            )}
          </p>
        </div>
        <Mascot id={buddy} size={120} mood="wave" />
      </header>

      <div className="practice-grid">
        <PracticeCard
          mascot="rabbit"
          title={tr('Sửa lỗi', 'Fix mistakes')}
          detail={
            mistakes
              ? tr(
                  `${mistakes} câu cần xem lại`,
                  `${mistakes} exercise${mistakes === 1 ? '' : 's'} to review`,
                )
              : tr('Không có lỗi nào, giỏi lắm!', 'No mistakes. Great job!')
          }
          icon={<DumbbellIcon />}
          disabled={!mistakes}
          onClick={() => navigate({ name: 'practice-session', kind: 'mistakes' })}
        />
        <PracticeCard
          mascot="elephant"
          title={tr('Thẻ từ', 'Flashcards')}
          detail={
            due
              ? tr(`${due} từ cần ôn`, `${due} word${due === 1 ? '' : 's'} due for review`)
              : tr('Hôm nay đã ôn xong', 'All caught up for today')
          }
          icon={<CardsIcon />}
          disabled={!Object.keys(progress.cards).length}
          onClick={() => navigate({ name: 'review' })}
        />
        <PracticeCard
          mascot="turtle"
          title={tr('Luyện nhanh', 'Quick practice')}
          detail={
            anyCompleted
              ? tr('Một lượt trộn câu từ các bài đã học', 'A mixed session from your lessons')
              : tr('Học xong một bài để mở', 'Finish a lesson to unlock')
          }
          icon={<DumbbellIcon />}
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
