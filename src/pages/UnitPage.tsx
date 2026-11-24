/**
 * One unit in the PRD v1.0 §6.2 lesson shape: Learn (rule in Vietnamese, table, new words with
 * audio, pinyin and Hán Việt) → Practice (the unit's questions with earlier mistakes and due
 * cards mixed in) → Read & listen (passage with tap-to-translate) → recap. Challenge is optional.
 */
import { useCallback, useMemo, useState } from 'react';
import { href, navigate } from '../app/router';
import { Icon } from '../components/Icon';
import { BackLink, Empty, Loading, RichText, SpeakButton, toast, useAsync, useToday } from '../components/ui';
import { cardExercise, interleaveReview } from '../features/exercises/review';
import type { Exercise } from '../features/exercises';
import { dueCards } from '../features/flashcards-srs/srs';
import { GlossText } from '../features/glossary/GlossText';
import { Player } from '../features/lesson-player/Player';
import { ResultScreen, useAnswerRecorder } from '../features/lesson-player/Result';
import { clearSession, loadSession, saveSession } from '../features/lesson-player/resume';
import { lessonXp, type SessionState, type SessionSummary } from '../features/lesson-player/session';
import { hanVietOf, levelsOf, loadHanViet } from '../features/levels/load';
import { unitExercises } from '../features/levels/toExercises';
import type { CurriculumLang, LevelUnit } from '../features/levels/types';
import { levelState, unitStates } from '../features/levels/unlock';
import { addNote, defaultTags, hasNote, notesFor, notesStore } from '../features/notes/notes';
import { unitSteps } from '../features/syllabus/syllabus';
import { logActivity } from '../features/today/plan';
import { pick, tr } from '../i18n/locale';
import { appStore, useAppState } from '../stores/appStore';
import { awardXp, finishUnit, levelProgress } from '../stores/appState';
import { toDayKey } from '../utils/date';
import { useLevelUnits } from './hooks';

const LISTENING_KINDS = new Set(['dictation']);

export function UnitPage({ lang, level, unitId, challenge }: { lang: CurriculumLang; level: string; unitId: string; challenge: boolean }) {
  const state = useAppState();
  const units = useLevelUnits(lang, level);
  const back = <BackLink to={href({ name: 'level', lang, level })}>{level}</BackLink>;
  if (units.status === 'error') return <>{back}<Empty title={tr('Không tải được bài học.', 'Could not load the unit.')} /></>;
  if (units.status !== 'ready') return <>{back}<Loading /></>;
  const list = units.data;
  const unit = list.find((u) => u.id === unitId);
  const levels = levelsOf(lang);
  const progress = levelProgress(state, lang);
  const open = levelState(levels, progress, levels.findIndex((l) => l.code === level)) !== 'locked';
  const st = unit ? unitStates(list.map((u) => u.id), progress, level, open)[unit.id] : 'locked';
  if (!unit || st === 'locked')
    return (
      <>
        {back}
        <Empty icon="lessons" title={tr('Bài này chưa mở', 'This unit isn’t open yet')}>
          {tr('Học xong bài trước trong cấp độ để mở bài này.', 'Finish the unit before it to open this one.')}
        </Empty>
      </>
    );
  const next = list[list.indexOf(unit) + 1] ?? null;
  return <UnitSession key={`${unit.id}:${challenge}`} lang={lang} level={level} unit={unit} next={next} challenge={challenge} />;
}

