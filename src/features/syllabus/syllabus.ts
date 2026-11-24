/**
 * Structured curriculum (Ecosystem PRD v1.0 §6.1 course → level → module → unit → step;
 * PRD 01 REQ-01-001, REQ-01-011). The content export gives units per level; this module
 * arranges them into a syllabus a learner can follow week by week:
 *
 * - each level is split into modules of about three units, ending in a checkpoint;
 * - each themed topic (15) is placed in the module where its level starts, as a real-life
 *   lesson that reuses the module's grammar;
 * - each unit has four steps: Learn (theory, table, words) → Practice → Read & listen → Challenge;
 * - the level ends with the level test (70 % to pass).
 *
 * Pure: everything is computed from content and progress, nothing is stored.
 */
import type { LevelProgress } from '../../stores/appState';
import type { Topic } from '../topics/types';
import { LEVEL_TEST_PASS } from '../levels/toExercises';
import type { Bi, CurriculumLang, LevelMeta, LevelUnit } from '../levels/types';

export type StepKind = 'learn' | 'practice' | 'read' | 'challenge';

export interface UnitStep {
  kind: StepKind;
  label: Bi;
  /** Theory blocks + words (learn), questions (practice, challenge), passages (read). */
  count: number;
  minutes: number;
}

export interface SyllabusUnit {
  id: string;
  title: Bi;
  steps: UnitStep[];
  minutes: number;
  newWords: number;
}

export interface SyllabusModule {
  id: string;
  number: number;
  /** "Units 1–3" plus the first unit's theme. */
  title: Bi;
  units: SyllabusUnit[];
  topicIds: string[];
  minutes: number;
}

export interface LevelSyllabus {
  lang: CurriculumLang;
  level: LevelMeta;
  modules: SyllabusModule[];
  totalMinutes: number;
  totalWords: number;
}

/** Seconds per question, and minutes to read a theory block, for time estimates. */
const SECONDS_PER_ITEM = 25;
const MINUTES_PER_THEORY = 1.5;
const MINUTES_PER_PASSAGE = 4;
/** A topic lesson: words, sentences, gap fills, translations and speaking. */
export const TOPIC_MINUTES = 15;
export const UNITS_PER_MODULE = 3;

const mins = (n: number) => Math.max(1, Math.round(n));

export function unitSteps(unit: LevelUnit): UnitStep[] {
  const steps: UnitStep[] = [
    {
      kind: 'learn',
      label: ['Học lý thuyết và từ mới', 'Learn the rule and words'],
      count: unit.theory.length + unit.vocab.length,
      minutes: mins(unit.theory.length * MINUTES_PER_THEORY + unit.vocab.length * 0.25),
    },
    {
      kind: 'practice',
      label: ['Luyện tập', 'Practice'],
      count: unit.items.length,
      minutes: mins((unit.items.length * SECONDS_PER_ITEM) / 60),
    },
  ];
  if (unit.passage)
    steps.push({
      kind: 'read',
      label: ['Đọc và nghe', 'Read and listen'],
      count: 1,
      minutes: MINUTES_PER_PASSAGE,
    });
  if (unit.challenge.length)
    steps.push({
      kind: 'challenge',
      label: ['Thử thách (tuỳ chọn)', 'Challenge (optional)'],
      count: unit.challenge.length,
      minutes: mins((unit.challenge.length * SECONDS_PER_ITEM) / 60),
    });
  return steps;
}

