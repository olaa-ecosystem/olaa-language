import { FlameIcon } from '../../components/Icons';
import { Mascot } from '../../components/mascots';
import { ProgressBar } from '../../components/ui';
import { useAppState } from '../../stores/appStore';
import { toDayKey } from '../../utils/date';
import { practicedToday, visibleStreak } from './streak';
import { tr } from '../../i18n/locale';

export function DailyGoalCard() {
  const state = useAppState();
  const today = toDayKey(new Date());
  const xpToday = state.xpByDay[today] ?? 0;
  const goal = state.dailyGoalXp;
  const done = xpToday >= goal;
  const streak = visibleStreak(state.streak, today);
  const buddy = state.profile?.buddy ?? 'bear';

  return (
    <div className="card goal-card">
      <div className="goal-card__head">
        <h3>{tr('Mục tiêu ngày', 'Daily goal')}</h3>
        <span
          className={`stat stat--streak ${practicedToday(state.streak, today) ? '' : 'is-off'}`}
        >
          <FlameIcon /> {streak} {tr('ngày', streak === 1 ? 'day' : 'days')}
        </span>
      </div>
      <div className="goal-card__body">
        <Mascot id={buddy} size={64} mood={done ? 'happy' : 'idle'} />
        <div className="goal-card__progress">
          <ProgressBar
            value={xpToday / goal}
            label={tr('Tiến độ mục tiêu ngày', 'Daily goal progress')}
            variant="gold"
          />
          <p>
            {done
              ? tr('Đạt mục tiêu rồi, giỏi quá!', 'Goal reached. Amazing!')
              : tr(`${xpToday} / ${goal} XP hôm nay`, `${xpToday} / ${goal} XP today`)}
          </p>
        </div>
      </div>
    </div>
  );
}
