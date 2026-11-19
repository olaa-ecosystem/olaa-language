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
import { loadTopics, phraseIn, topicExercises } from './topics';
import type { Topic } from './types';

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
        {loaded.status === 'error' ? 'Không tải được chủ đề.' : 'Đang tải…'}
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
          <h1>15 chủ đề giao tiếp</h1>
          <p>Mỗi chủ đề có từ vựng, mẫu câu và bài tập cho cả ba ngôn ngữ.</p>
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
                  {t.level.cefr} · {t.level.hsk} · {t.hours}
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
        ← Chủ đề
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
        Luyện tập chủ đề này
      </a>

      <section className="card lesson-intro__words">
        <h2>Từ vựng</h2>
        <ul>
          {topic.vocab.map((w) => (
            <li key={w.en}>
              <button
                type="button"
                className="speak-btn"
                aria-label={`Nghe ${phraseIn(w, lang)}`}
                onClick={() => say(phraseIn(w, lang))}
              >
                🔊
              </button>
              <strong lang={lang}>{phraseIn(w, lang)}</strong>
              {lang === 'zh' && <span className="vocab-sound">{w.zh.pinyin}</span>}
              <span>{w.vi}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card lesson-intro__words">
        <h2>Mẫu câu</h2>
        <ul>
          {topic.sentences.map((s) => (
            <li key={s.en}>
              <button
                type="button"
                className="speak-btn"
                aria-label={`Nghe ${phraseIn(s, lang)}`}
                onClick={() => say(phraseIn(s, lang))}
              >
                🔊
              </button>
              <strong lang={lang}>{phraseIn(s, lang)}</strong>
              {lang === 'zh' && <span className="vocab-sound">{s.zh.pinyin}</span>}
              <span>{s.vi}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Ngữ pháp</h2>
        <p>{topic.grammar[lang]}</p>
        <h2>Phát âm</h2>
        <p>{topic.pronunciation[lang]}</p>
        {lang === 'zh' && topic.hanzi.length > 0 && (
          <>
            <h2>Chữ Hán</h2>
            <ul>
              {topic.hanzi.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h2>Nhiệm vụ 4 kỹ năng</h2>
        <ul className="task-list">
          {topic.skills.map((s) => (
            <li key={s.skill}>
              <strong>{s.skill}</strong> ({s.minutes} phút): {s.task}
            </li>
          ))}
          <li>
            <strong>Viết:</strong> {topic.writing}
          </li>
          <li>
            <strong>Chép chính tả:</strong> {topic.dictation}
          </li>
          <li>
            <strong>Thử thách:</strong> {topic.challenge}
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
        title="Xong chủ đề!"
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
