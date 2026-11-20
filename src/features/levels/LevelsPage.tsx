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
import { pick, tr } from '../../i18n/locale';

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function LanguageTabs({ lang }: { lang: CurriculumLang }) {
  return (
    <div className="chip-row" role="tablist" aria-label={tr('Ngôn ngữ đang học', 'Language')}>
      {CURRICULUM_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={l === lang}
          className={`chip ${l === lang ? 'is-selected' : ''}`}
          onClick={() => appStore.update((s) => setLevelLang(s, l))}
        >
          {pick(languageName(l))}
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
          <h1>{tr('Lộ trình theo cấp độ', 'Levels')}</h1>
          <p>
            {tr(
              `Lý thuyết, từ vựng và bài tập do đội nội dung soạn. Qua bài kiểm tra cấp độ (từ ${pct(LEVEL_TEST_PASS)}) để mở cấp tiếp theo.`,
              `Theory, vocabulary and exercises written by our content team. Pass a level test (${pct(LEVEL_TEST_PASS)} or more) to open the next level.`,
            )}
          </p>
        </div>
      </section>
      <LanguageTabs lang={lang} />
      {due > 0 && (
        <a className="card level-due" href={routeHref({ name: 'level-review', lang })}>
          <strong>{tr(`${due} từ cần ôn hôm nay`, `${due} words to review today`)}</strong>
          <span className="muted">
            {tr('Ôn từ vựng của các bài đã học', 'Review words from finished units')}
          </span>
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
                  <h2>{pick(level.name)}</h2>
                  <p className="muted">
                    {level.exam} · {tr(`${level.words} từ`, `${level.words} words`)}
                  </p>
                </div>
              </div>
              {test !== undefined && (
                <p className="muted">
                  {tr('Bài kiểm tra: ', 'Level test: ')}
                  {pct(test)} {open === 'done' ? tr('· Đã qua', '· Passed') : ''}
                </p>
              )}
              <div className="level-card__actions">
                {open !== 'locked' && (
                  <a className="btn" href={routeHref({ name: 'level', lang, level: level.code })}>
                    {open === 'done' ? tr('Xem lại', 'Review') : tr('Học', 'Learn')}
                  </a>
                )}
                {canTakeTest(levels, progress, i) && open !== 'done' && (
                  <a
                    className="btn btn--ghost"
                    href={routeHref({ name: 'level-test', lang, level: level.code })}
                  >
                    {open === 'locked'
                      ? tr('Kiểm tra để vượt cấp', 'Test out of this level')
                      : tr('Kiểm tra cấp độ', 'Level test')}
                  </a>
                )}
                {open === 'locked' && !canTakeTest(levels, progress, i) && (
                  <span className="muted">
                    {tr('Qua cấp trước để mở', 'Pass the level before to open')}
                  </span>
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
        <EmptyState mascot={null} title={tr('Cấp độ này chưa mở', 'This level isn’t open yet')}>
          <p>
            {tr(
              'Qua bài kiểm tra của cấp trước, hoặc làm bài kiểm tra để vượt cấp.',
              'Pass the previous level’s test, or take a test to skip ahead.',
            )}
          </p>
          <button type="button" className="btn" onClick={() => navigate({ name: 'levels' })}>
            {tr('Về lộ trình', 'Back to levels')}
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
            ? tr(
                'Không tải được bài học. Kiểm tra mạng rồi thử lại.',
                'Could not load the lessons. Check your connection and try again.',
              )
            : tr('Đang tải bài học…', 'Loading lessons…')}
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
        ← {pick(languageName(lang))}
      </a>
      <header>
        <p className="eyebrow">
          {meta.code} · {meta.exam}
        </p>
        <h1>{pick(meta.name)}</h1>
        <ProgressBar
          value={units.length ? done / units.length : 0}
          label={tr('Tiến độ cấp độ', 'Level progress')}
        />
        <p className="muted">
          {tr(`${done}/${units.length} bài đã học`, `${done}/${units.length} units done`)}
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
                    <strong>{pick(unit.title)}</strong>
                    <small className="muted">
                      {tr('Học xong bài trước để mở', 'Finish the unit before to open')}
                    </small>
                  </span>
                </span>
              ) : (
                <a
                  className={`card unit-row is-${s}`}
                  href={routeHref({ name: 'unit', lang, level, unitId: unit.id })}
                >
                  <span className="unit-row__n">{s === 'done' ? '✓' : i + 1}</span>
                  <span>
                    <strong>{pick(unit.title)}</strong>
                    <small className="muted">
                      {tr(
                        `${unit.vocab.length} từ · ${unit.items.length} câu`,
                        `${unit.vocab.length} words · ${unit.items.length} questions`,
                      )}
                      {score !== undefined
                        ? tr(` · đúng ${pct(score)}`, ` · ${pct(score)} correct`)
                        : ''}
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
          {tr(`Làm bài kiểm tra ${meta.code}`, `Take the ${meta.code} test`)}
        </a>
      )}
    </div>
  );
}
