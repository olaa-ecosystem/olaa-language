import { useCallback, useState } from 'react';
import { navigate } from '../../app/router';
import { Mascot } from '../../components/mascots';
import { HeartIcon } from '../../components/Icons';
import { EmptyState } from '../../components/ui';
import { appStore, useAppState } from '../../stores/appStore';
import {
  awardXp,
  courseProgress,
  gainHeart,
  pauseListening,
  recordMistake,
  resolveMistake,
} from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { createRng, shuffle } from '../../utils/random';
import type { Course } from '../curriculum';
import { generatePracticeExercises, type Exercise } from '../exercises';
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
    (exercise: Exercise, correct: boolean) => {
      appStore.update((s) =>
        correct ? resolveMistake(s, course.id, exercise.id) : recordMistake(s, course.id, exercise),
      );
    },
    [course.id],
  );

  const onComplete = useCallback((result: SessionSummary) => {
    appStore.update((s) => gainHeart(awardXp(s, PRACTICE_XP, toDayKey(new Date())), Date.now()));
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
        extra={
          <p className="reward-chip">
            <HeartIcon size={18} /> +1 heart earned
          </p>
        }
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
      hearts={0}
      soundOn={state.soundOn}
      onAnswer={onAnswer}
      onCantListen={() => appStore.update((s) => pauseListening(s, Date.now() + 3600_000))}
      onComplete={onComplete}
      onOutOfHearts={exit}
      onQuit={exit}
    />
  );
}
