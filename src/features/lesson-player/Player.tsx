/**
 * The lesson player, shared by units, challenges, level tests, topics and practice.
 * One question at a time; Check → feedback that teaches (✓/✗, the answer and why) → Continue.
 * A wrong answer comes back later in the session (except in tests). No hearts: nothing blocks
 * the learner for being wrong (PRD 01 REQ-01-014).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer } from '../../components/Layer';
import { Icon } from '../../components/Icon';
import { Bar, Dialog, SpeakButton } from '../../components/ui';
import { tr } from '../../i18n/locale';
import { playFeedback } from '../../utils/sound';
import { speak, type SpeechLang } from '../../utils/speech';
import { gradeExercise, type Exercise, type GradeResult } from '../exercises';
import { explainMistake, type Explanation } from '../exercises/explain';
import { GlossText } from '../glossary/GlossText';
import type { CurriculumLang } from '../levels/types';
import {
  answerCurrent,
  currentExercise,
  isComplete,
  progressRatio,
  skipCurrent,
  startSession,
  summarize,
  type SessionState,
  type SessionSummary,
} from './session';

export interface PlayerProps {
  exercises: Exercise[];
  lang: CurriculumLang;
  mode: 'lesson' | 'test' | 'practice';
  soundOn: boolean;
  initialSession?: SessionState;
  onAnswer?: (exercise: Exercise, correct: boolean, why: Explanation | null) => void;
  onProgress?: (session: SessionState) => void;
  onComplete: (summary: SessionSummary, session: SessionState) => void;
  onQuit: () => void;
  onCantListen?: () => void;
}

interface Checked {
  result: GradeResult;
  why: Explanation | null;
  response: string;
}

const needsAudio = (e: Exercise) =>
  e.kind === 'dictation' || (e.kind === 'choice' && !!e.audioText && e.skill === 'listening');

export function Player(props: PlayerProps) {
  const { mode, lang, soundOn } = props;
  const [session, setSession] = useState<SessionState>(
    () => props.initialSession ?? startSession(props.exercises, Date.now()),
  );
  const [response, setResponse] = useState('');
  const [checked, setChecked] = useState<Checked | null>(null);
  const [quitting, setQuitting] = useState(false);
  const exercise = currentExercise(session);
  const finished = useRef(false);

  useEffect(() => {
    if (isComplete(session) && !finished.current) {
      finished.current = true;
      props.onComplete(summarize(session, Date.now()), session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const check = useCallback(() => {
    if (!exercise || checked) return;
    const result = gradeExercise(exercise, response);
    const why = explainMistake(exercise, response, result);
    setChecked({ result, why, response });
    if (soundOn) playFeedback(result.correct ? 'correct' : 'wrong');
    props.onAnswer?.(exercise, result.correct, why);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, checked, response, soundOn]);

  const advance = useCallback(() => {
    if (!checked) return;
    const next = answerCurrent(session, checked.result.correct, mode !== 'test');
    setSession(next);
    setChecked(null);
    setResponse('');
    if (!isComplete(next)) props.onProgress?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, session, mode]);

  const skip = () => {
    if (!exercise) return;
    const result = gradeExercise(exercise, '');
    const why = explainMistake(exercise, '', result);
    setChecked({ result, why, response: '' });
    props.onAnswer?.(exercise, false, why);
  };

  const cantListen = () => {
    props.onCantListen?.();
    const next = skipCurrent(session);
    setSession(next);
    setResponse('');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (quitting) return;
      const typing = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;
      if (e.key === 'Enter' && !e.shiftKey) {
        if (checked) {
          e.preventDefault();
          advance();
        } else if (response.trim() && (!typing || e.target instanceof HTMLInputElement || !(exercise?.kind === 'free'))) {
          e.preventDefault();
          check();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [checked, response, check, advance, quitting, exercise]);

  if (!exercise) return <Layer />;

  const state = checked ? (checked.result.correct ? 'right' : 'wrong') : 'idle';
  return (
    <Layer>
      <div className="player">
        <div className="player__top">
          <button type="button" className="iconbtn" aria-label={tr('Thoát', 'Quit')} onClick={() => setQuitting(true)}>
            <Icon name="close" />
          </button>
          <Bar value={progressRatio(session)} label={tr('Tiến độ', 'Progress')} />
          <span className="small muted" style={{ minWidth: 44, textAlign: 'right' }}>
            {Math.min(session.completed + 1, session.total)}/{session.total}
          </span>
        </div>

        <div className="player__body" key={`${session.position}`}>
          <ExerciseView exercise={exercise} lang={lang} response={response} setResponse={setResponse} checked={checked} />
          {!checked && needsAudio(exercise) && props.onCantListen && (
            <button type="button" className="btn btn--text" style={{ marginTop: 14 }} onClick={cantListen}>
              <Icon name="listening" size="sm" /> {tr('Không nghe được lúc này', "Can't listen now")}
            </button>
          )}
        </div>

        <div className="feedback" data-state={state} aria-live="polite">
          {checked && <FeedbackMessage checked={checked} exercise={exercise} />}
          <div className="row">
            {!checked ? (
              <>
                {exercise.kind !== 'say' && exercise.kind !== 'free' && (
                  <button type="button" className="btn btn--ghost" onClick={skip}>
                    {tr('Bỏ qua', 'Skip')}
                  </button>
                )}
                <button type="button" className="btn" disabled={!response.trim()} onClick={check}>
                  {tr('Kiểm tra', 'Check')}
                </button>
              </>
            ) : (
              <button type="button" className="btn" onClick={advance} autoFocus>
                {tr('Tiếp tục', 'Continue')}
              </button>
            )}
          </div>
        </div>
      </div>
      {quitting && (
        <Dialog
          title={tr('Dừng ở đây?', 'Stop here?')}
          onClose={() => setQuitting(false)}
          actions={
            <>
              <button type="button" className="btn btn--text" onClick={props.onQuit}>
                {tr('Kết thúc', 'End')}
              </button>
              <button type="button" className="btn" data-autofocus onClick={() => setQuitting(false)}>
                {tr('Học tiếp', 'Keep going')}
              </button>
            </>
          }
        >
          <p className="muted">
            {mode === 'test'
              ? tr('Bài kiểm tra sẽ không được tính nếu bạn dừng bây giờ.', 'The test will not count if you stop now.')
              : tr('Bài đang làm được lưu lại. Lần sau bạn học tiếp từ câu này.', 'Your place is saved. Next time you continue from this question.')}
          </p>
        </Dialog>
      )}
    </Layer>
  );
}

function FeedbackMessage({ checked, exercise }: { checked: Checked; exercise: Exercise }) {
  const { result, why } = checked;
  const selfChecked = exercise.kind === 'say' || exercise.kind === 'free';
  let title: string;
  let body: string | null = null;
  if (result.correct) {
    title = selfChecked ? tr('Tốt lắm!', 'Well done!') : [tr('Chính xác!', 'Correct!'), tr('Tuyệt!', 'Great!'), tr('Đúng rồi!', 'Nice!')][exercise.id.length % 3]!;
    if (result.note === 'accents') body = tr(`Nhớ dấu nhé: ${result.correctAnswer}`, `Mind the accents: ${result.correctAnswer}`);
    if (result.note === 'typo') body = tr(`Gần đúng, viết chuẩn là: ${result.correctAnswer}`, `Almost — it’s spelled: ${result.correctAnswer}`);
    if (exercise.kind === 'free' && exercise.model) body = tr(`Bài mẫu: ${exercise.model}`, `Model answer: ${exercise.model}`);
  } else {
    title = tr('Chưa đúng', 'Not quite');
    const answer = result.correctAnswer ? tr(`Đáp án: ${result.correctAnswer}`, `Answer: ${result.correctAnswer}`) : '';
    body = [answer, why?.why && why.why !== answer ? why.why : ''].filter(Boolean).join(' · ');
  }
  return (
    <div className="feedback__msg">
      <span className="feedback__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24">{result.correct ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M7 7l10 10M17 7L7 17" />}</svg>
      </span>
      <div>
        <b>{title}</b>
        {body && <p>{body}</p>}
      </div>
    </div>
  );
}

interface ViewProps {
  exercise: Exercise;
  lang: CurriculumLang;
  response: string;
  setResponse: (r: string) => void;
  checked: Checked | null;
}

function Instruction({ text, review }: { text: string | null; review?: boolean }) {
  if (!text && !review) return null;
  return (
    <div className="q-instr">
      {review && <span className="tag tag--warm">{tr('Ôn lại', 'Review')}</span>}
      {text}
    </div>
  );
}

function AudioButtons({ text, lang, auto }: { text: string; lang: SpeechLang; auto?: boolean }) {
  useEffect(() => {
    if (auto) speak(text, lang);
  }, [auto, text, lang]);
  return (
    <div className="speak-row">
      <button type="button" className="speak-big" aria-label={tr('Nghe', 'Listen')} onClick={() => speak(text, lang)}>
        <Icon name="sound" />
      </button>
      <button type="button" className="speak-big slow" aria-label={tr('Nghe chậm', 'Listen slowly')} onClick={() => speak(text, lang, true)}>
        <Icon name="slow" />
      </button>
    </div>
  );
}

function ExerciseView(p: ViewProps) {
  const e = p.exercise;
  switch (e.kind) {
    case 'choice':
    case 'select':
      return <ChoiceView {...p} />;
    case 'text':
      return (
        <>
          <Instruction text={e.instruction} review={e.review} />
          <p className="q-prompt" lang={/[㐀-鿿]/.test(e.prompt) ? 'zh' : undefined}>{e.prompt}</p>
          <TextAnswer {...p} placeholder={tr('Nhập câu trả lời', 'Type your answer')} />
        </>
      );
    case 'dictation':
      return (
        <>
          <Instruction text={tr('Nghe và viết lại', 'Listen and type what you hear')} review={e.review} />
          <AudioButtons text={e.audioText} lang={e.lang} auto />
          <TextAnswer {...p} placeholder={tr('Viết điều bạn nghe được', 'Type what you hear')} />
        </>
      );
    case 'build':
      return <BuildView {...p} />;
    case 'say':
      return (
        <>
          <Instruction text={tr('Nghe rồi nói to', 'Listen, then say it aloud')} review={e.review} />
          <p className="q-prompt" lang={e.lang}>{e.text}</p>
          <AudioButtons text={e.text} lang={e.lang} />
          {e.explain && <p className="muted small" style={{ marginBottom: 12 }}>{e.explain}</p>}
          <button
            type="button"
            className="option"
            aria-pressed={p.response === 'said'}
            disabled={!!p.checked}
            onClick={() => p.setResponse(p.response === 'said' ? '' : 'said')}
          >
            <Icon name="speaking" /> {tr('Tôi đã nói to câu này', 'I said it aloud')}
          </button>
        </>
      );
    case 'free':
      return (
        <>
          <Instruction text={tr('Viết tự do, rồi so với bài mẫu', 'Write freely, then compare with the model')} review={e.review} />
          <p className="q-prompt">{e.prompt}</p>
          <textarea
            className="answer-input"
            value={p.response}
            disabled={!!p.checked}
            onChange={(ev) => p.setResponse(ev.target.value)}
            lang={e.lang}
            aria-label={tr('Bài viết của bạn', 'Your writing')}
            placeholder={tr('Viết 2–5 câu…', 'Write 2–5 sentences…')}
          />
          {p.checked && e.model && (
            <div className="model">
              <b className="small">{tr('Bài mẫu', 'Model answer')}</b>
              <p lang={e.lang}>{e.model}</p>
            </div>
          )}
        </>
      );
  }
}

function ChoiceView({ exercise: e, lang, response, setResponse, checked }: ViewProps) {
  const [showTr, setShowTr] = useState(false);
  const options = e.kind === 'choice' || e.kind === 'select' ? e.options : [];
  const answer = e.kind === 'choice' ? String(e.answerIndex) : e.kind === 'select' ? e.answer : '';
  const value = (o: string, i: number) => (e.kind === 'choice' ? String(i) : o);
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (checked || ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
      const n = Number(ev.key);
      if (n >= 1 && n <= options.length) setResponse(value(options[n - 1]!, n - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, options]);

  if (e.kind !== 'choice' && e.kind !== 'select') return null;
  const listening = e.kind === 'choice' && e.audioText && e.skill === 'listening';
  const optionLang = e.kind === 'select' ? e.optionLang : e.lang;
  return (
    <>
      <Instruction text={e.kind === 'choice' ? e.instruction : tr('Chọn nghĩa đúng', 'Choose the meaning')} review={e.review} />
      {e.kind === 'choice' && e.passage && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="passage">
            <GlossText text={e.passage.text} lang={lang} unitId={e.lessonId} />
          </p>
          {e.passage.translation && (
            <>
              <button type="button" className="btn btn--text" style={{ paddingLeft: 0 }} onClick={() => setShowTr(!showTr)}>
                {showTr ? tr('Ẩn bản dịch', 'Hide translation') : tr('Xem bản dịch', 'Show translation')}
              </button>
              {showTr && <p className="muted small">{e.passage.translation}</p>}
            </>
          )}
        </div>
      )}
      {listening && <AudioButtons text={e.audioText!} lang={e.lang} auto />}
      <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 10 }}>
        <p className="q-prompt" style={{ flex: 1 }} lang={e.kind === 'select' ? e.promptLang : /[㐀-鿿]/.test(e.prompt) ? 'zh' : undefined}>
          {e.prompt}
        </p>
        {!listening && e.kind === 'select' && <SpeakButton text={e.prompt} lang={e.promptLang} />}
        {!listening && e.kind === 'choice' && e.audioText && <SpeakButton text={e.audioText} lang={e.lang} />}
      </div>
      <div className="options" role="radiogroup" aria-label={tr('Các lựa chọn', 'Options')}>
        {options.map((o, i) => {
          const v = value(o, i);
          const result = checked ? (v === answer ? 'right' : v === response ? 'wrong' : undefined) : undefined;
          return (
            <button
              key={`${o}-${i}`}
              type="button"
              className="option"
              role="radio"
              aria-checked={response === v}
              aria-pressed={response === v}
              data-result={result}
              disabled={!!checked}
              onClick={() => setResponse(v)}
              lang={optionLang}
            >
              <span className="key">{i + 1}</span>
              <span style={{ flex: 1 }}>{o}</span>
              {result === 'right' && <Icon name="check" />}
              {result === 'wrong' && <Icon name="cross" />}
            </button>
          );
        })}
      </div>
    </>
  );
}

function TextAnswer({ exercise, response, setResponse, checked, placeholder }: ViewProps & { placeholder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const lang = 'lang' in exercise ? exercise.lang : undefined;
  return (
    <input
      ref={ref}
      className="answer-input answer-input--line"
      value={response}
      disabled={!!checked}
      onChange={(ev) => setResponse(ev.target.value)}
      lang={lang}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-label={placeholder}
      placeholder={placeholder}
    />
  );
}

function BuildView({ exercise: e, response, setResponse, checked }: ViewProps) {
  const tiles = useMemo(() => (e.kind === 'build' ? e.tiles : []), [e]);
  // Picked tiles are stored as indexes so repeated words stay distinct.
  const [picked, setPicked] = useState<number[]>([]);
  const text = useMemo(() => picked.map((i) => tiles[i]).join(' '), [picked, tiles]);
  useEffect(() => {
    if (text !== response) setResponse(text);
  }, [text, response, setResponse]);
  if (e.kind !== 'build') return null;
  return (
    <>
      <Instruction text={tr('Sắp xếp thành câu đúng', 'Put the words in order')} review={e.review} />
      <p className="q-prompt">{e.prompt}</p>
      <div className="tiles tiles--answer" aria-label={tr('Câu của bạn', 'Your sentence')}>
        {picked.map((i, k) => (
          <button key={`${i}-${k}`} type="button" className="tile" disabled={!!checked} onClick={() => setPicked(picked.filter((_, j) => j !== k))} lang={e.answerLang}>
            {tiles[i]}
          </button>
        ))}
      </div>
      <div className="tiles">
        {tiles.map((t, i) => (
          <button key={`${t}-${i}`} type="button" className="tile" disabled={!!checked || picked.includes(i)} onClick={() => setPicked([...picked, i])} lang={e.answerLang}>
            {t}
          </button>
        ))}
      </div>
    </>
  );
}
