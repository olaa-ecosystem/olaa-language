/** Thẻ từ: spaced-repetition review, the glossary search and the learner's deck. */
import { useMemo, useState } from 'react';
import { navigate } from '../app/router';
import { Icon } from '../components/Icon';
import { Bar, Empty, Loading, SpeakButton, useToday } from '../components/ui';
import { Layer } from '../components/Layer';
import { BOX_INTERVAL_DAYS, dueCards, masteredCount, MAX_BOX, type ReviewGrade, type SrsCard } from '../features/flashcards-srs/srs';
import { meaningOf, useGlossary, WordActions } from '../features/glossary/GlossText';
import { searchGlossary } from '../features/glossary/glossary';
import { languageName } from '../features/levels/load';
import { logActivity } from '../features/today/plan';
import { formatNumber, pick, tr } from '../i18n/locale';
import { appStore, useAppState } from '../stores/appStore';
import { applyLevelCardReview, awardXp, levelProgress } from '../stores/appState';
import { toDayKey } from '../utils/date';
import { playFeedback } from '../utils/sound';
import { LangChips } from './TodayPage';

export function WordsPage() {
  const state = useAppState();
  const today = useToday();
  const lang = state.levelLang;
  const p = levelProgress(state, lang);
  const cards = Object.values(p.cards);
  const due = dueCards(p.cards, today);
  const glossary = useGlossary(lang);
  const [query, setQuery] = useState('');
  const results = useMemo(() => (glossary.status === 'ready' ? searchGlossary(glossary.data, query, 20) : []), [glossary, query]);
  const byBox = Array.from({ length: MAX_BOX + 1 }, (_, b) => cards.filter((c) => c.box === b).length);
  return (
    <>
      <div className="page__head">
        <div>
          <p className="eyebrow">{tr('Thẻ từ', 'Words')}</p>
          <h1>{pick(languageName(lang))}</h1>
          <p>{tr('Thẻ đến hạn được ôn theo lịch lặp lại ngắt quãng. Tra bất kỳ từ nào trong kho từ của khoá học và thêm vào thẻ.', 'Due cards follow a spaced-repetition schedule. Look up any word in the course glossary and add it as a card.')}</p>
        </div>
      </div>
      <LangChips value={lang} />
      <div className="grid grid--today" style={{ marginTop: 16 }}>
        <div className="stack">
          <a className={`block ${due.length ? 'block--yellow' : 'block--green'}`} href={due.length ? '#/words/review' : undefined} aria-disabled={!due.length}>
            {due.length > 0 && <span className="block__arrow"><Icon name="arrow" /></span>}
            <span className="block__big">{due.length}</span>
            <h3>{due.length ? tr('thẻ cần ôn hôm nay', 'cards due today') : tr('Không còn thẻ đến hạn', 'Nothing due right now')}</h3>
            <div className="block__foot">
              <span className="tag">{tr(`${formatNumber(cards.length)} thẻ`, `${formatNumber(cards.length)} cards`)}</span>
              <span className="tag">{tr(`${masteredCount(p.cards)} đã nhớ chắc`, `${masteredCount(p.cards)} mastered`)}</span>
            </div>
          </a>
          <section className="card">
            <h2><Icon name="progress" /> {tr('Hộp ôn tập', 'Review boxes')}</h2>
            <div className="bars" aria-label={tr('Số thẻ trong mỗi hộp', 'Cards per box')}>
              {byBox.map((n, b) => (
                <div key={b} className="bars__col" data-goal={b >= 3}>
                  <span className="tiny">{n}</span>
                  <i style={{ height: `${(n / Math.max(1, ...byBox)) * 100}%` }} />
                  <span>{BOX_INTERVAL_DAYS[b]}{tr('n', 'd')}</span>
                </div>
              ))}
            </div>
            <p className="tiny muted" style={{ marginTop: 8 }}>{tr('Mỗi hộp chờ lâu hơn trước khi thẻ quay lại: 0, 1, 3, 7, 14, 30 ngày.', 'Each box waits longer before a card returns: 0, 1, 3, 7, 14, 30 days.')}</p>
          </section>
        </div>
        <section className="card">
          <h2><Icon name="search" /> {tr('Tra từ', 'Look up')} {glossary.status === 'ready' && <small>{formatNumber(glossary.data.entries.length)} {tr('mục', 'entries')}</small>}</h2>
          <label className="search">
            <Icon name="search" size="sm" />
            <span className="sr-only">{tr('Tìm từ', 'Search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'zh' ? tr('汉字, pinyin hoặc nghĩa tiếng Việt', '汉字, pinyin or meaning') : tr('Từ hoặc nghĩa tiếng Việt', 'Word or meaning')}
              lang={lang}
            />
          </label>
          <div className="list" style={{ marginTop: 12 }}>
            {glossary.status === 'loading' && <Loading />}
            {query.trim() && glossary.status === 'ready' && !results.length && <p className="small muted">{tr('Không tìm thấy.', 'No match.')}</p>}
            {results.map((e) => (
              <div key={`${e.unitId}:${e.word}`} className="note-item">
                <div>
                  <b lang={lang}>{e.word}</b> <span className="small muted">{e.sound}</span> {/^(?:[abc][12]|h\d)-\d+$/.test(e.unitId) && <span className="tag" style={{ marginLeft: 4 }}>{e.unitId.toUpperCase()}</span>}
                </div>
                <p>{meaningOf(e)}</p>
                <WordActions lang={lang} entry={e} />
              </div>
            ))}
            {!query.trim() && (
              <p className="small muted">
                {tr('Gõ để tìm, ví dụ: ', 'Type to search, e.g. ')}
                {lang === 'zh' ? '学习, xuexi, học' : lang === 'es' ? 'hola, gracias, nhà' : 'teacher, weather, nhà'}
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export function ReviewPage() {
  const state = useAppState();
  const lang = state.levelLang;
  const [queue] = useState<SrsCard[]>(() => dueCards(levelProgress(appStore.getState(), lang).cards, toDayKey(new Date())).slice(0, 30));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState({ again: 0, good: 0, easy: 0 });
  const card = queue[i];

  const grade = (g: ReviewGrade) => {
    if (!card) return;
    const today = toDayKey(new Date());
    appStore.update((s) => applyLevelCardReview(s, lang, card.id, g, today));
    if (state.soundOn) playFeedback(g === 'again' ? 'wrong' : 'correct');
    setCounts({ ...counts, [g]: counts[g] + 1 });
    setFlipped(false);
    if (i + 1 >= queue.length) {
      appStore.update((s) => awardXp(s, Math.min(10, queue.length), today));
      logActivity('review');
    }
    setI(i + 1);
  };

  if (!queue.length)
    return (
      <Layer><div className="player" style={{ gridTemplateRows: 'auto 1fr' }}>
        <div className="player__top"><button type="button" className="iconbtn" aria-label={tr('Đóng', 'Close')} onClick={() => navigate('#/words')}><Icon name="close" /></button></div>
        <Empty icon="vocabulary" title={tr('Không còn thẻ đến hạn', 'Nothing due')} />
      </div></Layer>
    );

  return (
    <Layer>
      <div className="player" style={{ gridTemplateRows: 'auto 1fr auto' }}>
        <div className="player__top">
          <button type="button" className="iconbtn" aria-label={tr('Đóng', 'Close')} onClick={() => navigate('#/words')}>
            <Icon name="close" />
          </button>
          <Bar value={i / queue.length} />
          <span className="small muted">{Math.min(i + 1, queue.length)}/{queue.length}</span>
        </div>
        {card ? (
          <div className="player__body flash" key={card.id}>
            <div
              className="flash__card"
              data-flipped={flipped}
              role="button"
              tabIndex={0}
              aria-label={flipped ? card.back : tr(`${card.front}. Chạm để lật`, `${card.front}. Tap to flip`)}
              onClick={() => setFlipped(!flipped)}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), setFlipped(!flipped))}
            >
              <div className="flash__face flash__face--front">
                <span className="flash__word" lang={lang}>{card.front}</span>
                <span className="small" style={{ opacity: 0.7 }}>{tr('Nhớ nghĩa rồi chạm để lật', 'Recall it, then tap to flip')}</span>
              </div>
              <div className="flash__face flash__face--back">
                <span className="flash__word" style={{ fontSize: 26 }}>{card.back}</span>
                <span className="small" lang={lang} style={{ opacity: 0.7 }}>{card.front}</span>
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
              <SpeakButton text={card.front} lang={lang} />
            </div>
          </div>
        ) : (
          <div className="done-screen">
            <div className="card">
              <div className="burst"><Icon name="achievement" /></div>
              <h1>{tr('Ôn xong!', 'All reviewed!')}</h1>
              <p className="muted" style={{ marginTop: 8 }}>
                {tr(`Nhớ ${counts.good + counts.easy}, chưa nhớ ${counts.again}. Thẻ chưa nhớ sẽ quay lại hôm nay.`, `${counts.good + counts.easy} remembered, ${counts.again} to relearn. Those come back today.`)}
              </p>
              <button type="button" className="btn btn--block" style={{ marginTop: 16 }} onClick={() => navigate('#/words')}>{tr('Xong', 'Done')}</button>
            </div>
          </div>
        )}
        {card && (
          <div className="feedback">
            {!flipped ? (
              <button type="button" className="btn btn--block" onClick={() => setFlipped(true)}>{tr('Xem đáp án', 'Show answer')}</button>
            ) : (
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={() => grade('again')}>{tr('Chưa nhớ', 'Again')}</button>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => grade('good')}>{tr('Nhớ', 'Good')}</button>
                <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={() => grade('easy')}>{tr('Dễ', 'Easy')}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layer>
  );
}
