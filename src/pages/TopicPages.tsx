/** Chủ đề: the 15 real-life topics (imported from "Bài tập 15 chủ đề") in the chosen language. */
import { useMemo, useState } from 'react';
import { href, navigate } from '../app/router';
import { Icon } from '../components/Icon';
import { BackLink, Empty, Loading, SpeakButton, toast } from '../components/ui';
import { Player } from '../features/lesson-player/Player';
import { ResultScreen, useAnswerRecorder } from '../features/lesson-player/Result';
import { lessonXp, type SessionSummary } from '../features/lesson-player/session';
import type { CurriculumLang } from '../features/levels/types';
import { addNote, defaultTags, hasNote, notesStore } from '../features/notes/notes';
import { topicLevelCode } from '../features/syllabus/syllabus';
import { logActivity } from '../features/today/plan';
import { meaningOf, phraseIn, skillName, studyTime, topicExercises } from '../features/topics/topics';
import type { Topic, TopicPhrase } from '../features/topics/types';
import { tr } from '../i18n/locale';
import { appStore, useAppState } from '../stores/appStore';
import { addWordCard, awardXp, levelProgress } from '../stores/appState';
import { toDayKey } from '../utils/date';
import { useTopics } from './hooks';
import { LangChips } from './TodayPage';

const BLOCKS = ['green', 'yellow', 'peach', 'lilac'] as const;

export function TopicsPage() {
  const state = useAppState();
  const lang = state.levelLang;
  const topics = useTopics();
  return (
    <>
      <div className="page__head">
        <div>
          <p className="eyebrow">{tr('Chủ đề đời sống', 'Real-life topics')}</p>
          <h1>{tr('15 chủ đề', '15 topics')}</h1>
          <p>
            {tr(
              'Từ, mẫu câu, ngữ pháp và bài nói cho các tình huống thật. Mỗi chủ đề cũng nằm trong lộ trình, ở cấp độ phù hợp.',
              'Words, phrases, grammar and speaking for real situations. Each topic also sits in your path at the right level.',
            )}
          </p>
        </div>
      </div>
      <LangChips value={lang} />
      <div style={{ marginTop: 16 }}>
        {topics.status === 'ready' ? (
          <div className="grid grid--tiles">
            {topics.data.map((t, i) => (
              <a key={t.id} className={`block block--${BLOCKS[i % BLOCKS.length]}`} href={href({ name: 'topic', topicId: t.id })}>
                <span className="block__arrow"><Icon name="arrow" /></span>
                <span className="tiny" style={{ fontWeight: 650, opacity: 0.7 }}>{String(i + 1).padStart(2, '0')}</span>
                <h3>{t.title}</h3>
                <p>{t.vocab.slice(0, 4).map((v) => phraseIn(v, lang)).join(' · ')}</p>
                <div className="block__foot">
                  <span className="tag zh">{topicLevelCode(t, lang)}</span>
                  <span className="tag">{studyTime(t.hours)}</span>
                </div>
              </a>
            ))}
          </div>
        ) : topics.status === 'error' ? (
          <Empty title={tr('Không tải được chủ đề.', 'Could not load topics.')} />
        ) : (
          <Loading />
        )}
      </div>
    </>
  );
}

function PhraseRow({ p, lang, onCard, inDeck }: { p: TopicPhrase; lang: CurriculumLang; onCard?: () => void; inDeck?: boolean }) {
  return (
    <div className="word">
      <SpeakButton text={phraseIn(p, lang)} lang={lang} />
      <div>
        <b lang={lang}>{phraseIn(p, lang)}</b> {lang === 'zh' && <span className="snd">{p.zh.pinyin}</span>}
        <span className="mean">{meaningOf(p, lang)}</span>
      </div>
      {onCard && (
        <button type="button" className="iconbtn" disabled={inDeck} aria-label={inDeck ? tr('Đã có thẻ', 'In your cards') : tr('Thêm thẻ từ', 'Add card')} title={inDeck ? tr('Đã có thẻ', 'In your cards') : tr('Thêm thẻ từ', 'Add card')} onClick={onCard}>
          <Icon name={inDeck ? 'check' : 'plus'} />
        </button>
      )}
    </div>
  );
}

