import { useEffect, useRef } from 'react';
import type { TypeExercise } from '../../exercises';
import { BuddyPrompt, ExerciseTitle, LANGUAGE_NAMES, type ViewProps } from './common';

export function TypeView({
  exercise,
  buddy,
  targetLang,
  locked,
  response,
  onResponse,
}: ViewProps<TypeExercise>) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  return (
    <div className="exercise">
      <ExerciseTitle>Type this in {LANGUAGE_NAMES[exercise.answerLang]}</ExerciseTitle>
      <BuddyPrompt
        buddy={buddy}
        text={exercise.prompt}
        lang={exercise.promptLang}
        speakable={exercise.promptLang === targetLang}
      />
      <label className="visually-hidden" htmlFor="type-answer">
        Your answer in {LANGUAGE_NAMES[exercise.answerLang]}
      </label>
      <input
        id="type-answer"
        ref={inputRef}
        className="type-input"
        lang={exercise.answerLang}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={`Type in ${LANGUAGE_NAMES[exercise.answerLang]}…`}
        value={response ?? ''}
        readOnly={locked}
        onChange={(e) => onResponse(e.target.value.trim() ? e.target.value : null)}
      />
      {exercise.answerLang === 'vi' && (
        <p className="hint">
          Tip: no Vietnamese keyboard? Accents are optional — we’ll show you the right ones.
        </p>
      )}
    </div>
  );
}
