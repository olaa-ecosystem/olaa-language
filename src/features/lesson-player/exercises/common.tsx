import { useEffect, type ReactNode } from 'react';
import { Mascot } from '../../../components/mascots';
import { SpeakerIcon, TurtleIcon } from '../../../components/Icons';
import type { MascotId } from '../../../types';
import { speak, type SpeechLang } from '../../../utils/speech';
import type { Exercise, GradeResult } from '../../exercises';

export const LANGUAGE_NAMES: Record<SpeechLang, string> = {
  en: 'English',
  vi: 'Vietnamese',
  es: 'Spanish',
  zh: 'Chinese',
};

export interface ViewProps<E extends Exercise> {
  exercise: E;
  buddy: MascotId;
  targetLang: SpeechLang;
  /** True once the answer has been checked. */
  locked: boolean;
  result: GradeResult | null;
  response: string | null;
  onResponse: (value: string | null) => void;
}

export function SpeakButton({
  text,
  lang,
  slow,
  big,
  label,
}: {
  text: string;
  lang: SpeechLang;
  slow?: boolean;
  big?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={`speak-btn ${big ? 'speak-btn--big' : ''} ${slow ? 'speak-btn--slow' : ''}`}
      onClick={() => speak(text, lang, slow)}
      aria-label={label ?? (slow ? 'Play slowly' : 'Play audio')}
    >
      {slow ? <TurtleIcon size={big ? 30 : 20} /> : <SpeakerIcon size={big ? 40 : 20} />}
    </button>
  );
}

/** The buddy "says" the prompt in a speech bubble. */
export function BuddyPrompt({
  buddy,
  text,
  lang,
  speakable,
}: {
  buddy: MascotId;
  text: string;
  lang: SpeechLang;
  speakable: boolean;
}) {
  useEffect(() => {
    if (speakable) speak(text, lang);
  }, [speakable, text, lang]);

  return (
    <div className="buddy-prompt">
      <Mascot id={buddy} size={104} />
      <div className="speech" lang={lang}>
        {speakable && <SpeakButton text={text} lang={lang} />}
        <span>{text}</span>
      </div>
    </div>
  );
}

export function ExerciseTitle({ children }: { children: ReactNode }) {
  return <h2 className="exercise-title">{children}</h2>;
}

/** Number-key shortcuts (1–9) for choice exercises. */
export function useNumberKeys(count: number, onPick: (index: number) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= count) onPick(n - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [count, onPick, enabled]);
}

export function choiceState(
  option: string,
  response: string | null,
  answer: string,
  locked: boolean,
): string {
  if (!locked) return option === response ? 'is-selected' : '';
  if (option === answer) return 'is-correct';
  if (option === response) return 'is-wrong';
  return '';
}
