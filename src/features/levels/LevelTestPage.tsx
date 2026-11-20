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
import { tr } from '../../i18n/locale';

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
        <p>
          {tr(
            'Chưa làm được bài kiểm tra này. Hãy qua cấp trước.',
            'This test isn’t open yet. Pass the level before first.',
          )}
        </p>
        <button type="button" className="btn" onClick={back}>
          {tr('Về lộ trình', 'Back to levels')}
        </button>
      </div>
    );
  }
  if (loaded.status !== 'ready') {
    return (
      <div className="page page--center">
        <p className="muted" role="status">
          {loaded.status === 'error'
            ? tr('Không tải được bài kiểm tra.', 'Could not load the test.')
            : tr('Đang chuẩn bị bài kiểm tra…', 'Preparing the test…')}
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
        title={
          passed
            ? tr(`Qua cấp ${level}!`, `${level} passed!`)
            : tr('Chưa qua lần này', 'Not passed this time')
        }
        xp={passed ? TEST_XP : 0}
        summary={result}
        extra={
          <div className="recap card">
            <p>
              {tr(
                `Đúng ${Math.round(result.accuracy * 100)}% (cần ${Math.round(LEVEL_TEST_PASS * 100)}%).`,
                `${Math.round(result.accuracy * 100)}% correct (${Math.round(LEVEL_TEST_PASS * 100)}% needed).`,
              )}
            </p>
            <p className="muted">
              {passed
                ? tr(
                    'Cấp tiếp theo đã mở, và mọi bài trong cấp này đều học được.',
                    'The next level is open, and every unit in this level is unlocked.',
                  )
                : tr(
                    'Học thêm các bài của cấp này rồi làm lại; mỗi lần là một bộ câu hỏi khác.',
                    'Study more units in this level and try again; each attempt has different questions.',
                  )}
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
        <p className="eyebrow">{tr('Bài kiểm tra cấp độ', 'Level test')}</p>
        <h1>{level}</h1>
        <p className="lesson-intro__goal">
          {tr(
            `${exercises.length} câu lấy từ mọi bài của cấp. Mỗi câu chỉ trả lời một lần. Cần đúng từ ${Math.round(LEVEL_TEST_PASS * 100)}% để qua.`,
            `${exercises.length} questions from every unit of the level. Each is answered once. You need ${Math.round(LEVEL_TEST_PASS * 100)}% to pass.`,
          )}
        </p>
        <div className="lesson-intro__actions">
          <button
            type="button"
            className="btn btn--block"
            onClick={() => setStarted(true)}
            autoFocus
          >
            {tr('Bắt đầu', 'Start')}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={back}>
            {tr('Để sau', 'Later')}
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
