/** Luyện tập: fix mistakes, quick mix, pronunciation drills and the sound chart. */
import { useMemo, useState } from 'react';
import { navigate, type PracticeKind } from '../app/router';
import { Icon } from '../components/Icon';
import { BackLink, Bar, Empty, Loading, SpeakButton, useAsync, useToday } from '../components/ui';
import type { Exercise } from '../features/exercises';
import { errorLabel, type ErrorCategory } from '../features/exercises/explain';
import { cardExercise } from '../features/exercises/review';
import { dueCards } from '../features/flashcards-srs/srs';
import { Player } from '../features/lesson-player/Player';
import { ResultScreen, useAnswerRecorder } from '../features/lesson-player/Result';
import { lessonXp, type SessionSummary } from '../features/lesson-player/session';
import { languageName } from '../features/levels/load';
import { loadPronunciation, markStress, soundDrills, sourceLink } from '../features/pronunciation/pronunciation';
import { logActivity, type ActivityKind } from '../features/today/plan';
import { pick, tr } from '../i18n/locale';
import { appStore, useAppState } from '../stores/appStore';
import { awardXp, levelProgress } from '../stores/appState';
import { toDayKey } from '../utils/date';
import { createRng, shuffle } from '../utils/random';
import { speak } from '../utils/speech';
import { LangChips } from './TodayPage';

export function PracticePage() {
  const state = useAppState();
  const today = useToday();
  const lang = state.levelLang;
  const p = levelProgress(state, lang);
  const mistakes = Object.keys(p.mistakes).length;
  const due = dueCards(p.cards, today).length;
  const cats = Object.entries(p.mistakeCategories).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)) as [ErrorCategory, number][];
  const maxCat = Math.max(1, ...cats.map(([, n]) => n));
  return (
    <>
      <div className="page__head">
        <div>
          <p className="eyebrow">{tr('Luyện tập', 'Practice')}</p>
          <h1>{tr('Luyện chỗ còn yếu', 'Work on weak spots')}</h1>
          <p>{tr('Câu sai được giữ lại để luyện đến khi đúng. Phát âm luyện bằng giọng đọc của thiết bị.', 'Wrong answers stay here until you get them right. Pronunciation uses your device’s voice.')}</p>
        </div>
      </div>
      <LangChips value={lang} />
      <div className="grid grid--tiles" style={{ marginTop: 16 }}>
        <a className="block block--peach" href="#/practice/mistakes" aria-disabled={!mistakes}>
          <span className="block__arrow"><Icon name="arrow" /></span>
          <span className="block__big">{mistakes}</span>
          <h3>{tr('Sửa lỗi sai', 'Fix mistakes')}</h3>
          <p>{tr('Làm lại các câu bạn từng sai, đúng là xoá khỏi danh sách.', 'Redo questions you got wrong; a right answer clears them.')}</p>
        </a>
        <a className="block block--yellow" href="#/practice/mix">
          <span className="block__arrow"><Icon name="arrow" /></span>
          <span className="block__big">{due}</span>
          <h3>{tr('Luyện nhanh', 'Quick mix')}</h3>
          <p>{tr('Thẻ từ đến hạn và lỗi sai trộn lẫn, khoảng 3 phút.', 'Due cards and mistakes mixed, about 3 minutes.')}</p>
        </a>
        <a className="block block--green" href="#/practice/sounds">
          <span className="block__arrow"><Icon name="arrow" /></span>
          <Icon name="listening" size="lg" />
          <h3>{tr('Luyện phát âm', 'Pronunciation drills')}</h3>
          <p>{lang === 'zh' ? tr('Cặp âm dễ nhầm và 4 thanh điệu.', 'Confusable sounds and the four tones.') : tr('Cặp âm dễ nhầm và trọng âm.', 'Minimal pairs and word stress.')}</p>
        </a>
        <a className="block block--lilac" href="#/sounds">
          <span className="block__arrow"><Icon name="arrow" /></span>
          <Icon name="speaking" size="lg" />
          <h3>{tr('Bảng âm', 'Sound chart')}</h3>
          <p>{tr('Từng âm với ví dụ và mẹo cho người Việt.', 'Every sound with examples and tips for Vietnamese speakers.')}</p>
        </a>
      </div>
      <section className="card" style={{ marginTop: 16 }}>
        <h2><Icon name="progress" /> {tr('Loại lỗi hay gặp', 'Your mistake types')}</h2>
        {cats.length ? (
          <div className="stack">
            {cats.slice(0, 6).map(([c, n]) => (
              <div key={c}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="small">{errorLabel(c)}</span>
                  <span className="small muted">{n}</span>
                </div>
                <Bar value={n / maxCat} warm />
              </div>
            ))}
          </div>
        ) : (
          <p className="small muted">{tr('Chưa có lỗi nào được ghi lại.', 'No mistakes recorded yet.')}</p>
        )}
      </section>
    </>
  );
}