function UnitSession({ lang, level, unit, next, challenge }: { lang: CurriculumLang; level: string; unit: LevelUnit; next: LevelUnit | null; challenge: boolean }) {
  const state = useAppState();
  const today = useToday();
  const progress = levelProgress(state, lang);
  const sessionKey = `${unit.id}${challenge ? ':challenge' : ''}`;
  const [saved] = useState(() => loadSession(sessionKey, 0, Date.now()));
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>(challenge ? 'play' : 'intro');
  const [resume, setResume] = useState<SessionState | undefined>();
  const [result, setResult] = useState<{ summary: SessionSummary; xp: number } | null>(null);
  const { onAnswer, onCantListen } = useAnswerRecorder(lang);
  const levelHref = href({ name: 'level', lang, level });

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const now = Date.now();
    const base = unitExercises(unit, lang, challenge);
    const p = levelProgress(appStore.getState(), lang);
    const cards = Object.values(p.cards);
    const due = dueCards(p.cards, toDayKey(new Date(now)))
      .filter((c) => c.lessonId !== unit.id)
      .map((c, i) => cardExercise(c, cards, lang, 'vi', now + i))
      .filter((e): e is NonNullable<typeof e> => e !== null);
    const mixed = challenge ? base : interleaveReview(base, { mistakes: Object.values(p.mistakes), dueCards: due, lessonId: unit.id }, now);
    return appStore.getState().listenOffUntil > now ? mixed.filter((e) => !LISTENING_KINDS.has(e.kind)) : mixed;
  });

  const onProgress = useCallback(
    (session: SessionState) => saveSession({ lessonId: sessionKey, level: 0, exercises, session, savedAt: Date.now() }),
    [sessionKey, exercises],
  );
  const onComplete = useCallback(
    (summary: SessionSummary) => {
      clearSession(sessionKey);
      const xp = lessonXp(summary);
      const day = toDayKey(new Date());
      appStore.update((s) => (challenge ? awardXp(s, xp, day) : finishUnit(s, { lang, unit, score: summary.accuracy, xp, today: day })));
      logActivity('unit');
      setResult({ summary, xp });
      setPhase('done');
    },
    [sessionKey, challenge, lang, unit],
  );

  if (phase === 'play')
    return (
      <Player
        exercises={exercises}
        lang={lang}
        mode="lesson"
        soundOn={state.soundOn}
        initialSession={resume}
        onAnswer={onAnswer}
        onProgress={onProgress}
        onComplete={onComplete}
        onCantListen={onCantListen}
        onQuit={() => (challenge ? navigate(levelHref) : setPhase('intro'))}
      />
    );

  if (phase === 'done' && result)
    return (
      <ResultScreen
        title={challenge ? tr('Xong thử thách!', 'Challenge complete!') : tr('Xong bài!', 'Unit complete!')}
        summary={result.summary}
        xp={result.xp}
        soundOn={state.soundOn}
        onContinue={() => navigate(levelHref)}
      >
        {!challenge && (
          <div style={{ textAlign: 'left' }}>
            <p className="small muted">
              {tr(
                `${unit.vocab.length} từ của bài đã vào thẻ từ; chúng quay lại từ ngày mai và trong các bài sau.`,
                `${unit.vocab.length} words from this unit are now flashcards; they come back from tomorrow and inside later units.`,
              )}
            </p>
            <div className="row" style={{ marginTop: 12 }}>
              {unit.challenge.length > 0 && (
                <a className="btn btn--sm btn--ghost" href={href({ name: 'unit', lang, level, unitId: unit.id, challenge: true })}>
                  {tr('Thử thách thêm', 'Extra challenge')}
                </a>
              )}
              {next && (
                <a className="btn btn--sm btn--ghost" href={href({ name: 'unit', lang, level, unitId: next.id, challenge: false })}>
                  {tr('Bài tiếp: ', 'Next: ')}
                  {pick(next.title)}
                </a>
              )}
            </div>
          </div>
        )}
      </ResultScreen>
    );

  return <UnitIntro {...{ lang, level, unit, today, progress, saved, exercises }} onStart={(fromSaved) => {
    if (fromSaved && saved) {
      setExercises(saved.exercises);
      setResume(saved.session);
    } else clearSession(sessionKey);
    setPhase('play');
  }} />;
}

