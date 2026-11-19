import type { MascotId } from '../../types';

export interface MascotInfo {
  id: MascotId;
  name: string;
  /** Short personality line shown when choosing a buddy. */
  tagline: string;
  /** Accent colour taken from the artwork, used for tinted backgrounds. */
  tint: string;
}

export const MASCOTS: Record<MascotId, MascotInfo> = {
  bear: {
    id: 'bear',
    name: 'Bobo the Bear',
    tagline: 'Big hugs for every right answer.',
    tint: '#f6e1cf',
  },
  cat: {
    id: 'cat',
    name: 'Mimi the Cat',
    tagline: 'Curious about every new word.',
    tint: '#fde3cc',
  },
  dog: {
    id: 'dog',
    name: 'Lucky the Dog',
    tagline: 'Never misses a daily walk — or lesson.',
    tint: '#fdf0c4',
  },
  elephant: {
    id: 'elephant',
    name: 'Ellie the Elephant',
    tagline: 'Never forgets a single word.',
    tint: '#dcedf8',
  },
  fish: {
    id: 'fish',
    name: 'Bubbles the Fish',
    tagline: 'Dives deep into grammar.',
    tint: '#fdf0c4',
  },
  frog: {
    id: 'frog',
    name: 'Hop the Frog',
    tagline: 'Leaps from level to level.',
    tint: '#e5f2d0',
  },
  giraffe: {
    id: 'giraffe',
    name: 'Gigi the Giraffe',
    tagline: 'Always reaching higher.',
    tint: '#fdecc8',
  },
  rabbit: {
    id: 'rabbit',
    name: 'Momo the Rabbit',
    tagline: 'Quick ears, quicker learning.',
    tint: '#fde0d8',
  },
  turtle: {
    id: 'turtle',
    name: 'Toto the Turtle',
    tagline: 'Slow and steady keeps the streak.',
    tint: '#d6eef2',
  },
  whale: {
    id: 'whale',
    name: 'Wally the Whale',
    tagline: 'Makes a big splash with practice.',
    tint: '#d8e8f5',
  },
};

export const CHEERS = [
  'Amazing!',
  'You got it!',
  'Nice work!',
  'Brilliant!',
  'Keep it up!',
  'Wonderful!',
] as const;

export const COMFORTS = [
  "Almost! Let's try again later.",
  "Don't worry — mistakes help you learn.",
  "So close! You'll get it next time.",
] as const;
