/**
 * Upgrades saved progress (this device or the account copy) to the current version.
 *
 * Version 1 → 2 (2026-11-21, owner decision): the old 9-lesson courses ("English for
 * Vietnamese speakers", "Vietnamese for English speakers") and the mascots were removed.
 * Their progress (lesson levels, word cards, mistakes) and the chosen study buddy are dropped.
 * Everything else is kept: name, XP, streak, daily goal, sound and the level curriculum.
 */
import type { CurriculumLang } from '../features/levels/types';
import {
  emptyLevelProgress,
  initialState,
  STATE_VERSION,
  type AppState,
  type LevelProgress,
} from './appState';

type Raw = Record<string, unknown>;
const LANGS: CurriculumLang[] = ['en', 'es', 'zh'];
const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null;

function upgradeLevels(raw: unknown): AppState['levels'] {
  const out: AppState['levels'] = {};
  if (!isObj(raw)) return out;
  for (const lang of LANGS) {
    const p = raw[lang];
    if (isObj(p)) out[lang] = { ...emptyLevelProgress(), ...(p as Partial<LevelProgress>) };
  }
  return out;
}

/** The current state for `raw`, or null when it is not recognisable progress. */
export function migrateState(raw: unknown): AppState | null {
  if (!isObj(raw)) return null;
  const version = raw.version;
  if (version === STATE_VERSION) {
    const base = { ...initialState(), ...(raw as Partial<AppState>) };
    return { ...base, levels: upgradeLevels(raw.levels) };
  }
  if (version === 1) {
    const base = initialState();
    const profile =
      isObj(raw.profile) && typeof raw.profile.name === 'string'
        ? { name: raw.profile.name }
        : null;
    const lang = LANGS.includes(raw.levelLang as CurriculumLang)
      ? (raw.levelLang as CurriculumLang)
      : 'en';
    return {
      ...base,
      profile,
      levelLang: lang,
      dailyGoalXp: typeof raw.dailyGoalXp === 'number' ? raw.dailyGoalXp : base.dailyGoalXp,
      soundOn: typeof raw.soundOn === 'boolean' ? raw.soundOn : base.soundOn,
      streak: isObj(raw.streak) ? (raw.streak as unknown as AppState['streak']) : base.streak,
      totalXp: typeof raw.totalXp === 'number' ? raw.totalXp : 0,
      xpByDay: isObj(raw.xpByDay) ? (raw.xpByDay as AppState['xpByDay']) : {},
      lessonsCompleted: typeof raw.lessonsCompleted === 'number' ? raw.lessonsCompleted : 0,
      listenOffUntil: typeof raw.listenOffUntil === 'number' ? raw.listenOffUntil : 0,
      levels: upgradeLevels(raw.levels),
    };
  }
  return null; // Newer than this app, or unknown.
}

/** Versions this app can read (and upgrade). */
export const READABLE_VERSIONS = [1, STATE_VERSION];