function UnitIntro({
  lang,
  level,
  unit,
  progress,
  saved,
  exercises,
  onStart,
}: {
  lang: CurriculumLang;
  level: string;
  unit: LevelUnit;
  today: string;
  progress: ReturnType<typeof levelProgress>;
  saved: ReturnType<typeof loadSession>;
  exercises: Exercise[];
  onStart: (fromSaved: boolean) => void;
}) {
  const notes = notesStore.use();
  const hanViet = useAsync(() => (lang === 'zh' ? loadHanViet() : Promise.resolve({} as Record<string, string>)), lang);
  const hv = hanViet.status === 'ready' ? hanViet.data : {};
  const [showTr, setShowTr] = useState(false);
  const steps = useMemo(() => unitSteps(unit), [unit]);
  const reviewCount = exercises.filter((e) => e.review).length;
  const done = progress.units[unit.id] !== undefined;
  const ref = `${lang}/${unit.id}`;
  const unitNotes = notesFor(notes, ref);

  const saveRule = (i: number) => {
    const [vi, en] = unit.theory[i]!;
    const title = `${pick(unit.title)} · ${i + 1}`;
    notesStore.set((n) =>
      addNote(n, { lang, source: { kind: 'grammar', ref, title: pick(unit.title) }, title, body: `${vi}${en && en !== vi ? `\n\n${en}` : ''}`.replace(/\*\*/g, ''), tags: defaultTags(lang, 'grammar') }, Date.now()),
    );
    toast(tr('Đã lưu quy tắc vào ghi chú', 'Rule saved to your notes'));
  };

  return (
    <>
      <BackLink to={href({ name: 'level', lang, level })}>{level}</BackLink>
      <div className="page__head">
        <div>
          <p className="eyebrow">{tr(`Bài ${unit.id.split('-')[1] ?? ''} · ${level}`, `Unit ${unit.id.split('-')[1] ?? ''} · ${level}`)}</p>
          <h1>{pick(unit.title)}</h1>
          <div className="steps" style={{ marginTop: 10 }}>
            {steps.map((s, i) => (
              <span key={s.kind} className="step">
                {i + 1}. {tr(...s.label)} · {tr(`${s.minutes} phút`, `${s.minutes} min`)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid--today">
        <div className="stack">
          <section className="card theory">
            <h2><Icon name="lessons" /> {tr('1. Học quy tắc', '1. Learn the rule')}</h2>
            {unit.theory.map((t, i) => (
              <div key={i}>
                <RichText text={pick(t)} />
                <button type="button" className="btn btn--text btn--sm" style={{ paddingLeft: 0 }} disabled={hasNote(notes, ref, `${pick(unit.title)} · ${i + 1}`)} onClick={() => saveRule(i)}>
                  <Icon name="note" size="sm" /> {hasNote(notes, ref, `${pick(unit.title)} · ${i + 1}`) ? tr('Đã lưu ghi chú', 'Saved to notes') : tr('Lưu vào ghi chú', 'Save to notes')}
                </button>
              </div>
            ))}
            {unit.table && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>{unit.table[0]!.map((h, i) => <th key={i}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {unit.table.slice(1).map((row, r) => (
                      <tr key={r}>{row.map((c, i) => <td key={i} lang={i === 0 ? lang : undefined}>{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {unit.passage && (
            <section className="card">
              <h2><Icon name="listening" /> {tr('3. Đọc và nghe', '3. Read and listen')} <small>{tr('Chạm vào từ để xem nghĩa', 'Tap a word for its meaning')}</small></h2>
              <div className="row" style={{ marginBottom: 10 }}>
                <SpeakButton text={unit.passage.text} lang={lang} />
                <SpeakButton text={unit.passage.text} lang={lang} slow />
              </div>
              <p className="passage">
                <GlossText text={unit.passage.text} lang={lang} unitId={unit.id} />
              </p>
              {unit.passage.translation && (
                <>
                  <button type="button" className="btn btn--text" style={{ paddingLeft: 0 }} onClick={() => setShowTr(!showTr)}>
                    {showTr ? tr('Ẩn bản dịch', 'Hide translation') : tr('Xem bản dịch', 'Show translation')}
                  </button>
                  {showTr && <p className="muted">{unit.passage.translation}</p>}
                </>
              )}
            </section>
          )}
        </div>

        <div className="stack">
          <section className="card">
            <h2><Icon name="vocabulary" /> {tr('Từ mới', 'New words')} <small>{unit.vocab.length}</small></h2>
            {unit.hanzi && (
              <div style={{ marginBottom: 12 }}>
                <p className="hanzi-big zh" lang="zh">{unit.hanzi}</p>
                {hanVietOf(unit.hanzi, hv) && <p className="hv">Hán Việt: {hanVietOf(unit.hanzi, hv)}</p>}
              </div>
            )}
            <div className="vocab">
              {unit.vocab.map((w) => (
                <div key={w.word} className="word">
                  <SpeakButton text={w.word} lang={lang} />
                  <div>
                    <b lang={lang}>{w.word}</b> <span className="snd">{w.sound}</span>
                    <span className="mean">{pick([w.vi, w.en])}</span>
                    {lang === 'zh' && hanVietOf(w.word, hv) && <span className="hv">{hanVietOf(w.word, hv)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2><Icon name="goals" /> {tr('2. Luyện tập', '2. Practice')}</h2>
            <p className="muted small" style={{ marginBottom: 14 }}>
              {tr(
                `${exercises.length} câu theo thứ tự: khởi động, luyện, vận dụng${reviewCount ? `; có ${reviewCount} câu ôn từ bài trước` : ''}. Câu sai sẽ quay lại trước khi kết thúc.`,
                `${exercises.length} questions in order: warm-up, practice, use${reviewCount ? `; ${reviewCount} review from earlier units` : ''}. Wrong answers come back before the end.`,
              )}
            </p>
            <div className="stack">
              {saved && (
                <button type="button" className="btn btn--block" onClick={() => onStart(true)}>
                  {tr(`Học tiếp (đã làm ${saved.session.position} câu)`, `Continue (${saved.session.position} answered)`)}
                </button>
              )}
              <button type="button" className={`btn btn--block${saved ? ' btn--ghost' : ''}`} onClick={() => onStart(false)}>
                <Icon name="play" /> {saved ? tr('Làm lại từ đầu', 'Start over') : done ? tr('Luyện lại', 'Practise again') : tr('Bắt đầu luyện tập', 'Start practice')}
              </button>
              {done && unit.challenge.length > 0 && (
                <a className="btn btn--block btn--ghost" href={href({ name: 'unit', lang, level, unitId: unit.id, challenge: true })}>
                  {tr(`4. Thử thách · ${unit.challenge.length} câu`, `4. Challenge · ${unit.challenge.length} questions`)}
                </a>
              )}
            </div>
          </section>

          <section className="card">
            <h2><Icon name="note" /> {tr('Ghi chú của bài này', 'Notes for this unit')} <small>{unitNotes.length}</small></h2>
            {unitNotes.length ? (
              <div className="list">
                {unitNotes.slice(0, 4).map((n) => (
                  <div key={n.id} className="note-item">
                    <b>{n.title}</b>
                    <p>{n.body.slice(0, 160)}{n.body.length > 160 ? '…' : ''}</p>
                  </div>
                ))}
                <a className="btn btn--text btn--sm" href="#/notes">{tr('Tất cả ghi chú', 'All notes')}</a>
              </div>
            ) : (
              <p className="small muted">{tr('Lưu quy tắc ở trên, hoặc chạm vào một từ trong bài đọc để lưu.', 'Save a rule above, or tap a word in the passage to save it.')}</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
