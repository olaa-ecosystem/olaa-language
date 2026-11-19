/**
 * Level test: auto-graded questions from every unit of the level, no second tries. Passing
 * (70 % or more) opens the next level and every unit of this one.
 */
import { useCallback, useState } from 'react';
import { navigate } from '../../app/router';
import { appStore, useAppState } from '../../stores/appStore';
import { finishLevelTest, levelProgress } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import type { Exercise } from '../exercises';
import { LessonPlayer } from '../lesson-player/LessonPlayer';
import { SessionComplete } from '../lesson-player/ResultScreens';
import type { SessionSummary } from '../lesson-player/session';
import { levelsOf } from './load';
import { LEVEL_TEST_PASS, levelTestExercises } from './toExercises';
import type { CurriculumLang } from './types';
import { canTakeTest } from './unlock';
import { useLevel } from './useLevel';

const TEST_XP = 30;

export function LevelTestPage({ lang, level }: { lang: CurriculumLang; level: string }) {
  const state = useAppState();
  const loaded = useLevel(lang, level);
  const levels = levelsOf(lang);
  const index = levels.findIndex((l) => l.code === level);
  const allowed = index >= 0 && canTakeTest(levels, levelProgress(state, lang), index);
  const back = () => navigate({ name: 'levels' });

  if (!allowed) {
    return (
      <div className="page page--center">
        <p>Chưa làm được bài kiểm tra này. Qua cấp trước trước đã.</p>
        <button type="button" className="btn" onClick={back}>
          Về lộ trình
        </button>
      </div>
    );
  }
  if (loaded.status !== 'ready') {
    return (
      <div className="page page--center">
        <p className="muted" role="status">
          {loaded.status === 'error'
            ? 'Không tải được bài kiểm tra.'
            : 'Đang chuẩn bị bài kiểm tra…'}
        </p>
      </div>
    );
  }
  return (
    <TestSession
      key={level}
      lang={lang}
      level={level}
      exercises={levelTestExercises(loaded.data, lang, Date.now())}
    />
  );
}

function TestSession({
  lang,
  level,
  exercises,
}: {
  lang: CurriculumLang;
  level: string;
  exercises: Exercise[];
}) {
  const state = useAppState();
  const buddy = state.profile?.buddy ?? 'bear';
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<SessionSummary | null>(null);
  const back = () => navigate({ name: 'levels' });

  const onComplete = useCallback(
    (summary: SessionSummary) => {
      const passed = summary.accuracy >= LEVEL_TEST_PASS;
      appStore.update((s) =>
        finishLevelTest(s, {
          lang,
          level,
          score: summary.accuracy,
          xp: passed ? TEST_XP : 0,
          today: toDayKey(new Date()),
        }),
      );
      setResult(summary);
    },
    [lang, level],
  );

  if (result) {
    const passed = result.accuracy >= LEVEL_TEST_PASS;
    return (
      <SessionComplete
        buddy={buddy}
        title={passed ? `Qua cấp ${level}!` : 'Chưa qua lần này'}
        xp={passed ? TEST_XP : 0}
        summary={result}
        extra={
          <div className="recap card">
            <p>
              Đúng {Math.round(result.accuracy * 100)}% (cần {Math.round(LEVEL_TEST_PASS * 100)}%).
            </p>
            <p className="muted">
              {passed
                ? 'Cấp tiếp theo đã mở, và mọi bài trong cấp này đều học được.'
                : 'Học thêm các bài của cấp này rồi làm lại; mỗi lần là một bộ câu hỏi khác.'}
            </p>
          </div>
        }
        onContinue={back}
      />
    );
  }

  if (!started) {
    return (
      <div className="lesson-intro">
        <p className="eyebrow">Bài kiểm tra cấp độ</p>
        <h1>{level}</h1>
        <p className="lesson-intro__goal">
          {exercises.length} câu lấy từ mọi bài của cấp. Mỗi câu chỉ trả lời một lần. Cần đúng từ{' '}
          {Math.round(LEVEL_TEST_PASS * 100)}% để qua.
        </p>
        <div className="lesson-intro__actions">
          <button
            type="button"
            className="btn btn--block"
            onClick={() => setStarted(true)}
            autoFocus
          >
            Bắt đầu
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={back}>
            Để sau
          </button>
        </div>
      </div>
    );
  }

  return (
    <LessonPlayer
      exercises={exercises}
      buddy={buddy}
      targetLang={lang}
      mode="practice"
      soundOn={state.soundOn}
      noRetry
      onAnswer={() => {}}
      onCantListen={() => {}}
      onComplete={onComplete}
      onQuit={back}
    />
  );
}
