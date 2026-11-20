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
import { tr } from '../../../i18n/locale';

function Blanked({ text }: { text: string }) {
  const parts = text.split(/_{2,}/);
  return (
    <p className="authored-prompt">
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="blank" aria-label={tr('chỗ trống', 'blank')} />}
        </span>
      ))}
    </p>
  );
}

function Passage({ passage }: { passage: NonNullable<ChoiceExercise['passage']> }) {
  const [showTranslation, setShowTranslation] = useState(false);
  return (
    <details className="passage" open>
      <summary>{tr('Bài đọc', 'Reading')}</summary>
      <p>{passage.text}</p>
      {passage.translation && (
        <button
          type="button"
          className="link-btn"
          onClick={() => setShowTranslation(!showTranslation)}
        >
          {showTranslation
            ? tr('Ẩn bản dịch', 'Hide translation')
            : tr('Xem bản dịch', 'Show translation')}
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
      <ExerciseTitle>
        {exercise.instruction ?? tr('Chọn đáp án đúng', 'Choose the right answer')}
      </ExerciseTitle>
      {exercise.passage && <Passage passage={exercise.passage} />}
      {exercise.audioText && (
        <div className="audio-row">
          <SpeakButton
            text={exercise.audioText}
            lang={exercise.lang}
            big
            label={tr('Nghe', 'Listen')}
          />
          <SpeakButton
            text={exercise.audioText}
            lang={exercise.lang}
            slow
            label={tr('Nghe chậm', 'Play slowly')}
          />
        </div>
      )}
      <Blanked text={exercise.prompt} />
      <div className="choices" role="group" aria-label={tr('Các đáp án', 'Answer options')}>
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
    placeholder: tr('Nhập câu trả lời…', 'Type your answer…'),
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
      <ExerciseTitle>
        {exercise.instruction ?? tr('Viết câu trả lời', 'Write your answer')}
      </ExerciseTitle>
      <Blanked text={exercise.prompt} />
      <AnswerInput
        id="text-answer"
        label={tr('Câu trả lời', 'Answer')}
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
      <ExerciseTitle>{tr('Nghe và chép lại', 'Listen and write what you hear')}</ExerciseTitle>
      <div className="audio-row">
        <SpeakButton
          text={exercise.audioText}
          lang={exercise.lang}
          big
          label={tr('Nghe', 'Listen')}
        />
        <SpeakButton
          text={exercise.audioText}
          lang={exercise.lang}
          slow
          label={tr('Nghe chậm', 'Play slowly')}
        />
      </div>
      <AnswerInput
        id="dictation-answer"
        label={tr('Câu bạn nghe được', 'What you heard')}
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
      <ExerciseTitle>
        {tr('Nghe mẫu rồi nói to câu này', 'Listen, then say it aloud')}
      </ExerciseTitle>
      <div className="audio-row">
        <SpeakButton
          text={exercise.text}
          lang={exercise.lang}
          big
          label={tr('Nghe mẫu', 'Play the model')}
        />
        <SpeakButton
          text={exercise.text}
          lang={exercise.lang}
          slow
          label={tr('Nghe chậm', 'Play slowly')}
        />
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
        {tr('Tôi đã nói to câu này', 'I said it aloud')}
      </button>
      <p className="hint">
        {tr(
          'Chấm phát âm tự động sẽ có sau. Bây giờ bạn tự nghe lại và so với mẫu.',
          'Automatic pronunciation scoring comes later. For now, compare yourself with the model.',
        )}
      </p>
    </div>
  );
}

export function FreeView({ exercise, locked, response, onResponse }: ViewProps<FreeExercise>) {
  return (
    <div className="exercise">
      <ExerciseTitle>{tr('Viết', 'Write')}</ExerciseTitle>
      <p className="authored-prompt">{exercise.prompt}</p>
      <AnswerInput
        id="free-answer"
        label={tr('Bài viết của bạn', 'Your writing')}
        lang={exercise.lang}
        locked={locked}
        response={response}
        onResponse={onResponse}
        multiline
      />
      {locked && exercise.model && (
        <details className="passage" open>
          <summary>{tr('Bài mẫu để so sánh', 'Model answer to compare')}</summary>
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
