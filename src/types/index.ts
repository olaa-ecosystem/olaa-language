export type LanguageCode = 'en' | 'vi';

export const MASCOT_IDS = [
  'bear',
  'cat',
  'dog',
  'elephant',
  'fish',
  'frog',
  'giraffe',
  'rabbit',
  'turtle',
  'whale',
] as const;

export type MascotId = (typeof MASCOT_IDS)[number];
