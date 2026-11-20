import { useCallback, useMemo, useState } from 'react';
import { navigate } from '../../app/router';
import { Mascot } from '../../components/mascots';
import { EmptyState } from '../../components/ui';
import { appStore, useAppState } from '../../stores/appStore';
import {
  applyCardReview,
  courseProgress,
  finishLesson,
  pauseListening,
  recordMistake,
  resolveMistake,
} from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import { speak } from '../../utils/speech';
import { allLessons, findLesson, lessonStatuses, nextLessonId, type Course } from '../curriculum';
import { generateLessonExercises, type Exercise } from '../exercises';
import type { Explanation } from '../exercises/explain';
import { cardExercise, interleaveReview } from '../exercises/review';
import { dueCards } from '../flashcards-srs/srs';
import { LessonPlayer } from './LessonPlayer';
import { clearSession, loadSession, saveSession } from './resume';
import { SessionComplete } from './ResultScreens';
import { lessonXp, type SessionState, type SessionSummary } from './session';
import { tr } from '../../i18n/locale';

const LISTEN_PAUSE_MS = 60 * 60 * 1000;
/** Rough time per exercise, for the duration shown before a lesson. */
const SECONDS_PER_EXERCISE = 25;

/**
 * A lesson in the shape of Ecosystem PRD v1.0 §6.2: objective and duration, the new words and
 * example sentences, practice with review mixed in, feedback that explains, then a recap with
 * what was added to review and the next step.
 */
