import { useEffect, useRef } from 'react';
import type { TypeExercise } from '../../exercises';
import { BuddyPrompt, ExerciseTitle, languageName, type ViewProps } from './common';
import { tr } from '../../../i18n/locale';

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
      <ExerciseTitle>
        {tr(
          `Gõ câu này bằng ${languageName(exercise.answerLang)}`,
          `Type this in ${languageName(exercise.answerLang)}`,
        )}
      </ExerciseTitle>
      <BuddyPrompt
        buddy={buddy}
        text={exercise.prompt}
        lang={exercise.promptLang}
        speakable={exercise.promptLang === targetLang}
      />
      <label className="visually-hidden" htmlFor="type-answer">
        {tr(
          `Câu trả lời bằng ${languageName(exercise.answerLang)}`,
          `Your answer in ${languageName(exercise.answerLang)}`,
        )}
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
        placeholder={tr(
          `Gõ bằng ${languageName(exercise.answerLang)}…`,
          `Type in ${languageName(exercise.answerLang)}…`,
        )}
        value={response ?? ''}
        readOnly={locked}
        onChange={(e) => onResponse(e.target.value.trim() ? e.target.value : null)}
      />
      {exercise.answerLang === 'vi' && (
        <p className="hint">
          {tr(
            'Mẹo: không có bàn phím tiếng Việt? Dấu không bắt buộc, app sẽ chỉ cho bạn dấu đúng.',
            'Tip: no Vietnamese keyboard? Accents are optional. We’ll show you the right ones.',
          )}
        </p>
      )}
    </div>
  );
}
