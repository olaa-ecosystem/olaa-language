/** 15 themed topics: vocabulary, model sentences, grammar and pronunciation notes, and tasks. */
import { useEffect, useState } from 'react';
import { navigate, routeHref } from '../../app/router';
import { appStore, useAppState } from '../../stores/appStore';
import { setLevelLang } from '../../stores/appState';
import { speak } from '../../utils/speech';
import { LessonPlayer } from '../lesson-player/LessonPlayer';
import { SessionComplete } from '../lesson-player/ResultScreens';
import { lessonXp, type SessionSummary } from '../lesson-player/session';
import { awardXp } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { LanguageTabs } from '../levels/LevelsPage';
import type { CurriculumLang } from '../levels/types';
import type { Loaded } from '../levels/useLevel';
import { loadTopics, meaningOf, phraseIn, skillName, studyTime, topicExercises } from './topics';
import type { Topic } from './types';
import { tr } from '../../i18n/locale';

function useTopics(): Loaded<Topic[]> {
  const [state, setState] = useState<Loaded<Topic[]>>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    loadTopics().then(
      (data) => live && setState({ status: 'ready', data }),
      () => live && setState({ status: 'error' }),
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}

function Waiting({ loaded }: { loaded: Loaded<unknown> }) {
  return (
    <div className="page page--center">
      <p className="muted" role="status">
        {loaded.status === 'error'
          ? tr('Không tải được chủ đề.', 'Could not load the topics.')
          : tr('Đang tải…', 'Loading…')}
      </p>
    </div>
  );
}

export function TopicsPage() {
  const loaded = useTopics();
  if (loaded.status !== 'ready') return <Waiting loaded={loaded} />;
  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <h1>{tr('15 chủ đề giao tiếp', '15 conversation topics')}</h1>
          <p>
            {tr(
              'Mỗi chủ đề có từ vựng, mẫu câu và bài tập cho cả ba ngôn ngữ.',
              'Each topic has vocabulary, model sentences and practice in all three languages. Topic notes are in Vietnamese.',
            )}
          </p>
        </div>
      </section>
      <ol className="unit-list">
        {loaded.data.map((t, i) => (
          <li key={t.id}>
            <a className="card unit-row is-open" href={routeHref({ name: 'topic', topicId: t.id })}>
              <span className="unit-row__n">{i + 1}</span>
              <span>
                <strong>{t.title}</strong>
                <small className="muted">
                  {t.level.cefr} · {t.level.hsk} · {studyTime(t.hours)}
                </small>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TopicPage({ topicId }: { topicId: string }) {
  const state = useAppState();
  const lang: CurriculumLang = state.levelLang ?? 'en';
  const loaded = useTopics();
  if (loaded.status !== 'ready') return <Waiting loaded={loaded} />;
  const topic = loaded.data.find((t) => t.id === topicId);
  if (!topic) return <Waiting loaded={{ status: 'error' }} />;
  const say = (text: string) => speak(text, lang);
  return (
    <div className="page topic-page">
      <a className="link-btn" href={routeHref({ name: 'topics' })}>
        ← {tr('Chủ đề', 'Topics')}
      </a>
      <header>
        <p className="eyebrow">
          {topic.level.cefr} · {topic.level.hsk}
        </p>
        <h1>{topic.title}</h1>
      </header>
      <LanguageTabs lang={lang} />
      <a
        className="btn btn--block"
        href={routeHref({ name: 'topic-practice', topicId: topic.id, lang })}
      >
        {tr('Luyện tập chủ đề này', 'Practise this topic')}
      </a>

      <section className="card lesson-intro__words">
        <h2>{tr('Từ vựng', 'Vocabulary')}</h2>
        <ul>
          {topic.vocab.map((w) => (
            <li key={w.en}>
              <button
                type="button"
                className="speak-btn"
                aria-label={tr(`Nghe ${phraseIn(w, lang)}`, `Listen to ${phraseIn(w, lang)}`)}
                onClick={() => say(phraseIn(w, lang))}
              >
                🔊
              </button>
              <strong lang={lang}>{phraseIn(w, lang)}</strong>
              {lang === 'zh' && <span className="vocab-sound">{w.zh.pinyin}</span>}
              <span>{meaningOf(w, lang)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card lesson-intro__words">
        <h2>{tr('Mẫu câu', 'Model sentences')}</h2>
        <ul>
          {topic.sentences.map((s) => (
            <li key={s.en}>
              <button
                type="button"
                className="speak-btn"
                aria-label={tr(`Nghe ${phraseIn(s, lang)}`, `Listen to ${phraseIn(s, lang)}`)}
                onClick={() => say(phraseIn(s, lang))}
              >
                🔊
              </button>
              <strong lang={lang}>{phraseIn(s, lang)}</strong>
              {lang === 'zh' && <span className="vocab-sound">{s.zh.pinyin}</span>}
              <span>{meaningOf(s, lang)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>{tr('Ngữ pháp', 'Grammar')}</h2>
        <p>{topic.grammar[lang]}</p>
        <h2>{tr('Phát âm', 'Pronunciation')}</h2>
        <p>{topic.pronunciation[lang]}</p>
        {lang === 'zh' && topic.hanzi.length > 0 && (
          <>
            <h2>{tr('Chữ Hán', 'Characters')}</h2>
            <ul>
              {topic.hanzi.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h2>{tr('Nhiệm vụ 4 kỹ năng', 'Four-skill tasks')}</h2>
        <ul className="task-list">
          {topic.skills.map((s) => (
            <li key={s.skill}>
              <strong>{skillName(s.skill)}</strong> ({tr(`${s.minutes} phút`, `${s.minutes} min`)}):{' '}
              {s.task}
            </li>
          ))}
          <li>
            <strong>{tr('Viết:', 'Writing:')}</strong> {topic.writing}
          </li>
          <li>
            <strong>{tr('Chép chính tả:', 'Dictation:')}</strong> {topic.dictation}
          </li>
          <li>
            <strong>{tr('Thử thách:', 'Challenge:')}</strong> {topic.challenge}
          </li>
        </ul>
      </section>
    </div>
  );
}

export function TopicPracticePage({ topicId, lang }: { topicId: string; lang: CurriculumLang }) {
  const state = useAppState();
  const loaded = useTopics();
  const [result, setResult] = useState<{ summary: SessionSummary; xp: number } | null>(null);
  const back = () => navigate({ name: 'topic', topicId });
  if (loaded.status !== 'ready') return <Waiting loaded={loaded} />;
  const topic = loaded.data.find((t) => t.id === topicId);
  if (!topic) return <Waiting loaded={{ status: 'error' }} />;
  const buddy = state.profile?.buddy ?? 'bear';

  if (result) {
    return (
      <SessionComplete
        buddy={buddy}
        title={tr('Xong chủ đề!', 'Topic done!')}
        xp={result.xp}
        summary={result.summary}
        onContinue={back}
      />
    );
  }
  return (
    <TopicSession
      key={`${topicId}:${lang}`}
      topic={topic}
      lang={lang}
      onDone={(summary) => {
        const xp = lessonXp(summary);
        appStore.update((s) => awardXp(setLevelLang(s, lang), xp, toDayKey(new Date())));
        setResult({ summary, xp });
      }}
      onQuit={back}
    />
  );
}

function TopicSession({
  topic,
  lang,
  onDone,
  onQuit,
}: {
  topic: Topic;
  lang: CurriculumLang;
  onDone: (s: SessionSummary) => void;
  onQuit: () => void;
}) {
  const state = useAppState();
  const [exercises] = useState(() => topicExercises(topic, lang, Date.now()));
  return (
    <LessonPlayer
      exercises={exercises}
      buddy={state.profile?.buddy ?? 'bear'}
      targetLang={lang}
      mode="practice"
      soundOn={state.soundOn}
      onAnswer={() => {}}
      onCantListen={() => {}}
      onComplete={onDone}
      onQuit={onQuit}
    />
  );
}