/** Split `n` units into groups of about `size`, never leaving a module of one. */
export function moduleSizes(n: number, size = UNITS_PER_MODULE): number[] {
  if (n <= 0) return [];
  const count = Math.max(1, Math.round(n / size));
  const base = Math.floor(n / count);
  const extra = n % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Index of the level where a topic starts ("A1–A2" → A1, "HSK 2–3" → HSK2). */
export function topicLevelCode(topic: Topic, lang: CurriculumLang): string {
  if (lang === 'zh') {
    const n = /\d/.exec(topic.level.hsk)?.[0] ?? '1';
    return `HSK${n}`;
  }
  return /[ABC][12]/.exec(topic.level.cefr)?.[0] ?? 'A1';
}

export function buildLevelSyllabus(
  lang: CurriculumLang,
  level: LevelMeta,
  units: LevelUnit[],
  topics: Topic[],
): LevelSyllabus {
  const sizes = moduleSizes(units.length);
  const levelTopics = topics.filter((t) => topicLevelCode(t, lang) === level.code);
  let start = 0;
  const modules: SyllabusModule[] = sizes.map((size, i) => {
    const slice = units.slice(start, start + size);
    const from = start + 1;
    start += size;
    const su: SyllabusUnit[] = slice.map((u) => {
      const steps = unitSteps(u);
      return {
        id: u.id,
        title: u.title,
        steps,
        minutes: steps.reduce((n, s) => n + s.minutes, 0),
        newWords: u.vocab.length,
      };
    });
    // Topics are spread over the modules in order, one or more per module.
    const topicIds = levelTopics
      .filter((_, k) => Math.floor((k * sizes.length) / Math.max(1, levelTopics.length)) === i)
      .map((t) => t.id);
    const range = size > 1 ? `${from}–${from + size - 1}` : `${from}`;
    const theme = slice[0]?.title ?? ['', ''];
    return {
      id: `${level.code}-m${i + 1}`,
      number: i + 1,
      title: [`Bài ${range} · ${theme[0]}`, `Units ${range} · ${theme[1]}`],
      units: su,
      topicIds,
      minutes: su.reduce((n, u) => n + u.minutes, 0) + topicIds.length * TOPIC_MINUTES,
    };
  });
  return {
    lang,
    level,
    modules,
    totalMinutes: modules.reduce((n, m) => n + m.minutes, 0),
    totalWords: units.reduce((n, u) => n + u.vocab.length, 0),
  };
}

/**
 * Weeks to finish a level at a daily pace. One XP is roughly one minute of study (a unit gives
 * 10–15 XP for ~10–15 minutes), so the daily XP goal doubles as minutes per day.
 */
export function weeksToFinish(syllabus: LevelSyllabus, minutesPerDay: number, daysPerWeek = 5) {
  const perWeek = Math.max(1, minutesPerDay) * Math.max(1, Math.min(7, daysPerWeek));
  return Math.max(1, Math.ceil(syllabus.totalMinutes / perWeek));
}

export interface ModuleProgress {
  done: number;
  total: number;
  /** Every unit of the module finished. */
  complete: boolean;
}

export function moduleProgress(module: SyllabusModule, progress: LevelProgress): ModuleProgress {
  const done = module.units.filter((u) => progress.units[u.id] !== undefined).length;
  return { done, total: module.units.length, complete: done === module.units.length };
}

export type NextStep =
  | { kind: 'unit'; unitId: string; title: Bi }
  | { kind: 'test'; level: string }
  | { kind: 'next-level'; level: string }
  | { kind: 'finished' };

/** What to study next in a level: the first unfinished unit, else the level test. */
export function nextStepInLevel(
  syllabus: LevelSyllabus,
  progress: LevelProgress,
  nextLevel: LevelMeta | null,
): NextStep {
  for (const m of syllabus.modules)
    for (const u of m.units)
      if (progress.units[u.id] === undefined) return { kind: 'unit', unitId: u.id, title: u.title };
  if ((progress.tests[syllabus.level.code] ?? 0) < LEVEL_TEST_PASS)
    return { kind: 'test', level: syllabus.level.code };
  return nextLevel ? { kind: 'next-level', level: nextLevel.code } : { kind: 'finished' };
}

/** The level a learner is working in: the first one whose test is not passed yet. */
export function currentLevelIndex(levels: LevelMeta[], progress: LevelProgress): number {
  const i = levels.findIndex((l) => (progress.tests[l.code] ?? 0) < LEVEL_TEST_PASS);
  return i < 0 ? Math.max(0, levels.length - 1) : i;
}