const ACTIVITY: Record<PracticeKind, ActivityKind> = { mistakes: 'mistakes', mix: 'review', sounds: 'sounds' };

export function PracticeSessionPage({ kind }: { kind: PracticeKind }) {
  const state = useAppState();
  const lang = state.levelLang;
  const { onAnswer, onCantListen } = useAnswerRecorder(lang);
  const pron = useAsync(() => (kind === 'sounds' ? loadPronunciation(lang) : Promise.resolve(null)), `${kind}/${lang}`);
  const [result, setResult] = useState<{ summary: SessionSummary; xp: number } | null>(null);
  const [seed] = useState(() => Date.now() >>> 0);

  const exercises = useMemo((): Exercise[] | null => {
    const p = levelProgress(appStore.getState(), lang);
    const rng = createRng(seed);
    if (kind === 'mistakes') return shuffle(Object.values(p.mistakes), rng).slice(0, 15);
    if (kind === 'mix') {
      const cards = Object.values(p.cards);
      const due = dueCards(p.cards, toDayKey(new Date()));
      const pool = (due.length >= 4 ? due : shuffle(cards, rng)).slice(0, 10);
      const fromCards = pool.map((c, i) => cardExercise(c, cards, lang, 'vi', seed + i)).filter((e): e is NonNullable<typeof e> => !!e);
      return shuffle([...fromCards, ...shuffle(Object.values(p.mistakes), rng).slice(0, 5)], rng);
    }
    return pron.status === 'ready' && pron.data ? soundDrills(pron.data, seed) : null;
  }, [kind, lang, seed, pron]);

  if (exercises === null) return <Loading />;
  if (!exercises.length)
    return (
      <>
        <BackLink to="#/practice">{tr('Luyện tập', 'Practice')}</BackLink>
        <Empty icon="goals" title={kind === 'mistakes' ? tr('Không có lỗi nào để sửa', 'No mistakes to fix') : tr('Chưa có gì để luyện', 'Nothing to practise yet')}>
          {tr('Học vài bài trên lộ trình, từ và câu sai sẽ xuất hiện ở đây.', 'Study a few units on your path; words and mistakes will show up here.')}
        </Empty>
      </>
    );
  if (result)
    return <ResultScreen title={tr('Xong phần luyện!', 'Practice done!')} summary={result.summary} xp={result.xp} soundOn={state.soundOn} onContinue={() => navigate('#/practice')} />;
  return (
    <Player
      exercises={exercises}
      lang={lang}
      mode="practice"
      soundOn={state.soundOn}
      onAnswer={kind === 'sounds' ? undefined : onAnswer}
      onCantListen={onCantListen}
      onQuit={() => navigate('#/practice')}
      onComplete={(summary) => {
        const xp = lessonXp(summary);
        appStore.update((s) => awardXp(s, xp, toDayKey(new Date())));
        logActivity(ACTIVITY[kind]);
        setResult({ summary, xp });
      }}
    />
  );
}

