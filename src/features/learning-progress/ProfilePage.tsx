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
import { downloadExport } from '../data-export/exportData';
import { useAccount } from '../../services/cloudSync';
import { COURSES, courseCompletion, type Course } from '../curriculum';
import { errorLabel, type ErrorCategory } from '../exercises/explain';
import { LocalePicker } from '../../i18n/LocalePicker';
import { masteredCount } from '../flashcards-srs/srs';
import { visibleStreak } from './streak';
import { tr } from '../../i18n/locale';

export function ProfilePage({ course }: { course: Course }) {
  const state = useAppState();
  const account = useAccount();
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
          <h1>{state.profile?.name ?? tr('Người học', 'Learner')}</h1>
          <p>
            {tr(
              `Học ${course.title.charAt(0).toLowerCase()}${course.title.slice(1)} cùng ${MASCOTS[buddy].name}`,
              `Learning ${course.title} with ${MASCOTS[buddy].name}`,
            )}
          </p>
          <p className="muted">
            {tr(
              `Đã xong ${Math.round(courseCompletion(course, progress.lessonLevels) * 100)}% khoá học`,
              `${Math.round(courseCompletion(course, progress.lessonLevels) * 100)}% of course complete`,
            )}
          </p>
        </div>
      </header>

      <h2 className="section-title">{tr('Thống kê', 'Statistics')}</h2>
      <div className="stat-grid">
        <StatTile
          icon={<FlameIcon />}
          tone="streak"
          value={visibleStreak(state.streak, today)}
          label={tr('Chuỗi ngày học', 'Day streak')}
        />
        <StatTile
          icon={<FlameIcon />}
          tone="streak"
          value={state.streak.longest}
          label={tr('Chuỗi dài nhất', 'Longest streak')}
        />
        <StatTile
          icon={<BoltIcon />}
          tone="xp"
          value={state.totalXp}
          label={tr('Tổng XP', 'Total XP')}
        />
        <StatTile
          icon={<StarIcon />}
          tone="xp"
          value={state.lessonsCompleted}
          label={tr('Bài đã học', 'Lessons done')}
        />
        <StatTile
          icon={<CardsIcon />}
          tone="blue"
          value={words}
          label={tr('Từ đã học', 'Words learned')}
        />
        <StatTile
          icon={<CardsIcon />}
          tone="green"
          value={masteredCount(progress.cards)}
          label={tr('Từ đã thuộc', 'Words mastered')}
        />
      </div>

      {topMistakes.length > 0 && (
        <>
          <h2 className="section-title">{tr('Lỗi hay gặp', 'Common mistakes')}</h2>
          <div className="card">
            <ul className="mistake-list">
              {topMistakes.map(([cat, n]) => (
                <li key={cat}>
                  <span>{errorLabel(cat)}</span>
                  <span className="muted">{n}×</span>
                </li>
              ))}
            </ul>
            <p className="muted small">
              {tr(
                'Luyện tập → Sửa lỗi sẽ đưa các lỗi này ra trước.',
                'Practice → Fix mistakes brings these back first.',
              )}
            </p>
          </div>
        </>
      )}

      <h2 className="section-title">{tr('Tuần này', 'This week')}</h2>
      <div
        className="card week-chart"
        role="img"
        aria-label={tr('XP kiếm được trong 7 ngày qua', 'XP earned over the last 7 days')}
      >
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
                {fromDayKey(day).toLocaleDateString(tr('vi-VN', 'en-US'), { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">{tr('Bạn học cùng', 'Your buddy')}</h2>
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
            <span>{MASCOTS[id].nickname}</span>
          </button>
        ))}
      </div>

      {firebaseEnabled && (
        <>
          <h2 className="section-title">{tr('Tài khoản', 'Account')}</h2>
          <AccountCard />
        </>
      )}

      <h2 className="section-title">{tr('Cài đặt', 'Settings')}</h2>
      <div className="card settings">
        <fieldset>
          <legend>{tr('Ngôn ngữ giao diện', 'App language')}</legend>
          <LocalePicker />
        </fieldset>
        <fieldset>
          <legend>{tr('Mục tiêu ngày', 'Daily goal')}</legend>
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
          <legend>{tr('Khoá học', 'Course')}</legend>
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
          <span>{tr('Âm thanh hiệu ứng', 'Sound effects')}</span>
        </label>
        <div>
          {confirmReset ? (
            <div
              className="reset-confirm"
              role="alertdialog"
              aria-label={tr('Xác nhận xoá tiến độ', 'Confirm reset')}
            >
              <p>
                {tr(
                  'Thao tác này xoá mọi tiến độ trên máy này. Bạn chắc chứ?',
                  'This erases all progress on this device. Are you sure?',
                )}
              </p>
              <button type="button" className="btn btn--danger" onClick={() => appStore.reset()}>
                {tr('Xoá hết', 'Yes, reset')}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmReset(false)}
              >
                {tr('Huỷ', 'Cancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="link-btn link-btn--danger"
              onClick={() => setConfirmReset(true)}
            >
              {tr('Xoá toàn bộ tiến độ', 'Reset all progress')}
            </button>
          )}
        </div>
        <div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => downloadExport(appStore.getState(), account.email)}
          >
            {tr('Tải dữ liệu của tôi (JSON)', 'Download my data (JSON)')}
          </button>
          <p className="muted small">
            {tr(
              'Mọi thứ app lưu về bạn: tiến độ, thẻ từ và cài đặt.',
              'Everything this app stores about you: progress, flashcards and settings.',
            )}
          </p>
        </div>
        {!firebaseEnabled && (
          <p className="muted small">
            {tr('Tiến độ chỉ lưu trên trình duyệt này.', 'Progress is saved in this browser only.')}
          </p>
        )}
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
