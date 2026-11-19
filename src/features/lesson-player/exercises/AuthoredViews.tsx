/**
 * Views for the level curriculum's exercise kinds (content team's lessons): choice with
 * optional audio or reading passage, typed answers, dictation, speaking and free writing.
 * Instructions are in Vietnamese, as written by the content team.
 */
import { useEffect, useRef, useState } from 'react';
import type {
  ChoiceExercise,
  DictationExercise,
  FreeExercise,
  SayExercise,
  TextExercise,
} from '../../exercises';
import { ExerciseTitle, SpeakButton, useNumberKeys, type ViewProps } from './common';

function Blanked({ text }: { text: string }) {
  const parts = text.split(/_{2,}/);
  return (
    <p className="authored-prompt">
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="blank" aria-label="chỗ trống" />}
        </span>
      ))}
    </p>
  );
}

function Passage({ passage }: { passage: NonNullable<ChoiceExercise['passage']> }) {
  const [showTranslation, setShowTranslation] = useState(false);
  return (
    <details className="passage" open>
      <summary>Bài đọc</summary>
      <p>{passage.text}</p>
      {passage.translation && (
        <button
          type="button"
          className="link-btn"
          onClick={() => setShowTranslation(!showTranslation)}
        >
          {showTranslation ? 'Ẩn bản dịch' : 'Xem bản dịch'}
        </button>
      )}
      {showTranslation && <p className="passage__translation">{passage.translation}</p>}
    </details>
  );
}

export function ChoiceItemView({
  exercise,
  locked,
  response,
  onResponse,
}: ViewProps<ChoiceExercise>) {
  useNumberKeys(exercise.options.length, (i) => onResponse(String(i)), !locked);
  useEffect(() => {
    if (exercise.audioText) speakSoon(exercise.audioText, exercise.lang);
  }, [exercise]);
  return (
    <div className="exercise">
      <ExerciseTitle>{exercise.instruction ?? 'Chọn đáp án đúng'}</ExerciseTitle>
      {exercise.passage && <Passage passage={exercise.passage} />}
      {exercise.audioText && (
        <div className="audio-row">
          <SpeakButton text={exercise.audioText} lang={exercise.lang} big label="Nghe" />
          <SpeakButton text={exercise.audioText} lang={exercise.lang} slow label="Nghe chậm" />
        </div>
      )}
      <Blanked text={exercise.prompt} />
      <div className="choices" role="group" aria-label="Các đáp án">
        {exercise.options.map((option, i) => {
          const picked = response === String(i);
          const state = locked
            ? i === exercise.answerIndex
              ? 'is-correct'
              : picked
                ? 'is-wrong'
                : ''
            : picked
              ? 'is-selected'
              : '';
          return (
            <button
              key={`${i}-${option}`}
              type="button"
              className={`choice ${state}`}
              aria-pressed={picked}
              disabled={locked}
              onClick={() => onResponse(String(i))}
            >
              <span className="choice__key" aria-hidden>
                {i + 1}
              </span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AnswerInput({
  id,
  label,
  lang,
  locked,
  response,
  onResponse,
  multiline,
}: {
  id: string;
  label: string;
  lang: string;
  locked: boolean;
  response: string | null;
  onResponse: (v: string | null) => void;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const common = {
    id,
    ref,
    lang,
    className: multiline ? 'type-input type-input--area' : 'type-input',
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
    value: response ?? '',
    readOnly: locked,
    placeholder: 'Nhập câu trả lời…',
  };
  return (
    <>
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          {...common}
          rows={6}
          onChange={(e) => onResponse(e.target.value.trim() ? e.target.value : null)}
        />
      ) : (
        <input
          {...common}
          onChange={(e) => onResponse(e.target.value.trim() ? e.target.value : null)}
        />
      )}
    </>
  );
}

export function TextItemView({ exercise, locked, response, onResponse }: ViewProps<TextExercise>) {
  return (
    <div className="exercise">
      <ExerciseTitle>{exercise.instruction ?? 'Viết câu trả lời'}</ExerciseTitle>
      <Blanked text={exercise.prompt} />
      <AnswerInput
        id="text-answer"
        label="Câu trả lời"
        lang={exercise.lang}
        locked={locked}
        response={response}
        onResponse={onResponse}
      />
    </div>
  );
}

export function DictationView({
  exercise,
  locked,
  response,
  onResponse,
}: ViewProps<DictationExercise>) {
  useEffect(() => speakSoon(exercise.audioText, exercise.lang), [exercise]);
  return (
    <div className="exercise">
      <ExerciseTitle>Nghe và chép lại</ExerciseTitle>
      <div className="audio-row">
        <SpeakButton text={exercise.audioText} lang={exercise.lang} big label="Nghe" />
        <SpeakButton text={exercise.audioText} lang={exercise.lang} slow label="Nghe chậm" />
      </div>
      <AnswerInput
        id="dictation-answer"
        label="Câu bạn nghe được"
        lang={exercise.lang}
        locked={locked}
        response={response}
        onResponse={onResponse}
      />
    </div>
  );
}

export function SayView({ exercise, locked, response, onResponse }: ViewProps<SayExercise>) {
  return (
    <div className="exercise">
      <ExerciseTitle>Nghe mẫu rồi nói to câu này</ExerciseTitle>
      <div className="audio-row">
        <SpeakButton text={exercise.text} lang={exercise.lang} big label="Nghe mẫu" />
        <SpeakButton text={exercise.text} lang={exercise.lang} slow label="Nghe chậm" />
      </div>
      <p className="authored-prompt" lang={exercise.lang}>
        {exercise.text}
      </p>
      {exercise.explain && <p className="hint">{exercise.explain}</p>}
      <button
        type="button"
        className={`choice ${response === 'said' ? 'is-selected' : ''}`}
        aria-pressed={response === 'said'}
        disabled={locked}
        onClick={() => onResponse(response === 'said' ? null : 'said')}
      >
        Tôi đã nói to câu này
      </button>
      <p className="hint">Chấm phát âm tự động sẽ có sau. Bây giờ bạn tự nghe lại và so với mẫu.</p>
    </div>
  );
}

export function FreeView({ exercise, locked, response, onResponse }: ViewProps<FreeExercise>) {
  return (
    <div className="exercise">
      <ExerciseTitle>Viết</ExerciseTitle>
      <p className="authored-prompt">{exercise.prompt}</p>
      <AnswerInput
        id="free-answer"
        label="Bài viết của bạn"
        lang={exercise.lang}
        locked={locked}
        response={response}
        onResponse={onResponse}
        multiline
      />
      {locked && exercise.model && (
        <details className="passage" open>
          <summary>Bài mẫu để so sánh</summary>
          <p style={{ whiteSpace: 'pre-wrap' }}>{exercise.model}</p>
        </details>
      )}
    </div>
  );
}

/** Let the screen render before speaking, so the voice does not cut the previous one. */
function speakSoon(text: string, lang: ChoiceExercise['lang']) {
  setTimeout(() => {
    void import('../../../utils/speech').then(({ speak }) => speak(text, lang));
  }, 250);
}
