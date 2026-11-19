import { getCourse, isCourseId } from '../features/curriculum';
import { LearnPage } from '../features/curriculum/LearnPage';
import { ReviewPage } from '../features/flashcards-srs/ReviewPage';
import { ProfilePage } from '../features/learning-progress/ProfilePage';
import { LessonPage } from '../features/lesson-player/LessonPage';
import { WelcomePage } from '../features/onboarding/WelcomePage';
import { PracticePage } from '../features/revision-mistakes/PracticePage';
import { PracticeSessionPage } from '../features/revision-mistakes/PracticeSessionPage';
import { useAppState } from '../stores/appStore';
import { AppShell } from './AppShell';
import { parseRoute, useHash } from './router';

export function App() {
  const state = useAppState();
  const route = parseRoute(useHash());

  if (!state.profile || !isCourseId(state.activeCourseId)) return <WelcomePage />;
  const course = getCourse(state.activeCourseId);

  // Focused, full-screen sessions.
  switch (route.name) {
    case 'lesson':
      return <LessonPage key={route.lessonId} course={course} lessonId={route.lessonId} />;
    case 'practice-session':
      return <PracticeSessionPage key={route.kind} course={course} kind={route.kind} />;
    case 'review':
      return <ReviewPage course={course} />;
  }

  return (
    <AppShell course={course} active={route.name}>
      {route.name === 'practice' && <PracticePage course={course} />}
      {route.name === 'profile' && <ProfilePage course={course} />}
      {route.name === 'learn' && <LearnPage course={course} />}
    </AppShell>
  );
}
