/** Level curriculum: choose a language, see its levels (A1–C2 / HSK1–6) and their units. */
import { navigate, routeHref } from '../../app/router';
import { EmptyState, ProgressBar } from '../../components/ui';
import { appStore, useAppState } from '../../stores/appStore';
import { levelProgress, setLevelLang } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { dueCards } from '../flashcards-srs/srs';
import { CURRICULUM_LANGS, languageName, levelsOf } from './load';
import { LEVEL_TEST_PASS } from './toExercises';
import type { CurriculumLang } from './types';
import { canTakeTest, levelState, unitStates } from './unlock';
import { useLevel } from './useLevel';

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function LanguageTabs({ lang }: { lang: CurriculumLang }) {
  return (
    <div className="chip-row" role="tablist" aria-label="Ngôn ngữ">
      {CURRICULUM_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={l === lang}
          className={`chip ${l === lang ? 'is-selected' : ''}`}
          onClick={() => appStore.update((s) => setLevelLang(s, l))}
        >
          {languageName(l)[0]}
        </button>
      ))}
    </div>
  );
}

export function LevelsPage() {
  const state = useAppState();
  const lang = state.levelLang ?? 'en';
  const levels = levelsOf(lang);
  const progress = levelProgress(state, lang);
  const due = dueCards(progress.cards, toDayKey(new Date())).length;

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <h1>Lộ trình theo cấp độ</h1>
          <p>
            Lý thuyết, từ vựng và bài tập do đội nội dung soạn. Qua bài kiểm tra cấp độ (từ{' '}
            {pct(LEVEL_TEST_PASS)}) để mở cấp tiếp theo.
          </p>
        </div>
      </section>
      <LanguageTabs lang={lang} />
      {due > 0 && (
        <a className="card level-due" href={routeHref({ name: 'level-review', lang })}>
          <strong>{due} từ cần ôn hôm nay</strong>
          <span className="muted">Ôn từ vựng của các bài đã học</span>
        </a>
      )}
      <ol className="level-list">
        {levels.map((level, i) => {
          const open = levelState(levels, progress, i);
          const test = progress.tests[level.code];
          return (
            <li key={level.code} className={`card level-card is-${open}`}>
              <div className="level-card__head">
                <span className="level-badge">{level.code}</span>
                <div>
                  <h2>{level.name[0]}</h2>
                  <p className="muted">
                    {level.exam} · {level.words} từ
                  </p>
                </div>
              </div>
              {test !== undefined && (
                <p className="muted">
                  Bài kiểm tra: {pct(test)} {open === 'done' ? '· Đã qua' : ''}
                </p>
              )}
              <div className="level-card__actions">
                {open !== 'locked' && (
                  <a className="btn" href={routeHref({ name: 'level', lang, level: level.code })}>
                    {open === 'done' ? 'Xem lại' : 'Học'}
                  </a>
                )}
                {canTakeTest(levels, progress, i) && open !== 'done' && (
                  <a
                    className="btn btn--ghost"
                    href={routeHref({ name: 'level-test', lang, level: level.code })}
                  >
                    {open === 'locked' ? 'Kiểm tra để vượt cấp' : 'Kiểm tra cấp độ'}
                  </a>
                )}
                {open === 'locked' && !canTakeTest(levels, progress, i) && (
                  <span className="muted">Qua cấp trước để mở</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function LevelPage({ lang, level }: { lang: CurriculumLang; level: string }) {
  const state = useAppState();
  const levels = levelsOf(lang);
  const index = levels.findIndex((l) => l.code === level);
  const meta = levels[index];
  const progress = levelProgress(state, lang);
  const loaded = useLevel(lang, level);
  const open = index >= 0 ? levelState(levels, progress, index) : 'locked';

  if (!meta || open === 'locked') {
    return (
      <div className="page page--center">
        <EmptyState mascot={null} title="Cấp độ này chưa mở">
          <p>Qua bài kiểm tra của cấp trước, hoặc làm bài kiểm tra để vượt cấp.</p>
          <button type="button" className="btn" onClick={() => navigate({ name: 'levels' })}>
            Về lộ trình
          </button>
        </EmptyState>
      </div>
    );
  }

  if (loaded.status !== 'ready') {
    return (
      <div className="page page--center">
        <p className="muted" role="status">
          {loaded.status === 'error'
            ? 'Không tải được bài học. Kiểm tra mạng rồi thử lại.'
            : 'Đang tải bài học…'}
        </p>
      </div>
    );
  }

  const units = loaded.data;
  const states = unitStates(
    units.map((u) => u.id),
    progress,
    level,
    true,
  );
  const done = units.filter((u) => states[u.id] === 'done').length;

  return (
    <div className="page">
      <a className="link-btn" href={routeHref({ name: 'levels' })}>
        ← {languageName(lang)[0]}
      </a>
      <header>
        <p className="eyebrow">
          {meta.code} · {meta.exam}
        </p>
        <h1>{meta.name[0]}</h1>
        <ProgressBar value={units.length ? done / units.length : 0} label="Tiến độ cấp độ" />
        <p className="muted">
          {done}/{units.length} bài đã học
        </p>
      </header>
      <ol className="unit-list">
        {units.map((unit, i) => {
          const s = states[unit.id] ?? 'locked';
          const score = progress.units[unit.id];
          return (
            <li key={unit.id}>
              {s === 'locked' ? (
                <span className={`card unit-row is-locked`} aria-disabled="true">
                  <span className="unit-row__n">{i + 1}</span>
                  <span>
                    <strong>{unit.title[0]}</strong>
                    <small className="muted">Học xong bài trước để mở</small>
                  </span>
                </span>
              ) : (
                <a
                  className={`card unit-row is-${s}`}
                  href={routeHref({ name: 'unit', lang, level, unitId: unit.id })}
                >
                  <span className="unit-row__n">{s === 'done' ? '✓' : i + 1}</span>
                  <span>
                    <strong>{unit.title[0]}</strong>
                    <small className="muted">
                      {unit.vocab.length} từ · {unit.items.length} câu
                      {score !== undefined ? ` · đúng ${pct(score)}` : ''}
                    </small>
                  </span>
                </a>
              )}
            </li>
          );
        })}
      </ol>
      {open !== 'done' && (
        <a className="btn btn--block" href={routeHref({ name: 'level-test', lang, level })}>
          Làm bài kiểm tra {meta.code}
        </a>
      )}
    </div>
  );
}
