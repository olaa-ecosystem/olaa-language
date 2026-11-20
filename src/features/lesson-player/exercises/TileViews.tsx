import type { SpeechLang } from '../../../utils/speech';
import { useEffect, useState } from 'react';
import { speak } from '../../../utils/speech';
import type { BuildExercise, ListenExercise } from '../../exercises';
import { BuddyPrompt, ExerciseTitle, languageName, SpeakButton, type ViewProps } from './common';
import { tr } from '../../../i18n/locale';

function TileBoard({
  tiles,
  lang,
  locked,
  speakTiles,
  onResponse,
}: {
  tiles: string[];
  lang: SpeechLang;
  locked: boolean;
  speakTiles: boolean;
  onResponse: (value: string | null) => void;
}) {
  const [chosen, setChosen] = useState<number[]>([]);

  const update = (next: number[]) => {
    setChosen(next);
    onResponse(next.length ? next.map((i) => tiles[i]).join(' ') : null);
  };

  return (
    <div className="tile-board">
      <div
        className="answer-line"
        aria-label={tr('Câu trả lời của bạn', 'Your answer')}
        aria-live="polite"
        lang={lang}
      >
        {chosen.map((i) => (
          <button
            key={i}
            type="button"
            className="tile"
            disabled={locked}
            onClick={() => update(chosen.filter((c) => c !== i))}
            aria-label={tr(`Bỏ ${tiles[i]}`, `Remove ${tiles[i]}`)}
          >
            {tiles[i]}
          </button>
        ))}
      </div>
      <div
        className="tile-bank"
        role="group"
        aria-label={tr('Các từ để chọn', 'Word bank')}
        lang={lang}
      >
        {tiles.map((tile, i) =>
          chosen.includes(i) ? (
            <span key={i} className="tile tile--ghost" aria-hidden>
              {tile}
            </span>
          ) : (
            <button
              key={i}
              type="button"
              className="tile"
              disabled={locked}
              onClick={() => {
                update([...chosen, i]);
                if (speakTiles) speak(tile, lang);
              }}
            >
              {tile}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export function BuildView({
  exercise,
  buddy,
  targetLang,
  locked,
  onResponse,
}: ViewProps<BuildExercise>) {
  return (
    <div className="exercise">
      <ExerciseTitle>
        {tr(
          `Viết câu này bằng ${languageName(exercise.answerLang)}`,
          `Write this in ${languageName(exercise.answerLang)}`,
        )}
      </ExerciseTitle>
      <BuddyPrompt
        buddy={buddy}
        text={exercise.prompt}
        lang={exercise.promptLang}
        speakable={exercise.promptLang === targetLang}
      />
      <TileBoard
        tiles={exercise.tiles}
        lang={exercise.answerLang}
        locked={locked}
        speakTiles={exercise.answerLang === targetLang}
        onResponse={onResponse}
      />
    </div>
  );
}

export function ListenView({
  exercise,
  locked,
  onResponse,
  onCantListen,
}: ViewProps<ListenExercise> & { onCantListen: () => void }) {
  useEffect(() => {
    speak(exercise.audioText, exercise.audioLang);
  }, [exercise.audioText, exercise.audioLang]);

  return (
    <div className="exercise">
      <ExerciseTitle>{tr('Chạm vào những gì bạn nghe', 'Tap what you hear')}</ExerciseTitle>
      <div className="listen-controls">
        <SpeakButton text={exercise.audioText} lang={exercise.audioLang} big />
        <SpeakButton text={exercise.audioText} lang={exercise.audioLang} big slow />
      </div>
      <TileBoard
        tiles={exercise.tiles}
        lang={exercise.audioLang}
        locked={locked}
        speakTiles={false}
        onResponse={onResponse}
      />
      {!locked && (
        <button type="button" className="link-btn" onClick={onCantListen}>
          {tr('Không nghe được lúc này', 'Can’t listen now')}
        </button>
      )}
    </div>
  );
}