export function LessonPage({ course, lessonId }: { course: Course; lessonId: string }) {
  const state = useAppState();
  const buddy = state.profile?.buddy ?? course.mascot;
  const progress = courseProgress(state, course.id);
  const found = findLesson(course, lessonId);
  const level = progress.lessonLevels[lessonId] ?? 0;

  const [saved] = useState(() => loadSession(lessonId, level, Date.now()));
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [resume, setResume] = useState<SessionState | undefined>(undefined);
  const [result, setResult] = useState<{ summary: SessionSummary; xp: number } | null>(null);

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    if (!found) return [];
    const now = Date.now();
    const base = generateLessonExercises(course, found.lesson, level, now);
    const today = toDayKey(new Date(now));
    const cards = Object.values(progress.cards);
    const due = dueCards(progress.cards, today)
      .filter((c) => c.lessonId !== lessonId)
      .map((c, i) => cardExercise(c, cards, course.targetLang, course.baseLang, now + i))
      .filter((e): e is NonNullable<typeof e> => e !== null);
    const mixed = interleaveReview(
      base,
      { mistakes: Object.values(progress.mistakes), dueCards: due, lessonId },
      now,
    );
    return state.listenOffUntil > now ? mixed.filter((e) => e.kind !== 'listen') : mixed;
  });

  const reviewCount = exercises.filter((e) => e.review).length;

  const onAnswer = useCallback(
    (exercise: Exercise, correct: boolean, why: Explanation | null) => {
      const today = toDayKey(new Date());
      appStore.update((s) => {
        let next = correct
          ? resolveMistake(s, course.id, exercise.id)
          : recordMistake(s, course.id, exercise, why?.category);
        if (exercise.cardId)
          next = applyCardReview(
            next,
            course.id,
            exercise.cardId,
            correct ? 'good' : 'again',
            today,
          );
        return next;
      });
    },
    [course.id],
  );

  const onProgress = useCallback(
    (session: SessionState) => {
      saveSession({ lessonId, level, exercises, session, savedAt: Date.now() });
    },
    [lessonId, level, exercises],
  );

  const onComplete = useCallback(
    (summary: SessionSummary) => {
      if (!found) return;
      clearSession(lessonId);
      const xp = lessonXp(summary);
      appStore.update((s) =>
        finishLesson(s, { course, lesson: found.lesson, xp, today: toDayKey(new Date()) }),
      );
      setResult({ summary, xp });
      setPhase('done');
    },
    [course, found, lessonId],
  );

  const onCantListen = useCallback(() => {
    appStore.update((s) => pauseListening(s, Date.now() + LISTEN_PAUSE_MS));
  }, []);

  const exit = () => navigate({ name: 'learn' });

  const next = useMemo(() => {
    if (phase !== 'done') return null;
    const id = nextLessonId(course, courseProgress(appStore.getState(), course.id).lessonLevels);
    return id ? (allLessons(course).find((l) => l.id === id) ?? null) : null;
  }, [phase, course]);

  if (!found || lessonStatuses(course, progress.lessonLevels)[lessonId] === 'locked') {
    return (
      <div className="page page--center">
        <EmptyState
          mascot={<Mascot id={buddy} size={140} mood="sad" />}
          title={tr('Bài này chưa mở', 'This lesson isn’t open yet')}
        >
          <p>
            {tr(
              'Học xong các bài trước trên lộ trình để mở bài này.',
              'Finish the lessons before it on your path to unlock it.',
            )}
          </p>
          <button type="button" className="btn" onClick={exit}>
            {tr('Về lộ trình', 'Back to path')}
          </button>
        </EmptyState>
      </div>
    );
  }

  const { lesson } = found;
  const { targetLang, baseLang } = course;

  if (phase === 'intro') {
    const minutes = Math.max(1, Math.round((exercises.length * SECONDS_PER_EXERCISE) / 60));
    return (
      <div className="lesson-intro">
        <button
          type="button"
          className="icon-btn lesson-intro__close"
          aria-label={tr('Về lộ trình', 'Back to path')}
          onClick={exit}
        >
          ×
        </button>
        <div className="lesson-intro__head">
          <Mascot id={buddy} size={96} mood="wave" />
          <div>
            <p className="eyebrow">
              {level > 0
                ? tr(`Luyện lại · cấp ${level + 1}`, `Practice again · level ${level + 1}`)
                : tr('Bài mới', 'New lesson')}
            </p>
            <h1>{lesson.title}</h1>
            <p className="lesson-intro__goal">
              {tr(
                `Mục tiêu: hiểu và dùng được ${lesson.words.length} từ và ${lesson.sentences.length} câu. Khoảng ${minutes} phút${reviewCount > 0 ? `, có ${reviewCount} câu ôn từ các bài trước` : ''}.`,
                `Goal: understand and use ${lesson.words.length} words and ${lesson.sentences.length} sentences. About ${minutes} min${reviewCount > 0 ? `, with ${reviewCount} review question${reviewCount > 1 ? 's' : ''} from earlier lessons` : ''}.`,
              )}
            </p>
          </div>
        </div>

        <section className="card lesson-intro__words" aria-label={tr('Từ mới', 'New words')}>
          <h2>{tr('Từ vựng', 'Words')}</h2>
          <ul>
            {lesson.words.map((w) => (
              <li key={w.en}>
                <button
                  type="button"
                  className="speak-btn"
                  aria-label={tr(`Nghe ${w[targetLang]}`, `Listen to ${w[targetLang]}`)}
                  onClick={() => speak(w[targetLang], targetLang)}
                >
                  🔊
                </button>
                <strong lang={targetLang}>{w[targetLang]}</strong>
                <span lang={baseLang}>{w[baseLang]}</span>
              </li>
            ))}
          </ul>
        </section>

        {lesson.sentences.length > 0 && (
          <section className="card lesson-intro__words" aria-label={tr('Câu mẫu', 'Examples')}>
            <h2>{tr('Câu mẫu', 'Examples')}</h2>
            <ul>
              {lesson.sentences.slice(0, 2).map((s) => (
                <li key={s.en}>
                  <button
                    type="button"
                    className="speak-btn"
                    aria-label={tr(`Nghe ${s[targetLang]}`, `Listen to ${s[targetLang]}`)}
                    onClick={() => speak(s[targetLang], targetLang)}
                  >
                    🔊
                  </button>
                  <strong lang={targetLang}>{s[targetLang]}</strong>
                  <span lang={baseLang}>{s[baseLang]}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="lesson-intro__actions">
          {saved && (
            <button
              type="button"
              className="btn btn--block"
              onClick={() => {
                setExercises(saved.exercises);
                setResume(saved.session);
                setPhase('play');
              }}
            >
              {tr(
                `Học tiếp từ chỗ đã dừng (đã trả lời ${saved.session.position} câu)`,
                `Continue where you left off (${saved.session.position} answered)`,
              )}
            </button>
          )}
          <button
            type="button"
            className={`btn btn--block ${saved ? 'btn--ghost' : ''}`}
            onClick={() => {
              clearSession(lessonId);
              setPhase('play');
            }}
            autoFocus={!saved}
          >
            {saved ? tr('Học lại từ đầu', 'Start over') : tr('Bắt đầu bài học', 'Start lesson')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'done' && result) {
    return (
      <SessionComplete
        buddy={buddy}
        title={tr('Xong bài học!', 'Lesson complete!')}
        xp={result.xp}
        summary={result.summary}
        extra={
          <div className="recap card">
            <h2>{tr('Tóm tắt', 'Recap')}</h2>
            <p>
              {tr('Bạn đã luyện: ', 'You practised: ')}
              {lesson.words.map((w) => w[targetLang]).join(', ')}.
            </p>
            <p className="muted">
              {tr(
                `${lesson.words.length} từ đã vào thẻ ôn tập; chúng quay lại từ ngày mai và trong các bài sau.`,
                `${lesson.words.length} words are in your flashcards; they come back tomorrow and inside later lessons.`,
              )}
            </p>
            {next && (
              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => navigate({ name: 'lesson', lessonId: next.id })}
              >
                {tr('Bài tiếp: ', 'Next: ')}
                {next.title}
              </button>
            )}
          </div>
        }
        onContinue={exit}
      />
    );
  }

  return (
    <LessonPlayer
      exercises={exercises}
      buddy={buddy}
      targetLang={targetLang}
      mode="lesson"
      soundOn={state.soundOn}
      initialSession={resume}
      onProgress={onProgress}
      onAnswer={onAnswer}
      onCantListen={onCantListen}
      onComplete={onComplete}
      onQuit={exit}
    />
  );
}
