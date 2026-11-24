import { useCallback, useEffect, type ReactNode } from 'react';
import { Layer } from '../../components/Layer';
import { Icon } from '../../components/Icon';
import { Confetti } from '../../components/ui';
import { formatNumber, tr } from '../../i18n/locale';
import { appStore } from '../../stores/appStore';
import { applyLevelCardReview, pauseListening, recordMistake, resolveMistake } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { playFeedback } from '../../utils/sound';
import type { Exercise } from '../exercises';
import type { Explanation } from '../exercises/explain';
import type { CurriculumLang } from '../levels/types';
import type { SessionSummary } from './session';

export function ResultScreen({
  title,
  summary,
  xp,
  passed = true,
  soundOn,
  children,
  onContinue,
}: {
  title: string;
  summary: SessionSummary;
  xp: number;
  passed?: boolean;
  soundOn: boolean;
  children?: ReactNode;
  onContinue: () => void;
}) {
  useEffect(() => {
    if (soundOn && passed) playFeedback('complete');
  }, [soundOn, passed]);
  const minutes = Math.max(1, Math.round(summary.durationMs / 60000));
  return (
    <Layer>
      {passed && <Confetti />}
      <div className="done-screen">
        <div className="card">
          <div className="burst" style={passed ? undefined : { background: 'var(--habit-grad)' }}>
            <Icon name="achievement" />
          </div>
          <h1>{title}</h1>
          <div className="result-stats">
            <div className="stat">
              <b>+{formatNumber(xp)}</b>
              <span>XP</span>
            </div>
            <div className="stat">
              <b>{Math.round(summary.accuracy * 100)}%</b>
              <span>{tr('đúng lần đầu', 'first try')}</span>
            </div>
            <div className="stat">
              <b>{minutes}</b>
              <span>{tr('phút', 'min')}</span>
            </div>
          </div>
          {children}
          <button type="button" className="btn btn--block" style={{ marginTop: 16 }} onClick={onContinue} autoFocus>
            {tr('Tiếp tục', 'Continue')}
          </button>
        </div>
      </div>
    </Layer>
  );
}

/** Records each answer: mistakes kept for practice, fixed mistakes cleared, flashcards rescheduled. */
export function useAnswerRecorder(lang: CurriculumLang) {
  const onAnswer = useCallback(
    (exercise: Exercise, correct: boolean, why: Explanation | null) => {
      const today = toDayKey(new Date());
      appStore.update((s) => {
        let next = correct ? resolveMistake(s, lang, exercise.id) : recordMistake(s, lang, exercise, why?.category);
        if (exercise.cardId) next = applyLevelCardReview(next, lang, exercise.cardId, correct ? 'good' : 'again', today);
        return next;
      });
    },
    [lang],
  );
  const onCantListen = useCallback(() => {
    appStore.update((s) => pauseListening(s, Date.now() + 60 * 60 * 1000));
  }, []);
  return { onAnswer, onCantListen };
}
