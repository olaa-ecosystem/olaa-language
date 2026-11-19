import { useCallback, useState } from 'react';
import { navigate } from '../../app/router';
import { Mascot } from '../../components/mascots';
import { EmptyState } from '../../components/ui';
import { appStore, useAppState } from '../../stores/appStore';
import {
  awardXp,
  courseProgress,
  pauseListening,
  recordMistake,
  resolveMistake,
} from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { createRng, shuffle } from '../../utils/random';
import type { Course } from '../curriculum';
import { generatePracticeExercises, type Exercise } from '../exercises';
import type { Explanation } from '../exercises/explain';
import { LessonPlayer } from '../lesson-player/LessonPlayer';
import { SessionComplete } from '../lesson-player/ResultScreens';
import type { SessionSummary } from '../lesson-player/session';

export const PRACTICE_XP = 10;
const MISTAKES_PER_SESSION = 10;

export function PracticeSessionPage({
  course,
  kind,
}: {
  course: Course;
  kind: 'mistakes' | 'mix';
}) {
  const state = useAppState();
  const buddy = state.profile?.buddy ?? course.mascot;

  const [exercises] = useState<Exercise[]>(() => {
    const progress = courseProgress(appStore.getState(), course.id);
    const seed = Date.now();
    const list =
      kind === 'mistakes'
        ? shuffle(Object.values(progress.mistakes), createRng(seed)).slice(0, MISTAKES_PER_SESSION)
        : generatePracticeExercises(
            course,
            Object.keys(progress.lessonLevels).filter((id) => (progress.lessonLevels[id] ?? 0) > 0),
            seed,
          );
    return appStore.getState().listenOffUntil > Date.now()
      ? list.filter((e) => e.kind !== 'listen')
      : list;
  });
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const onAnswer = useCallback(
    (exercise: Exercise, correct: boolean, why: Explanation | null) => {
      appStore.update((s) =>
        correct
          ? resolveMistake(s, course.id, exercise.id)
          : recordMistake(s, course.id, exercise, why?.category),
      );
    },
    [course.id],
  );

  const onComplete = useCallback((result: SessionSummary) => {
    appStore.update((s) => awardXp(s, PRACTICE_XP, toDayKey(new Date())));
    setSummary(result);
  }, []);

  const exit = () => navigate({ name: 'practice' });

  if (!exercises.length) {
    return (
      <div className="page page--center">
        <EmptyState mascot={<Mascot id={buddy} size={140} />} title="Nothing to practise yet">
          <p>
            {kind === 'mistakes'
              ? 'No mistakes to review — nice work! Finish more lessons to keep growing.'
              : 'Complete your first lesson to unlock practice.'}
          </p>
          <button type="button" className="btn" onClick={() => navigate({ name: 'learn' })}>
            Go to lessons
          </button>
        </EmptyState>
      </div>
    );
  }

  if (summary) {
    return (
      <SessionComplete
        buddy={buddy}
        title={kind === 'mistakes' ? 'Mistakes fixed!' : 'Practice complete!'}
        xp={PRACTICE_XP}
        summary={summary}
        onContinue={exit}
      />
    );
  }

  return (
    <LessonPlayer
      exercises={exercises}
      buddy={buddy}
      targetLang={course.targetLang}
      mode="practice"
      soundOn={state.soundOn}
      onAnswer={onAnswer}
      onCantListen={() => appStore.update((s) => pauseListening(s, Date.now() + 3600_000))}
      onComplete={onComplete}
      onQuit={exit}
    />
  );
}