export function TopicPage({ topicId }: { topicId: string }) {
  const state = useAppState();
  const lang = state.levelLang;
  const topics = useTopics();
  const notes = notesStore.use();
  if (topics.status === 'error') return <Empty title={tr('Không tải được chủ đề.', 'Could not load topics.')} />;
  if (topics.status !== 'ready') return <Loading />;
  const topic = topics.data.find((t) => t.id === topicId);
  if (!topic) return <Empty title={tr('Không có chủ đề này', 'No such topic')} />;
  const cards = levelProgress(state, lang).cards;
  const fronts = new Set(Object.values(cards).map((c) => c.front.trim().toLowerCase()));
  const addCard = (p: TopicPhrase, i: number) => {
    appStore.update((s) =>
      addWordCard(s, lang, { id: `topic:${topic.id}:${lang}:${i}`, front: phraseIn(p, lang), back: lang === 'zh' ? `${meaningOf(p, lang)} · ${p.zh.pinyin}` : meaningOf(p, lang), lessonId: topic.id }, toDayKey(new Date())),
    );
    toast(tr('Đã thêm vào thẻ từ', 'Added to your cards'));
  };
  const ref = `${lang}/${topic.id}`;
  const grammarSaved = hasNote(notes, ref, topic.title);
  return (
    <>
      <BackLink to="#/topics">{tr('Chủ đề', 'Topics')}</BackLink>
      <div className="page__head">
        <div>
          <p className="eyebrow">
            {topicLevelCode(topic, lang)} · {studyTime(topic.hours)}
          </p>
          <h1>{topic.title}</h1>
        </div>
        <a className="btn" href={href({ name: 'topic-practice', topicId: topic.id, lang })}>
          <Icon name="play" /> {tr('Luyện tập chủ đề này', 'Practise this topic')}
        </a>
      </div>
      <LangChips value={lang} />
      <div className="grid grid--today" style={{ marginTop: 16 }}>
        <div className="stack">
          <section className="card">
            <h2><Icon name="vocabulary" /> {tr('Từ vựng', 'Words')} <small>{topic.vocab.length}</small></h2>
            <div className="vocab">
              {topic.vocab.map((p, i) => (
                <PhraseRow key={i} p={p} lang={lang} onCard={() => addCard(p, i)} inDeck={fronts.has(phraseIn(p, lang).trim().toLowerCase())} />
              ))}
            </div>
          </section>
          <section className="card">
            <h2><Icon name="speaking" /> {tr('Mẫu câu', 'Phrases')}</h2>
            <div className="list">
              {topic.sentences.map((p, i) => <PhraseRow key={i} p={p} lang={lang} />)}
            </div>
          </section>
        </div>
        <div className="stack">
          <section className="card">
            <h2><Icon name="lessons" /> {tr('Ngữ pháp & phát âm', 'Grammar & sounds')}</h2>
            <p><b>{tr('Ngữ pháp: ', 'Grammar: ')}</b>{topic.grammar[lang]}</p>
            <p style={{ marginTop: 8 }}><b>{tr('Phát âm: ', 'Pronunciation: ')}</b>{topic.pronunciation[lang]}</p>
            {lang === 'zh' && topic.hanzi.length > 0 && (
              <ul className="small muted" style={{ marginTop: 8, paddingLeft: 18 }}>
                {topic.hanzi.map((h) => <li key={h}>{h}</li>)}
              </ul>
            )}
            <button
              type="button"
              className="btn btn--text btn--sm"
              style={{ paddingLeft: 0, marginTop: 6 }}
              disabled={grammarSaved}
              onClick={() => {
                notesStore.set((n) =>
                  addNote(n, { lang, source: { kind: 'topic', ref, title: topic.title }, title: topic.title, body: `${tr('Ngữ pháp', 'Grammar')}: ${topic.grammar[lang]}\n${tr('Phát âm', 'Pronunciation')}: ${topic.pronunciation[lang]}\n\n${topic.sentences.map((s) => `${phraseIn(s, lang)} — ${meaningOf(s, lang)}`).join('\n')}`, tags: defaultTags(lang, 'topic') }, Date.now()),
                );
                toast(tr('Đã lưu vào ghi chú', 'Saved to your notes'));
              }}
            >
              <Icon name="note" size="sm" /> {grammarSaved ? tr('Đã lưu ghi chú', 'Saved to notes') : tr('Lưu chủ đề vào ghi chú', 'Save topic to notes')}
            </button>
          </section>
          <section className="card">
            <h2><Icon name="goals" /> {tr('Bài luyện kỹ năng', 'Skill tasks')}</h2>
            <div className="hlist">
              {topic.skills.map((s, i) => (
                <div key={i} className="hab" style={{ alignItems: 'flex-start' }}>
                  <span className="tag tag--accent" style={{ marginTop: 2 }}>{skillName(s.skill)}</span>
                  <span className="hn">
                    {s.task}
                    <small>{tr(`${s.minutes} phút`, `${s.minutes} min`)}</small>
                  </span>
                </div>
              ))}
              {[
                [tr('Viết', 'Writing'), topic.writing],
                [tr('Chép chính tả', 'Dictation'), topic.dictation],
                [tr('Thử thách', 'Challenge'), topic.challenge],
              ].map(([k, v]) => (
                <div key={k} className="hab" style={{ alignItems: 'flex-start' }}>
                  <span className="tag" style={{ marginTop: 2 }}>{k}</span>
                  <span className="hn">{v}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="card">
            <h2><Icon name="speaking" /> {tr('Câu hỏi nói', 'Speaking questions')}</h2>
            <div className="list">
              {topic.speaking.map((q, i) => (
                <div key={i} className="list-row">
                  <span lang={lang}>{q[lang]}</span>
                  <SpeakButton text={q[lang]} lang={lang} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export function TopicPracticePage({ topicId, lang }: { topicId: string; lang: CurriculumLang }) {
  const state = useAppState();
  const topics = useTopics();
  const { onAnswer } = useAnswerRecorder(lang);
  const [result, setResult] = useState<{ summary: SessionSummary; xp: number } | null>(null);
  const topic: Topic | undefined = topics.status === 'ready' ? topics.data.find((t) => t.id === topicId) : undefined;
  const exercises = useMemo(() => (topic ? topicExercises(topic, lang, Date.now() >>> 0) : []), [topic, lang]);
  const back = href({ name: 'topic', topicId });
  if (topics.status === 'loading') return <Loading />;
  if (!topic || !exercises.length) return <Empty title={tr('Không có bài luyện', 'No practice here')} />;
  if (result)
    return (
      <ResultScreen title={tr('Xong chủ đề!', 'Topic done!')} summary={result.summary} xp={result.xp} soundOn={state.soundOn} onContinue={() => navigate(back)} />
    );
  return (
    <Player
      exercises={exercises}
      lang={lang}
      mode="practice"
      soundOn={state.soundOn}
      onAnswer={onAnswer}
      onQuit={() => navigate(back)}
      onComplete={(summary) => {
        const xp = lessonXp(summary);
        appStore.update((s) => awardXp(s, xp, toDayKey(new Date())));
        logActivity('topic');
        setResult({ summary, xp });
      }}
    />
  );
}
