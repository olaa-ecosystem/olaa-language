/** Level test (PRD 01 REQ-01-004/005): 20 graded questions, no retries, 70 % passes. */
import { useState } from 'react';
import { href, navigate } from '../app/router';
import { Icon } from '../components/Icon';
import { BackLink, Empty, Loading } from '../components/ui';
import type { Exercise } from '../features/exercises';
import { errorLabel, type ErrorCategory } from '../features/exercises/explain';
import { Player } from '../features/lesson-player/Player';
import { ResultScreen, useAnswerRecorder } from '../features/lesson-player/Result';
import type { SessionState, SessionSummary } from '../features/lesson-player/session';
import { levelsOf } from '../features/levels/load';
import { LEVEL_TEST_PASS, LEVEL_TEST_SIZE, levelTestExercises } from '../features/levels/toExercises';
import type { CurriculumLang } from '../features/levels/types';
import { canTakeTest } from '../features/levels/unlock';
import { logActivity } from '../features/today/plan';
import { pick, tr } from '../i18n/locale';
import { appStore, useAppState } from '../stores/appStore';
import { finishLevelTest, levelProgress } from '../stores/appState';
import { toDayKey } from '../utils/date';
import { useLevelUnits } from './hooks';

export const TEST_XP = 20;

/** Skills missed in a test, most missed first. */
export function weakSkills(exercises: Exercise[], missedIds: string[]): { skill: ErrorCategory; count: number }[] {
  const counts = new Map<ErrorCategory, number>();
  for (const e of exercises)
    if (missedIds.includes(e.id)) {
      const skill = (e.skill ?? 'grammar') as ErrorCategory;
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  return [...counts].map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count);
}

export function LevelTestPage({ lang, level: code }: { lang: CurriculumLang; level: string }) {
  const state = useAppState();
  const units = useLevelUnits(lang, code);
  const levels = levelsOf(lang);
  const index = levels.findIndex((l) => l.code === code);
  const level = levels[index];
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [result, setResult] = useState<{ summary: SessionSummary; session: SessionState } | null>(null);
  const { onAnswer } = useAnswerRecorder(lang);
  const levelHref = href({ name: 'level', lang, level: code });

  if (!level || !canTakeTest(levels, levelProgress(state, lang), index))
    return (
      <>
        <BackLink to="#/path">{tr('Lộ trình', 'Path')}</BackLink>
        <Empty icon="achievement" title={tr('Chưa làm được bài kiểm tra này', 'This test isn’t available yet')} />
      </>
    );
  if (units.status === 'error') return <Empty title={tr('Không tải được bài kiểm tra.', 'Could not load the test.')} />;
  if (units.status !== 'ready') return <Loading />;

  if (phase === 'play')
    return (
      <Player
        exercises={exercises}
        lang={lang}
        mode="test"
        soundOn={state.soundOn}
        onAnswer={onAnswer}
        onQuit={() => setPhase('intro')}
        onComplete={(summary, session) => {
          const day = toDayKey(new Date());
          appStore.update((s) => finishLevelTest(s, { lang, level: code, score: summary.accuracy, xp: summary.accuracy >= LEVEL_TEST_PASS ? TEST_XP : 5, today: day }));
          logActivity('test');
          setResult({ summary, session });
          setPhase('done');
        }}
      />
    );

  if (phase === 'done' && result) {
    const passed = result.summary.accuracy >= LEVEL_TEST_PASS;
    const weak = weakSkills(exercises, result.session.missedIds);
    const nextLevel = levels[index + 1];
    return (
      <ResultScreen
        title={passed ? tr(`Qua cấp ${code}!`, `${code} passed!`) : tr('Chưa qua lần này', 'Not this time')}
        summary={result.summary}
        xp={passed ? TEST_XP : 5}
        passed={passed}
        soundOn={state.soundOn}
        onContinue={() => navigate(passed && nextLevel ? href({ name: 'level', lang, level: nextLevel.code }) : levelHref)}
      >
        <div style={{ textAlign: 'left' }}>
          <p className="muted small">
            {passed
              ? nextLevel
                ? tr(`Cấp ${nextLevel.code} đã mở. Mọi bài của ${code} cũng đã mở để ôn.`, `${nextLevel.code} is open. Every ${code} unit is open for review too.`)
                : tr('Bạn đã hoàn thành cấp cao nhất.', 'You finished the top level.')
              : tr(`Cần ${Math.round(LEVEL_TEST_PASS * 100)}% để qua. Làm lại không giới hạn.`, `You need ${Math.round(LEVEL_TEST_PASS * 100)}% to pass. Retake any time.`)}
          </p>
          {!passed && weak.length > 0 && (
            <>
              <p className="small" style={{ marginTop: 10, fontWeight: 650 }}>{tr('Kỹ năng cần luyện thêm', 'Skills to work on')}</p>
              <div className="chips" style={{ marginTop: 6 }}>
                {weak.map((w) => (
                  <span key={w.skill} className="tag tag--warm">
                    {errorLabel(w.skill)} · {w.count}
                  </span>
                ))}
              </div>
              <a className="btn btn--sm btn--ghost" style={{ marginTop: 12 }} href="#/practice/mistakes">
                {tr('Luyện các câu sai', 'Practise these mistakes')}
              </a>
            </>
          )}
        </div>
      </ResultScreen>
    );
  }

  return (
    <>
      <BackLink to={levelHref}>{code}</BackLink>
      <div className="page__head">
        <div>
          <p className="eyebrow">{level.exam}</p>
          <h1>{tr(`Kiểm tra cấp ${code}`, `${code} level test`)}</h1>
          <p>{pick(level.name)}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <ul className="hlist" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[
            tr(`${LEVEL_TEST_SIZE} câu chấm tự động, lấy từ mọi bài của cấp.`, `${LEVEL_TEST_SIZE} auto-graded questions from every unit of the level.`),
            tr('Mỗi câu trả lời một lần, không làm lại trong bài.', 'One attempt per question.'),
            tr(`Đạt ${Math.round(LEVEL_TEST_PASS * 100)}% để qua và mở cấp sau.`, `Score ${Math.round(LEVEL_TEST_PASS * 100)}% to pass and open the next level.`),
          ].map((t) => (
            <li key={t} className="hab"><span className="ck" style={{ borderStyle: 'dashed' }} /><span className="hn">{t}</span></li>
          ))}
        </ul>
        {state.levels[lang]?.tests[code] !== undefined && (
          <p className="small muted" style={{ marginTop: 8 }}>
            {tr('Điểm cao nhất: ', 'Best score: ')}
            {Math.round((state.levels[lang]?.tests[code] ?? 0) * 100)}%
          </p>
        )}
        <div className="row" style={{ marginTop: 16 }}>
          <a className="btn btn--text" href={levelHref}>{tr('Để sau', 'Later')}</a>
          <button
            type="button"
            className="btn"
            style={{ flex: 1 }}
            onClick={() => {
              setExercises(levelTestExercises(units.data, lang, Date.now() >>> 0));
              setPhase('play');
            }}
          >
            <Icon name="achievement" /> {tr('Bắt đầu', 'Start')}
          </button>
        </div>
      </div>
    </>
  );
}
