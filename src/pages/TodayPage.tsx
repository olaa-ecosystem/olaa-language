/**
 * Today (nav: Học): the day at a glance in the Olaa Note "Today" layout — daily goal ring,
 * a habit-style checklist, the month calendar, and the links to Olaa Habits and Olaa Note.
 */
import { useMemo, useState } from 'react';
import { OLAA_APPS } from '../app/router';
import { Icon } from '../components/Icon';
import { AppTile, Ring, useToday } from '../components/ui';
import { dueCards } from '../features/flashcards-srs/srs';
import { visibleStreak } from '../features/learning-progress/streak';
import { CURRICULUM_LANGS, languageName } from '../features/levels/load';
import type { CurriculumLang } from '../features/levels/types';
import { notesStore } from '../features/notes/notes';
import { activityStore, dayMark, monthGrid, shiftMonth, todayPlan, topicOfDay } from '../features/today/plan';
import { formatNumber, pick, tr, useLocale } from '../i18n/locale';
import { useAccount } from '../services/cloudSync';
import { appStore, useAppState } from '../stores/appStore';
import { levelProgress, setLevelLang } from '../stores/appState';
import { fromDayKey } from '../utils/date';
import { useCurrentLevel, useTopics } from './hooks';
import { LANG_SHORT } from './WelcomePage';

export function LangChips({ value, onChange }: { value: CurriculumLang; onChange?: (l: CurriculumLang) => void }) {
  return (
    <div className="chips" role="radiogroup" aria-label={tr('Ngôn ngữ đang học', 'Language you are learning')}>
      {CURRICULUM_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className="chip"
          role="radio"
          aria-checked={value === l}
          onClick={() => (onChange ? onChange(l) : appStore.update((s) => setLevelLang(s, l)))}
        >
          <span className="zh">{LANG_SHORT[l]}</span> {pick(languageName(l))}
        </button>
      ))}
    </div>
  );
}

