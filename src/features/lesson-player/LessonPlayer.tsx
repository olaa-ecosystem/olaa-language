import { useCallback, useEffect, useState } from 'react';
import { CloseIcon } from '../../components/Icons';
import { CHEERS, COMFORTS, Mascot } from '../../components/mascots';
import { HeartsStat, ProgressBar } from '../../components/ui';
import type { LanguageCode, MascotId } from '../../types';
import { playFeedback } from '../../utils/sound';
import { gradeExercise, type Exercise, type GradeResult } from '../exercises';
import { PictureView, SelectView } from './exercises/ChoiceViews';
import { MatchView } from './exercises/MatchView';
import { BuildView, ListenView } from './exercises/TileViews';
import { TypeView } from './exercises/TypeView';
import {
  answerCurrent,
  currentExercise,
  isComplete,
  progressRatio,
  skipCurrent,
  startSession,
  summarize,
  type SessionState,
  type SessionSummary,
} from './session';

export interface LessonPlayerProps {
  exercises: Exercise[];
  buddy: MascotId;
  targetLang: LanguageCode;
  /** In practice mode mistakes cost no hearts. */
  mode: 'lesson' | 'practice';
  hearts: number;
  soundOn: boolean;
  onAnswer: (exercise: Exercise, correct: boolean) => void;
  onCantListen: () => void;
  onComplete: (summary: SessionSummary) => void;
  onOutOfHearts: () => void;
  onQuit: () => void;
}

function skipListening(session: SessionState): SessionState {
  let next = session;
  while (currentExercise(next)?.kind === 'listen') next = skipCurrent(next);
  return next;
}

export function LessonPlayer(props: LessonPlayerProps) {
  const { exercises, buddy, targetLang, mode, hearts, soundOn } = props;
  const { onAnswer, onCantListen, onComplete, onOutOfHearts, onQuit } = props;

  const [session, setSession] = useState(() => startSession(exercises, Date.now()));
  const [response, setResponse] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [listenOff, setListenOff] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const exercise = currentExercise(session);

  const check = useCallback(
    (forced?: string) => {
      if (!exercise || result) return;
      const graded = gradeExercise(exercise, forced ?? response ?? '');
      setResult(graded);
      onAnswer(exercise, graded.correct);
      if (soundOn) playFeedback(graded.correct ? 'correct' : 'wrong');
    },
    [exercise, result, response, onAnswer, soundOn],
  );

  const advance = useCallback(
    (next: SessionState) => {
      const settled = listenOff ? skipListening(next) : next;
      setSession(settled);
      setResponse(null);
      setResult(null);
      if (isComplete(settled)) {
        if (soundOn) playFeedback('complete');
        onComplete(summarize(settled, Date.now()));
      }
    },
    [listenOff, onComplete, soundOn],
  );

  const proceed = useCallback(() => {
    if (!result) return;
    if (mode === 'lesson' && !result.correct && hearts <= 0) {
      onOutOfHearts();
      return;
    }
    advance(answerCurrent(session, result.correct));
  }, [result, mode, hearts, onOutOfHearts, advance, session]);

  const cantListen = () => {
    setListenOff(true);
    onCantListen();
    advance(skipListening(session));
  };

  // Matching finishes itself once every pair is found.
  useEffect(() => {
    if (exercise?.kind === 'match' && response === 'done' && !result) check();
  }, [exercise, response, result, check]);

  // Enter = Check / Continue (buttons handle their own Enter natively).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || confirmQuit || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (result) proceed();
      else if (response) check();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [result, response, proceed, check, confirmQuit]);

  if (!exercise) return null;

  const viewProps = {
    buddy,
    targetLang,
    locked: !!result,
    result,
    response,
    onResponse: setResponse,
  };

  return (
    <div className="lesson">
      <header className="lesson__top">
        <button
          type="button"
          className="icon-btn"
          aria-label="Quit lesson"
          onClick={() => setConfirmQuit(true)}
        >
          <CloseIcon />
        </button>
        <ProgressBar value={progressRatio(session)} label="Lesson progress" />
        <HeartsStat hearts={hearts} unlimited={mode === 'practice'} />
      </header>

      <main className="lesson__body" key={session.position}>
        {exercise.kind === 'select' && <SelectView exercise={exercise} {...viewProps} />}
        {exercise.kind === 'picture' && <PictureView exercise={exercise} {...viewProps} />}
        {exercise.kind === 'build' && <BuildView exercise={exercise} {...viewProps} />}
        {exercise.kind === 'type' && <TypeView exercise={exercise} {...viewProps} />}
        {exercise.kind === 'match' && <MatchView exercise={exercise} {...viewProps} />}
        {exercise.kind === 'listen' && (
          <ListenView exercise={exercise} {...viewProps} onCantListen={cantListen} />
        )}
      </main>

      <footer
        className={`lesson__footer ${result ? (result.correct ? 'is-correct' : 'is-wrong') : ''}`}
      >
        <div className="lesson__footer-inner">
          {result ? (
            <Feedback result={result} buddy={buddy} seed={session.position} />
          ) : (
            exercise.kind !== 'match' && (
              <button type="button" className="btn btn--ghost" onClick={() => check('')}>
                Skip
              </button>
            )
          )}
          {result ? (
            <button
              type="button"
              className={`btn ${result.correct ? 'btn--success' : 'btn--danger'}`}
              onClick={proceed}
              autoFocus
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--success"
              disabled={!response || exercise.kind === 'match'}
              onClick={() => check()}
            >
              Check
            </button>
          )}
        </div>
      </footer>

      {confirmQuit && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="quit-title">
            <Mascot id={buddy} size={120} mood="sad" />
            <h2 id="quit-title">Wait, don’t go!</h2>
            <p>You’ll lose your progress in this {mode === 'lesson' ? 'lesson' : 'practice'}.</p>
            <button
              type="button"
              className="btn btn--block"
              onClick={() => setConfirmQuit(false)}
              autoFocus
            >
              Keep learning
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={onQuit}>
              End session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Feedback({ result, buddy, seed }: { result: GradeResult; buddy: MascotId; seed: number }) {
  let title: string;
  let detail: string | null = null;
  if (result.correct) {
    title = CHEERS[seed % CHEERS.length]!;
    if (result.note === 'accents') detail = `Mind the accents: ${result.correctAnswer}`;
    if (result.note === 'typo') detail = `Watch the spelling: ${result.correctAnswer}`;
  } else {
    title = COMFORTS[seed % COMFORTS.length]!;
    detail = result.correctAnswer ? `Correct answer: ${result.correctAnswer}` : null;
  }
  return (
    <div className="feedback" role="status" aria-live="assertive">
      <Mascot id={buddy} size={72} mood={result.correct ? 'happy' : 'sad'} />
      <div>
        <h3>{title}</h3>
        {detail && <p>{detail}</p>}
      </div>
    </div>
  );
}
