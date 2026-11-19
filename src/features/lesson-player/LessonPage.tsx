import { useCallback, useState } from 'react';
import { navigate } from '../../app/router';
import { Mascot } from '../../components/mascots';
import { EmptyState } from '../../components/ui';
import { useNow } from '../../hooks/useNow';
import { appStore, useAppState } from '../../stores/appStore';
import {
  courseProgress,
  finishLesson,
  loseHeart,
  pauseListening,
  recordMistake,
  resolveMistake,
} from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { findLesson, lessonStatuses, type Course } from '../curriculum';
import { generateLessonExercises, type Exercise } from '../exercises';
import { currentHearts, msUntilNextHeart } from '../learning-progress/hearts';
import { LessonPlayer } from './LessonPlayer';
import { OutOfHearts, SessionComplete } from './ResultScreens';
import { lessonXp, type SessionSummary } from './session';

const LISTEN_PAUSE_MS = 60 * 60 * 1000;

export function LessonPage({ course, lessonId }: { course: Course; lessonId: string }) {
  const state = useAppState();
  const now = useNow();
  const buddy = state.profile?.buddy ?? course.mascot;
  const progress = courseProgress(state, course.id);
  const found = findLesson(course, lessonId);
  const hearts = currentHearts(state.hearts, now).current;

  const [phase, setPhase] = useState<'play' | 'done' | 'out'>(() =>
    currentHearts(appStore.getState().hearts, Date.now()).current > 0 ? 'play' : 'out',
  );
  const [result, setResult] = useState<{ summary: SessionSummary; xp: number } | null>(null);
  const [exercises] = useState<Exercise[]>(() => {
    if (!found) return [];
    const level = progress.lessonLevels[lessonId] ?? 0;
    const all = generateLessonExercises(course, found.lesson, level, Date.now());
    return state.listenOffUntil > Date.now() ? all.filter((e) => e.kind !== 'listen') : all;
  });

  const onAnswer = useCallback(
    (exercise: Exercise, correct: boolean) => {
      appStore.update((s) =>
        correct
          ? resolveMistake(s, course.id, exercise.id)
          : recordMistake(loseHeart(s, Date.now()), course.id, exercise),
      );
    },
    [course.id],
  );

  const onComplete = useCallback(
    (summary: SessionSummary) => {
      if (!found) return;
      const xp = lessonXp(summary);
      appStore.update((s) =>
        finishLesson(s, { course, lesson: found.lesson, xp, today: toDayKey(new Date()) }),
      );
      setResult({ summary, xp });
      setPhase('done');
    },
    [course, found],
  );

  const onCantListen = useCallback(() => {
    appStore.update((s) => pauseListening(s, Date.now() + LISTEN_PAUSE_MS));
  }, []);

  const exit = () => navigate({ name: 'learn' });

  if (!found || lessonStatuses(course, progress.lessonLevels)[lessonId] === 'locked') {
    return (
      <div className="page page--center">
        <EmptyState
          mascot={<Mascot id={buddy} size={140} mood="sad" />}
          title="This lesson isn’t open yet"
        >
          <p>Finish the lessons before it on your path to unlock it.</p>
          <button type="button" className="btn" onClick={exit}>
            Back to path
          </button>
        </EmptyState>
      </div>
    );
  }

  if (phase === 'out') {
    return (
      <OutOfHearts
        buddy={buddy}
        msUntilNext={msUntilNextHeart(state.hearts, now)}
        onPractice={() => navigate({ name: 'practice' })}
        onExit={exit}
      />
    );
  }

  if (phase === 'done' && result) {
    return (
      <SessionComplete
        buddy={buddy}
        title="Lesson complete!"
        xp={result.xp}
        summary={result.summary}
        onContinue={exit}
      />
    );
  }

  return (
    <LessonPlayer
      exercises={exercises}
      buddy={buddy}
      targetLang={course.targetLang}
      mode="lesson"
      hearts={hearts}
      soundOn={state.soundOn}
      onAnswer={onAnswer}
      onCantListen={onCantListen}
      onComplete={onComplete}
      onOutOfHearts={() => setPhase('out')}
      onQuit={exit}
    />
  );
}
