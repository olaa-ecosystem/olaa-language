import { useState, type ReactNode } from 'react';
import { navigate } from '../../app/router';
import { BoltIcon, CardsIcon, FlameIcon, StarIcon } from '../../components/Icons';
import { MASCOTS, Mascot } from '../../components/mascots';
import { appStore, useAppState } from '../../stores/appStore';
import {
  courseProgress,
  DAILY_GOAL_OPTIONS,
  setBuddy,
  setDailyGoal,
  setSound,
  switchCourse,
} from '../../stores/appState';
import { firebaseEnabled } from '../../services/firebase';
import { MASCOT_IDS } from '../../types';
import { fromDayKey, lastNDays, toDayKey } from '../../utils/date';
import { AccountCard } from '../account/AccountCard';
import { COURSES, courseCompletion, type Course } from '../curriculum';
import { ERROR_LABELS, type ErrorCategory } from '../exercises/explain';
import { masteredCount } from '../flashcards-srs/srs';
import { visibleStreak } from './streak';

export function ProfilePage({ course }: { course: Course }) {
  const state = useAppState();
  const [confirmReset, setConfirmReset] = useState(false);
  const today = toDayKey(new Date());
  const progress = courseProgress(state, course.id);
  const words = Object.keys(progress.cards).length;
  const topMistakes = (
    Object.entries(progress.mistakeCategories ?? {}) as [ErrorCategory, number][]
  )
    .filter(([cat]) => cat !== 'skipped')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const week = lastNDays(today, 7);
  const weekMax = Math.max(state.dailyGoalXp, ...week.map((d) => state.xpByDay[d] ?? 0));
  const buddy = state.profile?.buddy ?? course.mascot;

  return (
    <div className="page">
      <header className="profile-head card">
        <Mascot id={buddy} size={130} mood="wave" />
        <div>
          <h1>{state.profile?.name ?? 'Learner'}</h1>
          <p>
            Learning {course.title} with {MASCOTS[buddy].name}
          </p>
          <p className="muted">
            {Math.round(courseCompletion(course, progress.lessonLevels) * 100)}% of course complete
          </p>
        </div>
      </header>

      <h2 className="section-title">Statistics</h2>
      <div className="stat-grid">
        <StatTile
          icon={<FlameIcon />}
          tone="streak"
          value={visibleStreak(state.streak, today)}
          label="Day streak"
        />
        <StatTile
          icon={<FlameIcon />}
          tone="streak"
          value={state.streak.longest}
          label="Longest streak"
        />
        <StatTile icon={<BoltIcon />} tone="xp" value={state.totalXp} label="Total XP" />
        <StatTile
          icon={<StarIcon />}
          tone="xp"
          value={state.lessonsCompleted}
          label="Lessons done"
        />
        <StatTile icon={<CardsIcon />} tone="blue" value={words} label="Words learned" />
        <StatTile
          icon={<CardsIcon />}
          tone="green"
          value={masteredCount(progress.cards)}
          label="Words mastered"
        />
      </div>

      {topMistakes.length > 0 && (
        <>
          <h2 className="section-title">Common mistakes</h2>
          <div className="card">
            <ul className="mistake-list">
              {topMistakes.map(([cat, n]) => (
                <li key={cat}>
                  <span>{ERROR_LABELS[cat]}</span>
                  <span className="muted">{n}×</span>
                </li>
              ))}
            </ul>
            <p className="muted small">Practice → Fix mistakes brings these back first.</p>
          </div>
        </>
      )}

      <h2 className="section-title">This week</h2>
      <div className="card week-chart" role="img" aria-label="XP earned over the last 7 days">
        {week.map((day) => {
          const xp = state.xpByDay[day] ?? 0;
          return (
            <div key={day} className="week-chart__col">
              <span className="week-chart__value">{xp || ''}</span>
              <div
                className={`week-chart__bar ${xp >= state.dailyGoalXp ? 'is-goal' : ''}`}
                style={{ height: `${(xp / weekMax) * 100}%` }}
              />
              <span className="week-chart__day">
                {fromDayKey(day).toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">Your buddy</h2>
      <div className="buddy-grid">
        {MASCOT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`buddy-option ${buddy === id ? 'is-selected' : ''}`}
            aria-pressed={buddy === id}
            onClick={() => appStore.update((s) => setBuddy(s, id))}
            style={{ background: MASCOTS[id].tint }}
          >
            <Mascot id={id} size={64} mood={buddy === id ? 'wave' : 'idle'} />
            <span>{MASCOTS[id].name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {firebaseEnabled && (
        <>
          <h2 className="section-title">Account</h2>
          <AccountCard />
        </>
      )}

      <h2 className="section-title">Settings</h2>
      <div className="card settings">
        <fieldset>
          <legend>Daily goal</legend>
          <div className="chip-row">
            {DAILY_GOAL_OPTIONS.map((xp) => (
              <button
                key={xp}
                type="button"
                className={`chip ${state.dailyGoalXp === xp ? 'is-selected' : ''}`}
                aria-pressed={state.dailyGoalXp === xp}
                onClick={() => appStore.update((s) => setDailyGoal(s, xp))}
              >
                {xp} XP
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Course</legend>
          <div className="chip-row">
            {Object.values(COURSES).map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${course.id === c.id ? 'is-selected' : ''}`}
                aria-pressed={course.id === c.id}
                onClick={() => {
                  appStore.update((s) => switchCourse(s, c.id));
                  navigate({ name: 'learn' });
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="toggle">
          <input
            type="checkbox"
            checked={state.soundOn}
            onChange={(e) => appStore.update((s) => setSound(s, e.target.checked))}
          />
          <span>Sound effects</span>
        </label>
        <div>
          {confirmReset ? (
            <div className="reset-confirm" role="alertdialog" aria-label="Confirm reset">
              <p>This erases all progress on this device. Are you sure?</p>
              <button type="button" className="btn btn--danger" onClick={() => appStore.reset()}>
                Yes, reset
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="link-btn link-btn--danger"
              onClick={() => setConfirmReset(true)}
            >
              Reset all progress
            </button>
          )}
        </div>
        {!firebaseEnabled && <p className="muted small">Progress is saved in this browser only.</p>}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  tone: 'streak' | 'xp' | 'blue' | 'green';
}) {
  return (
    <div className={`stat-tile stat-tile--${tone}`}>
      <span className="stat-tile__icon">{icon}</span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}
