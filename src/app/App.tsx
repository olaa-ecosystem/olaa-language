import type { ReactNode } from 'react';
import { AppTile, Toasts, useToday } from '../components/ui';
import { Field } from '../components/Field';
import { Icon, type IconName } from '../components/Icon';
import { formatNumber, tr, useLocale } from '../i18n/locale';
import { useAppState } from '../stores/appStore';
import { visibleStreak } from '../features/learning-progress/streak';
import { fromDayKey } from '../utils/date';
import { OLAA_APPS, sectionOf, useRoute, type Route, type Section } from './router';
import { nextTheme, themeStore } from './theme';
import { WelcomePage } from '../pages/WelcomePage';
import { TodayPage } from '../pages/TodayPage';
import { PathPage, LevelPage } from '../pages/PathPages';
import { UnitPage } from '../pages/UnitPage';
import { LevelTestPage } from '../pages/LevelTestPage';
import { TopicsPage, TopicPage, TopicPracticePage } from '../pages/TopicPages';
import { PracticePage, PracticeSessionPage, SoundsPage } from '../pages/PracticePages';
import { WordsPage, ReviewPage } from '../pages/WordsPages';
import { ProfilePage, NotesPage } from '../pages/ProfilePages';

function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <Field />
      <div className="app">{children}</div>
      <div className="grain" aria-hidden="true" />
      <Toasts />
    </>
  );
}

const NAV: { section: Section; href: string; icon: IconName; label: [string, string] }[] = [
  { section: 'today', href: '#/', icon: 'lessons', label: ['Học', 'Learn'] },
  { section: 'path', href: '#/path', icon: 'progress', label: ['Lộ trình', 'Path'] },
  { section: 'topics', href: '#/topics', icon: 'collections', label: ['Chủ đề', 'Topics'] },
  { section: 'practice', href: '#/practice', icon: 'goals', label: ['Luyện tập', 'Practice'] },
  { section: 'words', href: '#/words', icon: 'vocabulary', label: ['Thẻ từ', 'Words'] },
  { section: 'me', href: '#/me', icon: 'profile', label: ['Hồ sơ', 'Me'] },
];

function Nav({ route }: { route: Route }) {
  const current = sectionOf(route);
  return (
    <nav className="nav" aria-label={tr('Điều hướng chính', 'Main navigation')}>
      {NAV.map((n) => (
        <a key={n.section} href={n.href} aria-current={current === n.section ? 'page' : undefined}>
          <Icon name={n.icon} />
          <span>{tr(...n.label)}</span>
        </a>
      ))}
    </nav>
  );
}

function TopBar() {
  const state = useAppState();
  const today = useToday();
  const theme = themeStore.use();
  const locale = useLocale();
  const streak = visibleStreak(state.streak, today);
  const date = fromDayKey(today).toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const themeLabel = { system: tr('Theo thiết bị', 'Device'), light: tr('Sáng', 'Light'), dark: tr('Tối', 'Dark') }[theme];
  return (
    <header className="topbar">
      <a href="#/" className="wordmark" style={{ color: 'inherit', textDecoration: 'none' }}>
        olaa <span>language</span>
      </a>
      <div className="topbar__when">
        <b>{date}</b>
        <small>{tr(`${formatNumber(state.xpByDay[today] ?? 0)}/${state.dailyGoalXp} XP hôm nay`, `${formatNumber(state.xpByDay[today] ?? 0)}/${state.dailyGoalXp} XP today`)}</small>
      </div>
      <div className="topbar__spacer" />
      <span className="streak-pill" title={tr('Chuỗi ngày học', 'Day streak')}>
        <Icon name="flame" />
        {streak}
        <span className="sr-only">{tr('ngày liên tiếp', 'day streak')}</span>
      </span>
      <button
        type="button"
        className="iconbtn topbar__theme"
        onClick={() => themeStore.set(nextTheme(theme))}
        aria-label={tr(`Giao diện: ${themeLabel}. Bấm để đổi`, `Theme: ${themeLabel}. Tap to change`)}
        title={themeLabel}
      >
        <Icon name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'auto'} />
      </button>
      {/* App switcher, fixed order Language → Note → Habits (UI buttons PRD 7.3). */}
      <nav className="switcher" aria-label={tr('Ứng dụng Olaa', 'Olaa apps')}>
        <span aria-current="page">
          <AppTile app="lang" open />
        </span>
        <a className="apptile apptile--note" href={OLAA_APPS.note} aria-label={tr('Mở Olaa Note', 'Open Olaa Note')} title="Olaa Note">
          <Icon name="note" />
        </a>
        <a className="apptile apptile--habit" href={OLAA_APPS.habits} aria-label={tr('Mở Olaa Habits', 'Open Olaa Habits')} title="Olaa Habits">
          <Icon name="ring" />
        </a>
      </nav>
    </header>
  );
}

function page(route: Route): ReactNode {
  switch (route.name) {
    case 'today':
      return <TodayPage />;
    case 'path':
      return <PathPage />;
    case 'level':
      return <LevelPage lang={route.lang} level={route.level} />;
    case 'unit':
      return <UnitPage lang={route.lang} level={route.level} unitId={route.unitId} challenge={route.challenge} />;
    case 'test':
      return <LevelTestPage lang={route.lang} level={route.level} />;
    case 'topics':
      return <TopicsPage />;
    case 'topic':
      return <TopicPage topicId={route.topicId} />;
    case 'topic-practice':
      return <TopicPracticePage topicId={route.topicId} lang={route.lang} />;
    case 'practice':
      return <PracticePage />;
    case 'practice-session':
      return <PracticeSessionPage kind={route.kind} />;
    case 'sounds':
      return <SoundsPage />;
    case 'words':
      return <WordsPage />;
    case 'review':
      return <ReviewPage />;
    case 'notes':
      return <NotesPage />;
    case 'me':
      return <ProfilePage />;
  }
}

export function App() {
  const route = useRoute();
  const state = useAppState();
  const locale = useLocale();
  if (!state.profile)
    return (
      <Frame key={locale}>
        <WelcomePage />
      </Frame>
    );
  return (
    <Frame key={locale}>
      <TopBar />
      <div className="shell">
        <Nav route={route} />
        <main className="layout" id="main">
          <div className="page" key={JSON.stringify(route)}>
            {page(route)}
          </div>
        </main>
      </div>
    </Frame>
  );
}
