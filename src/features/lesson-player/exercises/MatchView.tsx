import { useEffect, useState } from 'react';
import { speak } from '../../../utils/speech';
import { shuffle } from '../../../utils/random';
import type { MatchExercise } from '../../exercises';
import { ExerciseTitle, type ViewProps } from './common';

type Side = 'left' | 'right';

export function MatchView({ exercise, targetLang, onResponse }: ViewProps<MatchExercise>) {
  const [rightOrder] = useState(() =>
    shuffle(
      exercise.pairs.map((_, i) => i),
      Math.random,
    ),
  );
  const [selected, setSelected] = useState<{ side: Side; index: number } | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState<{ left: number; right: number } | null>(null);

  useEffect(() => {
    if (matched.length === exercise.pairs.length) onResponse('done');
  }, [matched, exercise.pairs.length, onResponse]);

  useEffect(() => {
    if (!wrong) return;
    const t = window.setTimeout(() => setWrong(null), 500);
    return () => window.clearTimeout(t);
  }, [wrong]);

  const tap = (side: Side, index: number) => {
    if (matched.includes(index)) return;
    const pair = exercise.pairs[index];
    if (pair) {
      const text = side === 'left' ? pair.left : pair.right;
      const lang = side === 'left' ? exercise.leftLang : exercise.rightLang;
      if (lang === targetLang) speak(text, lang);
    }
    if (!selected || selected.side === side) {
      setSelected({ side, index });
      return;
    }
    if (selected.index === index) {
      setMatched((m) => [...m, index]);
    } else {
      setWrong(
        side === 'left'
          ? { left: index, right: selected.index }
          : { left: selected.index, right: index },
      );
    }
    setSelected(null);
  };

  const cls = (side: Side, index: number) => {
    if (matched.includes(index)) return 'is-done is-correct';
    if (wrong && wrong[side] === index) return 'is-wrong';
    if (selected?.side === side && selected.index === index) return 'is-selected';
    return '';
  };

  const column = (side: Side, order: number[]) => (
    <div className="match-col" role="group" aria-label={side === 'left' ? 'Words' : 'Translations'}>
      {order.map((index) => {
        const pair = exercise.pairs[index];
        if (!pair) return null;
        const text = side === 'left' ? pair.left : pair.right;
        return (
          <button
            key={index}
            type="button"
            className={`choice match-item ${cls(side, index)}`}
            disabled={matched.includes(index)}
            aria-pressed={selected?.side === side && selected.index === index}
            onClick={() => tap(side, index)}
            lang={side === 'left' ? exercise.leftLang : exercise.rightLang}
          >
            {text}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="exercise">
      <ExerciseTitle>Tap the matching pairs</ExerciseTitle>
      <div className="match-grid">
        {column(
          'left',
          exercise.pairs.map((_, i) => i),
        )}
        {column('right', rightOrder)}
      </div>
    </div>
  );
}