export function TodayPage() {
  const state = useAppState();
  const today = useToday();
  const locale = useLocale();
  const lang = state.levelLang;
  const progress = levelProgress(state, lang);
  const current = useCurrentLevel(lang);
  const topics = useTopics();
  const activity = activityStore.use();
  const notes = notesStore.use();
  const account = useAccount();
  const [month, setMonth] = useState(today);

  const xpToday = state.xpByDay[today] ?? 0;
  const due = dueCards(progress.cards, today).length;
  const mistakes = Object.keys(progress.mistakes).length;
  const streak = visibleStreak(state.streak, today);
  const name = state.profile?.name ?? '';

  const tasks = useMemo(() => {
    const cur = current.status === 'ready' ? current.data : null;
    const nextUnit =
      cur && cur.next.kind === 'unit' ? { title: cur.next.title, href: cur.nextHref } : cur ? { title: [tr('Bài kiểm tra cấp độ', 'Level test'), tr('Bài kiểm tra cấp độ', 'Level test')] as [string, string], href: cur.nextHref } : null;
    const topic =
      topics.status === 'ready' && cur
        ? topicOfDay(topics.data, lang, cur.levels.map((l) => l.code), cur.index, today)
        : null;
    return todayPlan({ today, lang, xpToday, goalXp: state.dailyGoalXp, dueCards: due, totalCards: Object.keys(progress.cards).length, mistakes, nextUnit, topicOfDay: topic, activity });
  }, [current, topics, lang, today, xpToday, state.dailyGoalXp, due, mistakes, activity, progress.cards]);
  const doneCount = tasks.filter((t) => t.done).length;

  const hour = new Date().getHours();
  const greet = hour < 11 ? tr('Chào buổi sáng', 'Good morning') : hour < 18 ? tr('Chào buổi chiều', 'Good afternoon') : tr('Chào buổi tối', 'Good evening');
  const monthTitle = fromDayKey(month).toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN', { month: 'long', year: 'numeric' });
  const dows = locale === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const pending = notes.filter((n) => n.pending).length;

  return (
    <div className="grid grid--today">
      <div className="stack">
        <section className="card hero">
          <Ring value={xpToday / Math.max(1, state.dailyGoalXp)} size={96} width={9} label={tr(`${xpToday} trên ${state.dailyGoalXp} XP`, `${xpToday} of ${state.dailyGoalXp} XP`)}>
            <b>{xpToday}</b>
            <small>/{state.dailyGoalXp} XP</small>
          </Ring>
          <div>
            <p className="eyebrow">{greet}</p>
            <h1>{name ? `${name}.` : tr('Hôm nay học gì?', 'What’s today?')}</h1>
            <p className="muted small">
              {xpToday >= state.dailyGoalXp
                ? tr('Đã đạt mục tiêu hôm nay. Học thêm là phần thưởng.', 'Goal reached. Anything more is a bonus.')
                : tr(`Còn ${state.dailyGoalXp - xpToday} XP nữa là xong mục tiêu ngày.`, `${state.dailyGoalXp - xpToday} XP to go for today’s goal.`)}
            </p>
          </div>
          <div className="stats" style={{ gridColumn: '1 / -1' }}>
            <div className="stat"><b>{streak}</b><span>{tr('ngày liên tiếp', 'day streak')}</span></div>
            <div className="stat"><b>{formatNumber(state.totalXp)}</b><span>{tr('tổng XP', 'total XP')}</span></div>
            <div className="stat"><b>{formatNumber(Object.keys(progress.cards).length)}</b><span>{tr('thẻ từ', 'cards')}</span></div>
          </div>
        </section>

        <LangChips value={lang} />

        {current.status === 'ready' ? (
          <a className="block block--ink" href={current.data.nextHref}>
            <span className="block__arrow"><Icon name="arrow" /></span>
            <p className="eyebrow" style={{ color: 'inherit', opacity: 0.7 }}>
              {current.data.level.code} · {pick(current.data.level.name)}
            </p>
            <h3>
              {current.data.next.kind === 'unit'
                ? pick(current.data.next.title)
                : current.data.next.kind === 'test'
                  ? tr('Bài kiểm tra cấp độ', 'Level test')
                  : tr('Mở cấp độ tiếp theo', 'Open the next level')}
            </h3>
            <div className="block__foot">
              <span className="tag">{tr('Tiếp tục học', 'Continue')}</span>
              <span className="tag">
                {Object.keys(progress.units).filter((id) => current.data.units.some((u) => u.id === id)).length}/{current.data.units.length} {tr('bài', 'units')}
              </span>
            </div>
          </a>
        ) : (
          <div className="skeleton" style={{ height: 150 }} />
        )}

        <section className="card">
          <h2>
            <AppTile app="habit" size="sm" />
            {tr('Việc hôm nay', 'Today’s plan')}
            <small>{tr(`${doneCount}/${tasks.length} xong`, `${doneCount} of ${tasks.length} done`)}</small>
            <Ring value={doneCount / tasks.length} size={26} width={4} warm />
          </h2>
          <div className="hlist">
            {tasks.map((t) => (
              <a key={t.id} className={`hab${t.done ? ' on' : ''}`} href={t.href}>
                <span className="ck"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" /></svg></span>
                <span className="hn">
                  {tr(...t.title)}
                  {t.detail && <small>{tr(...t.detail)}</small>}
                </span>
                <span className="sr-only">{t.done ? tr('đã xong', 'done') : tr('chưa xong', 'to do')}</span>
                <Icon name="next" size="sm" className="go" />
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="stack">
        <section className="card">
          <div className="cal__head">
            <button type="button" className="iconbtn" aria-label={tr('Tháng trước', 'Previous month')} onClick={() => setMonth(shiftMonth(month, -1))}>
              <Icon name="back" />
            </button>
            <h3 style={{ textTransform: 'capitalize' }}>{monthTitle}</h3>
            <button type="button" className="iconbtn" aria-label={tr('Tháng sau', 'Next month')} onClick={() => setMonth(shiftMonth(month, 1))} disabled={month.slice(0, 7) >= today.slice(0, 7)}>
              <Icon name="next" />
            </button>
          </div>
          <div className="cal" role="grid" aria-label={monthTitle}>
            {dows.map((d, i) => <div key={i} className="cal__dow">{d}</div>)}
            {monthGrid(month).flat().map((day, i) => {
              if (!day) return <div key={i} />;
              const xp = state.xpByDay[day] ?? 0;
              const mark = dayMark(day, today, xp, state.dailyGoalXp);
              return (
                <div key={day} className="cal__day" data-mark={mark} data-today={day === today} title={`${day}: ${xp} XP`}>
                  {Number(day.slice(8))}
                  <span className="dot">{mark === 'goal' && <svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" /></svg>}</span>
                  <span className="cal__bar"><i style={{ width: `${Math.min(100, (xp / Math.max(1, state.dailyGoalXp)) * 100)}%` }} /></span>
                </div>
              );
            })}
          </div>
          <div className="legend">
            <span><i style={{ background: '#e9a066' }} />{tr('Đạt mục tiêu', 'Goal met')}</span>
            <span><i style={{ background: 'var(--warm-soft)' }} />{tr('Có học', 'Studied')}</span>
            <span><i style={{ border: '1.5px dashed var(--ink-3)' }} />{tr('Chưa học', 'No study')}</span>
          </div>
        </section>

        <section className="card appcard">
          <AppTile app="habit" size="lg" />
          <b>Olaa Habits</b>
          <p>
            {account.email
              ? tr('Khi bạn đạt mục tiêu ngày hoặc xong bài mới, Habits tự đánh dấu thói quen học.', 'When you meet your daily goal or finish a new unit, Habits ticks your study habit.')
              : tr('Đăng nhập Olaa ID ở Hồ sơ để Habits tự ghi nhận buổi học của bạn.', 'Sign in with Olaa ID (Me) so Habits records your study automatically.')}
          </p>
          <div className="row">
            <a className="btn btn--sm btn--ghost" href={OLAA_APPS.habits}>{tr('Mở Habits', 'Open Habits')}</a>
            {!account.email && account.status !== 'off' && <a className="btn btn--sm btn--text" href="#/me">{tr('Đăng nhập', 'Sign in')}</a>}
          </div>
        </section>

        <section className="card appcard">
          <AppTile app="note" size="lg" />
          <b>Olaa Note</b>
          <p>
            {notes.length
              ? tr(`${notes.length} ghi chú học tập, ${pending} đang chờ gửi sang Note.`, `${notes.length} study notes, ${pending} waiting to go to Note.`)
              : tr('Chạm một từ trong bài đọc hoặc lưu một quy tắc để tạo ghi chú.', 'Tap a word in a passage or save a rule to make a note.')}
          </p>
          <div className="row">
            <a className="btn btn--sm btn--ghost" href="#/notes">{tr('Ghi chú của tôi', 'My notes')}</a>
            <a className="btn btn--sm btn--text" href={OLAA_APPS.note}>{tr('Mở Note', 'Open Note')}</a>
          </div>
        </section>
      </div>
    </div>
  );
}
