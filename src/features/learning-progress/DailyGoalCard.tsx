import { FlameIcon } from '../../components/Icons';
import { Mascot } from '../../components/mascots';
import { ProgressBar } from '../../components/ui';
import { useAppState } from '../../stores/appStore';
import { toDayKey } from '../../utils/date';
import { practicedToday, visibleStreak } from './streak';

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
        <h3>Daily goal</h3>
        <span
          className={`stat stat--streak ${practicedToday(state.streak, today) ? '' : 'is-off'}`}
        >
          <FlameIcon /> {streak} day{streak === 1 ? '' : 's'}
        </span>
      </div>
      <div className="goal-card__body">
        <Mascot id={buddy} size={64} mood={done ? 'happy' : 'idle'} />
        <div className="goal-card__progress">
          <ProgressBar value={xpToday / goal} label="Daily goal progress" variant="gold" />
          <p>{done ? 'Goal reached — amazing!' : `${xpToday} / ${goal} XP today`}</p>
        </div>
      </div>
    </div>
  );
}
