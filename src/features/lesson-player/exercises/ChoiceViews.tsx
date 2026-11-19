import { useCallback } from 'react';
import { Mascot } from '../../../components/mascots';
import { speak } from '../../../utils/speech';
import type { PictureExercise, SelectExercise } from '../../exercises';
import { BuddyPrompt, ExerciseTitle, choiceState, useNumberKeys, type ViewProps } from './common';

export function SelectView({
  exercise,
  buddy,
  targetLang,
  locked,
  response,
  onResponse,
}: ViewProps<SelectExercise>) {
  const pick = useCallback(
    (i: number) => {
      const option = exercise.options[i];
      if (!option) return;
      onResponse(option);
      if (exercise.optionLang === targetLang) speak(option, targetLang);
    },
    [exercise, onResponse, targetLang],
  );
  useNumberKeys(exercise.options.length, pick, !locked);

  return (
    <div className="exercise">
      <ExerciseTitle>Select the correct meaning</ExerciseTitle>
      <BuddyPrompt
        buddy={buddy}
        text={exercise.prompt}
        lang={exercise.promptLang}
        speakable={exercise.promptLang === targetLang}
      />
      <div className="choices" role="group" aria-label="Answer options">
        {exercise.options.map((option, i) => (
          <button
            key={option}
            type="button"
            className={`choice ${choiceState(option, response, exercise.answer, locked)}`}
            aria-pressed={response === option}
            disabled={locked}
            onClick={() => pick(i)}
            lang={exercise.optionLang}
          >
            <span className="choice__key" aria-hidden>
              {i + 1}
            </span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PictureView({
  exercise,
  targetLang,
  locked,
  response,
  onResponse,
}: ViewProps<PictureExercise>) {
  const pick = useCallback(
    (i: number) => {
      const option = exercise.options[i];
      if (!option) return;
      onResponse(option.image);
      speak(option.label, targetLang);
    },
    [exercise, onResponse, targetLang],
  );
  useNumberKeys(exercise.options.length, pick, !locked);

  return (
    <div className="exercise">
      <ExerciseTitle>
        Which one is “<span lang={exercise.promptLang}>{exercise.prompt}</span>”?
      </ExerciseTitle>
      <div className="picture-grid" role="group" aria-label="Pictures">
        {exercise.options.map((option, i) => (
          <button
            key={option.image}
            type="button"
            className={`choice picture-card ${choiceState(option.image, response, exercise.answer, locked)}`}
            aria-pressed={response === option.image}
            disabled={locked}
            onClick={() => pick(i)}
          >
            <Mascot
              id={option.image}
              size={110}
              mood={locked && option.image === exercise.answer ? 'happy' : 'idle'}
            />
            <span className="picture-card__label" lang={exercise.labelLang}>
              {option.label}
            </span>
            <span className="choice__key" aria-hidden>
              {i + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
