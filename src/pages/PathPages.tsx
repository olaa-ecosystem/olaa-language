/** Lộ trình: levels of the chosen language, then one level as a structured syllabus. */
import manifest from '../../content/manifest.json';
import { href } from '../app/router';
import { Icon } from '../components/Icon';
import { BackLink, Bar, Empty, Loading } from '../components/ui';
import { languageName, levelsOf } from '../features/levels/load';
import { LEVEL_TEST_PASS } from '../features/levels/toExercises';
import type { CurriculumLang } from '../features/levels/types';
import { canTakeTest, levelState, unitStates } from '../features/levels/unlock';
import { buildLevelSyllabus, moduleProgress, weeksToFinish } from '../features/syllabus/syllabus';
import { pick, tr } from '../i18n/locale';
import { useAppState } from '../stores/appStore';
import { levelProgress } from '../stores/appState';
import { useLevelUnits, useTopics } from './hooks';
import { LangChips } from './TodayPage';

const unitCount = (lang: CurriculumLang, code: string): number =>
  (manifest.languages[lang].levels as Record<string, number>)[code] ?? 0;

export function PathPage() {
  const state = useAppState();
  const lang = state.levelLang;
  const progress = levelProgress(state, lang);
  const levels = levelsOf(lang);
  return (
    <>
      <div className="page__head">
        <div>
          <p className="eyebrow">{tr('Lộ trình', 'Path')}</p>
          <h1>{pick(languageName(lang))}</h1>
          <p>
            {tr(
              'Mỗi cấp chia thành các chặng, mỗi bài có 4 bước: học, luyện, đọc–nghe, thử thách. Qua bài kiểm tra cấp (70%) để mở cấp sau, hoặc kiểm tra vượt cấp nếu bạn đã vững.',
              'Each level is split into modules; each unit has 4 steps: learn, practise, read & listen, challenge. Pass the level test (70%) to open the next level, or test out if you already know it.',
            )}
          </p>
        </div>
      </div>
      <LangChips value={lang} />
      <div className="levels" style={{ marginTop: 16 }}>
        {levels.map((level, i) => {
          const st = levelState(levels, progress, i);
          const total = unitCount(lang, level.code);
          const done = Object.keys(progress.units).filter((id) => id.startsWith(level.code.toLowerCase().replace('hsk', 'h') + '-')).length;
          const test = progress.tests[level.code];
          return (
            <div key={level.code} className="card level-row" data-state={st}>
              <span className="level-code zh">{st === 'locked' ? <Icon name="lock" /> : level.code}</span>
              <div>
                <h3>
                  {level.code} · {pick(level.name)}
                </h3>
                <div className="meta">
                  <span className="tag">{level.exam}</span>
                  <span className="tag">{tr(`${level.words} từ`, `${level.words} words`)}</span>
                  <span className="tag">{tr(`${total} bài`, `${total} units`)}</span>
                  {test !== undefined && (
                    <span className={`tag ${test >= LEVEL_TEST_PASS ? 'tag--accent' : 'tag--warm'}`}>
                      {tr('Kiểm tra', 'Test')} {Math.round(test * 100)}%
                    </span>
                  )}
                </div>
                {st !== 'locked' && (
                  <div style={{ marginTop: 10, maxWidth: 360 }}>
                    <Bar value={total ? done / total : 0} label={tr(`${done}/${total} bài`, `${done}/${total} units`)} />
                  </div>
                )}
              </div>
              <div className="stack" style={{ justifyItems: 'end' }}>
                {st !== 'locked' && (
                  <a className="btn btn--sm" href={href({ name: 'level', lang, level: level.code })}>
                    {st === 'done' ? tr('Xem lại', 'Review') : tr('Học', 'Study')}
                  </a>
                )}
                {st !== 'done' && canTakeTest(levels, progress, i) && (
                  <a className="btn btn--sm btn--ghost" href={href({ name: 'test', lang, level: level.code })}>
                    {st === 'locked' ? tr('Kiểm tra vượt cấp', 'Test out') : tr('Kiểm tra', 'Test')}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function LevelPage({ lang, level: code }: { lang: CurriculumLang; level: string }) {
  const state = useAppState();
  const progress = levelProgress(state, lang);
  const levels = levelsOf(lang);
  const index = levels.findIndex((l) => l.code === code);
  const level = levels[index];
  const units = useLevelUnits(lang, code);
  const topics = useTopics();
  if (!level) return <Empty title={tr('Không có cấp độ này', 'No such level')} />;
  const back = <BackLink to="#/path">{pick(languageName(lang))}</BackLink>;
  if (units.status === 'error' || topics.status === 'error')
    return (
      <>
        {back}
        <Empty title={tr('Không tải được bài học. Kiểm tra kết nối rồi thử lại.', 'Could not load the units. Check your connection and try again.')} />
      </>
    );
  if (units.status !== 'ready' || topics.status !== 'ready')
    return (
      <>
        {back}
        <Loading />
      </>
    );
  const open = levelState(levels, progress, index) !== 'locked';
  const syllabus = buildLevelSyllabus(lang, level, units.data, topics.data);
  const states = unitStates(units.data.map((u) => u.id), progress, code, open);
  const topicById = new Map(topics.data.map((t) => [t.id, t]));
  const weeks = weeksToFinish(syllabus, state.dailyGoalXp);
  let n = 0;
  return (
    <>
      {back}
      <div className="page__head">
        <div>
          <p className="eyebrow">{level.exam}</p>
          <h1>
            {level.code} · {pick(level.name)}
          </h1>
          <p>
            {tr(
              `${units.data.length} bài trong ${syllabus.modules.length} chặng, ${syllabus.totalWords} từ mới, khoảng ${Math.round(syllabus.totalMinutes / 60)} giờ học. Với mục tiêu ${state.dailyGoalXp} XP/ngày, 5 ngày/tuần: khoảng ${weeks} tuần.`,
              `${units.data.length} units in ${syllabus.modules.length} modules, ${syllabus.totalWords} new words, about ${Math.round(syllabus.totalMinutes / 60)} hours. At ${state.dailyGoalXp} XP a day, 5 days a week: about ${weeks} weeks.`,
            )}
          </p>
        </div>
      </div>
      {!open && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p>{tr('Cấp này chưa mở. Qua bài kiểm tra cấp trước, hoặc kiểm tra vượt cấp.', 'This level is locked. Pass the previous level’s test, or test out.')}</p>
        </div>
      )}
      {syllabus.modules.map((m) => {
        const mp = moduleProgress(m, progress);
        return (
          <section key={m.id} className="module">
            <div className="module__head">
              <span className="module__num">{m.number}</span>
              <h2>{pick(m.title)}</h2>
              <span className={`tag ${mp.complete ? 'tag--accent' : ''}`}>
                {mp.done}/{mp.total} · {tr(`~${m.minutes} phút`, `~${m.minutes} min`)}
              </span>
            </div>
            <div className="card units" style={{ padding: 8 }}>
              {m.units.map((u) => {
                n += 1;
                const st = states[u.id] ?? 'locked';
                const score = progress.units[u.id];
                const inner = (
                  <>
                    <span className="unit-num">{st === 'done' ? <Icon name="check" size="sm" /> : st === 'locked' ? <Icon name="lock" size="sm" /> : n}</span>
                    <div>
                      <h3>{pick(u.title)}</h3>
                      <div className="steps">
                        {u.steps.map((s) => (
                          <span key={s.kind} className="step">
                            {tr(...s.label)}
                            {s.kind !== 'learn' && s.kind !== 'read' ? ` · ${s.count}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="small muted" style={{ textAlign: 'right' }}>
                      {score !== undefined ? `${Math.round(score * 100)}%` : tr(`${u.minutes} phút`, `${u.minutes} min`)}
                      <br />
                      <span className="tiny">{tr(`${u.newWords} từ`, `${u.newWords} words`)}</span>
                    </span>
                  </>
                );
                return st === 'locked' ? (
                  <div key={u.id} className="unit-row" data-state={st} aria-disabled="true">{inner}</div>
                ) : (
                  <a key={u.id} className="unit-row" data-state={st} href={href({ name: 'unit', lang, level: code, unitId: u.id, challenge: false })}>
                    {inner}
                  </a>
                );
              })}
              {m.topicIds.map((id) => {
                const t = topicById.get(id);
                return t ? (
                  <a key={id} className="topic-slot" href={href({ name: 'topic', topicId: id })}>
                    <span className="icon"><Icon name="collections" /></span>
                    <span style={{ flex: 1 }}>
                      <span className="tiny" style={{ fontWeight: 650, opacity: 0.7 }}>{tr('Chủ đề đời sống', 'Real-life topic')}</span>
                      <br />
                      <b>{t.title}</b>
                    </span>
                    <Icon name="next" size="sm" />
                  </a>
                ) : null;
              })}
            </div>
          </section>
        );
      })}
      <section className="module">
        <div className="checkpoint">
          <Icon name="achievement" />
          <div style={{ flex: 1 }}>
            <b>{tr('Bài kiểm tra cấp độ', 'Level test')}</b>
            <p className="small">{tr('20 câu từ mọi bài của cấp, đạt 70% để mở cấp sau.', '20 questions across the level; 70% opens the next level.')}</p>
          </div>
          {canTakeTest(levels, progress, index) && (
            <a className="btn btn--sm" href={href({ name: 'test', lang, level: code })}>
              {tr('Làm bài', 'Start')}
            </a>
          )}
        </div>
      </section>
    </>
  );
}