export function SoundsPage() {
  const state = useAppState();
  const lang = state.levelLang;
  const pron = useAsync(() => loadPronunciation(lang), lang);
  return (
    <>
      <BackLink to="#/practice">{tr('Luyện tập', 'Practice')}</BackLink>
      <div className="page__head">
        <div>
          <p className="eyebrow">{pick(languageName(lang))}</p>
          <h1>{tr('Bảng âm', 'Sound chart')}</h1>
          <p>{tr('Chạm vào một âm để nghe ví dụ.', 'Tap a sound to hear the examples.')}</p>
        </div>
        <a className="btn" href="#/practice/sounds"><Icon name="play" /> {tr('Luyện ngay', 'Drill now')}</a>
      </div>
      <LangChips value={lang} />
      {pron.status !== 'ready' ? (
        <div style={{ marginTop: 16 }}><Loading /></div>
      ) : (
        <div className="stack" style={{ marginTop: 16 }}>
          {pron.data.chart.map((g) => (
            <section key={g.title[1]} className="card">
              <h2>{pick(g.title)}</h2>
              <div className="sound-grid">
                {g.rows.map((r) => (
                  <button key={r.symbol} type="button" className="sound" onClick={() => speakExamples(r.examples, lang)}>
                    <b className="zh">{r.symbol}</b>
                    <span>
                      <span lang={lang}>{r.examples}</span>
                      <small>{pick(r.tip)}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <section className="card">
            <h2>{tr('Cặp âm dễ nhầm', 'Minimal pairs')} <small>{pron.data.pairs.length}</small></h2>
            <div className="sound-grid">
              {pron.data.pairs.map((p) => (
                <div key={`${p.a}-${p.b}`} className="list-row">
                  <span>
                    <b lang={lang}>{p.a}</b> · <b lang={lang}>{p.b}</b>
                    <small className="faint" style={{ display: 'block' }}>{p.contrast}</small>
                  </span>
                  <span className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
                    <SpeakButton text={p.a} lang={lang} />
                    <SpeakButton text={p.b} lang={lang} />
                  </span>
                </div>
              ))}
            </div>
          </section>
          {pron.data.stress.length > 0 && (
            <section className="card">
              <h2>{tr('Trọng âm', 'Word stress')}</h2>
              <div className="sound-grid">
                {pron.data.stress.map((w) => (
                  <div key={w.word} className="list-row">
                    <span><b lang={lang}>{w.word}</b> <span className="muted small">{markStress(w)}</span></span>
                    <SpeakButton text={w.word} lang={lang} />
                  </div>
                ))}
              </div>
            </section>
          )}
          {pron.data.tones.length > 0 && (
            <section className="card">
              <h2>{tr('Bốn thanh điệu', 'The four tones')}</h2>
              <div className="sound-grid">
                {pron.data.tones.map((t) => (
                  <div key={t.syllable} className="list-row" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="row" style={{ gap: 6 }}>
                      {t.hanzi.map((h, i) => (
                        <button key={h} type="button" className="chip zh" onClick={() => speakExamples(h, 'zh')}>
                          {h} {t.pinyin[i]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="card">
            <h2>{tr('Nghe thêm ở từ điển', 'Hear more in a dictionary')}</h2>
            <div className="list">
              {pron.data.sources.map((s) => (
                <a key={s.name} className="list-row" href={sourceLink(s, lang === 'zh' ? '你好' : lang === 'es' ? 'hola' : 'hello')} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <span><b>{s.name}</b><small className="muted" style={{ display: 'block' }}>{pick(s.about)}</small></span>
                  <Icon name="arrow" size="sm" />
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function speakExamples(examples: string, lang: 'en' | 'es' | 'zh') {
  // "ship, sit, gym" → read the first two examples; Chinese examples keep only the characters.
  const words = examples.split(/[,，;]/).slice(0, 2).map((w) => (lang === 'zh' ? w.replace(/[^㐀-鿿]/g, '') : w.trim()));
  speak(words.filter(Boolean).join(', '), lang);
}
