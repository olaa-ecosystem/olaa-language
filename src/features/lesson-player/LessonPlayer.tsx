import { useCallback, useEffect, useState } from 'react';
import { CloseIcon } from '../../components/Icons';
import { CHEERS, COMFORTS, Mascot } from '../../components/mascots';
import { ProgressBar } from '../../components/ui';
import type { LanguageCode, MascotId } from '../../types';
import { playFeedback } from '../../utils/sound';
import { gradeExercise, type Exercise, type GradeResult } from '../exercises';
import { explainMistake, type Explanation } from '../exercises/explain';
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
  mode: 'lesson' | 'practice';
  soundOn: boolean;
  /** Continue a saved session instead of starting fresh (PRD v1.0 §6.1 "resume state"). */
  initialSession?: SessionState;
  /** Called after every step so the caller can save the session. */
  onProgress?: (session: SessionState) => void;
  onAnswer: (exercise: Exercise, correct: boolean, explanation: Explanation | null) => void;
  onCantListen: () => void;
  onComplete: (summary: SessionSummary) => void;
  onQuit: () => void;
}

function skipListening(session: SessionState): SessionState {
  let next = session;
  while (currentExercise(next)?.kind === 'listen') next = skipCurrent(next);
  return next;
}

export function LessonPlayer(props: LessonPlayerProps) {
  const { exercises, buddy, targetLang, mode, soundOn, initialSession } = props;
  const { onAnswer, onCantListen, onComplete, onQuit, onProgress } = props;

  const [session, setSession] = useState(
    () => initialSession ?? startSession(exercises, Date.now()),
  );
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [listenOff, setListenOff] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const exercise = currentExercise(session);

  const check = useCallback(
    (forced?: string) => {
      if (!exercise || result) return;
      const given = forced ?? response ?? '';
      const graded = gradeExercise(exercise, given);
      const why = explainMistake(exercise, given, graded);
      setResult(graded);
      setExplanation(why);
      onAnswer(exercise, graded.correct, why);
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
      setExplanation(null);
      onProgress?.(settled);
      if (isComplete(settled)) {
        if (soundOn) playFeedback('complete');
        onComplete(summarize(settled, Date.now()));
      }
    },
    [listenOff, onComplete, soundOn, onProgress],
  );

  const proceed = useCallback(() => {
    if (!result) return;
    advance(answerCurrent(session, result.correct));
  }, [result, advance, session]);

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
        {exercise.review && <span className="review-chip">Review</span>}
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
            <Feedback
              result={result}
              explanation={explanation}
              buddy={buddy}
              seed={session.position}
            />
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
            <p>
              {mode === 'lesson'
                ? 'Your place is saved. You can continue this lesson later.'
                : 'You’ll lose your progress in this practice.'}
            </p>
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

function Feedback({
  result,
  explanation,
  buddy,
  seed,
}: {
  result: GradeResult;
  explanation: Explanation | null;
  buddy: MascotId;
  seed: number;
}) {
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
        {explanation && <p className="feedback__why">{explanation.why}</p>}
      </div>
    </div>
  );
}
