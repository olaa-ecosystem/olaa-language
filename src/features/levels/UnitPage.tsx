/**
 * One unit of the level curriculum: theory, table and vocabulary first (with audio, pinyin
 * and Hán Việt for Chinese), then the unit's exercises in teaching order, then a recap.
 * The challenge questions are a separate optional session.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { navigate, routeHref } from '../../app/router';
import { EmptyState } from '../../components/ui';
import { appStore, useAppState } from '../../stores/appStore';
import { finishUnit, levelProgress } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { speak } from '../../utils/speech';
import type { Exercise } from '../exercises';
import { LessonPlayer } from '../lesson-player/LessonPlayer';
import { SessionComplete } from '../lesson-player/ResultScreens';
import { lessonXp, type SessionSummary } from '../lesson-player/session';
import { hanVietOf, levelsOf, loadHanViet } from './load';
import { RichText } from './RichText';
import { unitExercises } from './toExercises';
import type { CurriculumLang, LevelUnit } from './types';
import { levelState, unitStates } from './unlock';
import { useLevel } from './useLevel';

function useHanViet(enabled: boolean): Record<string, string> {
  const [table, setTable] = useState<Record<string, string>>({});
  useEffect(() => {
    if (enabled) void loadHanViet().then(setTable);
  }, [enabled]);
  return table;
}

export function UnitPage(props: {
  lang: CurriculumLang;
  level: string;
  unitId: string;
  challenge?: boolean;
}) {
  const { lang, level, unitId } = props;
  const state = useAppState();
  const loaded = useLevel(lang, level);
  const back = () => navigate({ name: 'level', lang, level });

  if (loaded.status !== 'ready') {
    return (
      <div className="page page--center">
        <p className="muted" role="status">
          {loaded.status === 'error' ? 'Không tải được bài học.' : 'Đang tải bài học…'}
        </p>
      </div>
    );
  }
  const units = loaded.data;
  const unit = units.find((u) => u.id === unitId);
  const levels = levelsOf(lang);
  const progress = levelProgress(state, lang);
  const levelOpen =
    levelState(
      levels,
      progress,
      levels.findIndex((l) => l.code === level),
    ) !== 'locked';
  const open =
    unit &&
    unitStates(
      units.map((u) => u.id),
      progress,
      level,
      levelOpen,
    )[unit.id] !== 'locked';

  if (!unit || !open) {
    return (
      <div className="page page--center">
        <EmptyState mascot={null} title="Bài này chưa mở">
          <p>Học xong bài trước trong cấp độ để mở bài này.</p>
          <button type="button" className="btn" onClick={back}>
            Về danh sách bài
          </button>
        </EmptyState>
      </div>
    );
  }
  const next = units[units.indexOf(unit) + 1] ?? null;
  return (
    <UnitSession
      key={`${unit.id}${props.challenge ? ':c' : ''}`}
      lang={lang}
      unit={unit}
      next={next}
      challenge={!!props.challenge}
      onExit={back}
    />
  );
}

function UnitSession({
  lang,
  unit,
  next,
  challenge,
  onExit,
}: {
  lang: CurriculumLang;
  unit: LevelUnit;
  next: LevelUnit | null;
  challenge: boolean;
  onExit: () => void;
}) {
  const state = useAppState();
  const buddy = state.profile?.buddy ?? 'bear';
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>(challenge ? 'play' : 'intro');
  const [result, setResult] = useState<{ summary: SessionSummary; xp: number } | null>(null);
  const exercises = useMemo<Exercise[]>(
    () => unitExercises(unit, lang, challenge),
    [unit, lang, challenge],
  );
  const hanViet = useHanViet(lang === 'zh');

  const onComplete = useCallback(
    (summary: SessionSummary) => {
      const xp = lessonXp(summary);
      if (!challenge) {
        appStore.update((s) =>
          finishUnit(s, { lang, unit, score: summary.accuracy, xp, today: toDayKey(new Date()) }),
        );
      }
      setResult({ summary, xp });
      setPhase('done');
    },
    [challenge, lang, unit],
  );

  if (phase === 'done' && result) {
    return (
      <SessionComplete
        buddy={buddy}
        title={challenge ? 'Xong thử thách!' : 'Xong bài học!'}
        xp={challenge ? 0 : result.xp}
        summary={result.summary}
        extra={
          <div className="recap card">
            <h2>Tóm tắt</h2>
            {!challenge && unit.vocab.length > 0 && (
              <p className="muted">
                {unit.vocab.length} từ của bài đã vào thẻ ôn tập; chúng quay lại từ ngày mai.
              </p>
            )}
            {!challenge && unit.challenge.length > 0 && (
              <a
                className="btn btn--ghost btn--block"
                href={routeHref({
                  name: 'unit',
                  lang,
                  level: unit.level,
                  unitId: unit.id,
                  challenge: true,
                })}
              >
                Thử thách thêm ({unit.challenge.length} câu khó)
              </a>
            )}
            {next && (
              <a
                className="btn btn--ghost btn--block"
                href={routeHref({ name: 'unit', lang, level: unit.level, unitId: next.id })}
              >
                Bài tiếp: {next.title[0]}
              </a>
            )}
          </div>
        }
        onContinue={onExit}
      />
    );
  }

  if (phase === 'play') {
    return (
      <LessonPlayer
        exercises={exercises}
        buddy={buddy}
        targetLang={lang}
        mode="lesson"
        soundOn={state.soundOn}
        onAnswer={() => {}}
        onCantListen={() => {}}
        onComplete={onComplete}
        onQuit={onExit}
      />
    );
  }

  return (
    <div className="lesson-intro unit-intro">
      <button
        type="button"
        className="icon-btn lesson-intro__close"
        aria-label="Về danh sách bài"
        onClick={onExit}
      >
        ×
      </button>
      <div>
        <p className="eyebrow">{unit.level}</p>
        <h1>{unit.title[0]}</h1>
        <p className="lesson-intro__goal">
          {unit.title[1]} · {exercises.length} câu luyện tập · khoảng{' '}
          {Math.max(5, Math.round((exercises.length * 30) / 60))} phút
        </p>
      </div>

      {unit.theory.length > 0 && (
        <section className="card" aria-label="Lý thuyết">
          <h2>Lý thuyết</h2>
          {unit.theory.map((p, i) => (
            <RichText key={i} text={p[0]} />
          ))}
        </section>
      )}

      {unit.table && (
        <section className="card table-wrap" aria-label="Bảng">
          <table className="unit-table">
            <thead>
              <tr>
                {unit.table[0]!.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unit.table.slice(1).map((row, r) => (
                <tr key={r}>
                  {row.map((c, i) => (
                    <td key={i}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {unit.hanzi && (
        <section className="card" aria-label="Chữ Hán">
          <h2>Chữ Hán của bài</h2>
          <ul className="hanzi-list">
            {[...unit.hanzi].map((ch, i) => (
              <li key={`${ch}-${i}`}>
                <button
                  type="button"
                  className="hanzi"
                  lang="zh"
                  onClick={() => speak(ch, 'zh')}
                  aria-label={`Nghe ${ch}`}
                >
                  {ch}
                </button>
                {hanViet[ch] && <small>{hanViet[ch]}</small>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {unit.vocab.length > 0 && (
        <section className="card lesson-intro__words" aria-label="Từ vựng">
          <h2>Từ vựng</h2>
          <ul>
            {unit.vocab.map((w) => (
              <li key={w.word}>
                <button
                  type="button"
                  className="speak-btn"
                  aria-label={`Nghe ${w.word}`}
                  onClick={() => speak(w.word, lang)}
                >
                  🔊
                </button>
                <strong lang={lang}>{w.word}</strong>
                {w.sound && <span className="vocab-sound">{w.sound}</span>}
                <span>{w.vi}</span>
                {lang === 'zh' && hanVietOf(w.word, hanViet) && (
                  <span className="vocab-hanviet">Hán Việt: {hanVietOf(w.word, hanViet)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="lesson-intro__actions">
        <button type="button" className="btn btn--block" onClick={() => setPhase('play')} autoFocus>
          Bắt đầu luyện tập
        </button>
      </div>
    </div>
  );
}
