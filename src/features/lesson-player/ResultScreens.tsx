import type { CSSProperties, ReactNode } from 'react';
import { BoltIcon, HeartIcon, StarIcon } from '../../components/Icons';
import { Mascot } from '../../components/mascots';
import type { MascotId } from '../../types';
import type { SessionSummary } from './session';

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function SessionComplete({
  buddy,
  title,
  xp,
  summary,
  extra,
  onContinue,
}: {
  buddy: MascotId;
  title: string;
  xp: number;
  summary: SessionSummary;
  extra?: ReactNode;
  onContinue: () => void;
}) {
  return (
    <div className="result-screen">
      <div className="result-screen__hero">
        <div className="confetti" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        <Mascot id={buddy} size={200} mood="happy" label="Your buddy celebrating" />
      </div>
      <h1>{title}</h1>
      {summary.perfect && <p className="result-screen__sub">Perfect — no mistakes!</p>}
      <div className="result-stats">
        <div className="result-stat result-stat--xp">
          <span>Total XP</span>
          <strong>
            <BoltIcon size={20} /> {xp}
          </strong>
        </div>
        <div className="result-stat result-stat--acc">
          <span>Accuracy</span>
          <strong>
            <StarIcon size={20} /> {Math.round(summary.accuracy * 100)}%
          </strong>
        </div>
        <div className="result-stat result-stat--time">
          <span>Time</span>
          <strong>{formatDuration(summary.durationMs)}</strong>
        </div>
      </div>
      {extra}
      <button
        type="button"
        className="btn btn--block result-screen__cta"
        onClick={onContinue}
        autoFocus
      >
        Continue
      </button>
    </div>
  );
}

export function OutOfHearts({
  buddy,
  msUntilNext,
  onPractice,
  onExit,
}: {
  buddy: MascotId;
  msUntilNext: number | null;
  onPractice: () => void;
  onExit: () => void;
}) {
  const minutes = msUntilNext === null ? 0 : Math.ceil(msUntilNext / 60000);
  return (
    <div className="result-screen">
      <Mascot id={buddy} size={180} mood="sad" />
      <h1>You ran out of hearts</h1>
      <p className="result-screen__sub">
        <HeartIcon size={18} style={{ color: 'var(--heart)', verticalAlign: '-3px' }} /> Next heart
        in {minutes} min. Practise what you know to earn one now!
      </p>
      <button
        type="button"
        className="btn btn--block result-screen__cta"
        onClick={onPractice}
        autoFocus
      >
        Practise to earn hearts
      </button>
      <button type="button" className="btn btn--ghost btn--block" onClick={onExit}>
        Back to path
      </button>
    </div>
  );
}
