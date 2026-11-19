import type { ReactNode } from 'react';
import {
  BookIcon,
  CardsIcon,
  DumbbellIcon,
  HomeIcon,
  LadderIcon,
  UserIcon,
} from '../components/Icons';
import { Mascot } from '../components/mascots';
import { StreakStat, XpStat } from '../components/ui';
import type { Course } from '../features/curriculum';
import { DailyGoalCard } from '../features/learning-progress/DailyGoalCard';
import { practicedToday, visibleStreak } from '../features/learning-progress/streak';
import { useNow } from '../hooks/useNow';
import { useAppState } from '../stores/appStore';
import { toDayKey } from '../utils/date';
import { routeHref, type Route } from './router';

const NAV: { route: Route; label: string; icon: ReactNode }[] = [
  { route: { name: 'learn' }, label: 'Learn', icon: <HomeIcon /> },
  { route: { name: 'levels' }, label: 'Lộ trình', icon: <LadderIcon /> },
  { route: { name: 'topics' }, label: 'Chủ đề', icon: <BookIcon /> },
  { route: { name: 'practice' }, label: 'Practice', icon: <DumbbellIcon /> },
  { route: { name: 'review' }, label: 'Flashcards', icon: <CardsIcon /> },
  { route: { name: 'profile' }, label: 'Profile', icon: <UserIcon /> },
];

/** Sub-pages highlight their section in the menu. */
function section(name: Route['name']): Route['name'] {
  if (name === 'level') return 'levels';
  if (name === 'topic') return 'topics';
  return name;
}

export function AppShell({
  course,
  active,
  children,
}: {
  course: Course;
  active: Route['name'];

  children: ReactNode;
}) {
  const state = useAppState();
  const now = useNow();
  const today = toDayKey(new Date(now));

  const stats = (
    <div className="stats-bar">
      <span className="course-chip" title={course.subtitle}>
        <Mascot id={course.mascot} size={30} />
        {course.title}
      </span>
      <StreakStat
        count={visibleStreak(state.streak, today)}
        active={practicedToday(state.streak, today)}
      />
      <XpStat xp={state.totalXp} />
    </div>
  );

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Main">
        <a className="logo" href={routeHref({ name: 'learn' })}>
          <span className="logo__mark" aria-hidden>
            <Mascot id={state.profile?.buddy ?? 'bear'} size={40} />
          </span>
          olaa<span>language</span>
        </a>
        <ul>
          {NAV.map((item) => (
            <li key={item.label}>
              <a
                href={routeHref(item.route)}
                className={`nav-link ${section(active) === item.route.name ? 'is-active' : ''}`}
                aria-current={section(active) === item.route.name ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shell__main">
        <div className="topbar">{stats}</div>
        <div className="shell__content">
          <main className="shell__page">{children}</main>
          <aside className="shell__aside" aria-label="Your progress">
            {stats}
            <DailyGoalCard />
            <div className="card tip-card">
              <Mascot id="giraffe" size={70} />
              <p>
                <strong>Tip from Gigi:</strong> short daily lessons beat long weekly ones. Keep your
                streak alive!
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
