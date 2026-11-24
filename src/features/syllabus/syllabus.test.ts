import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { emptyLevelProgress } from '../../stores/appState';
import { normalizeLevels, normalizeUnit } from '../levels/normalize';
import { CURRICULUM_DIRS, type CurriculumLang, type LevelUnit } from '../levels/types';
import type { Topic } from '../topics/types';
import {
  buildLevelSyllabus,
  currentLevelIndex,
  moduleProgress,
  moduleSizes,
  nextStepInLevel,
  topicLevelCode,
  unitSteps,
  weeksToFinish,
} from './syllabus';

const ROOT = join(__dirname, '../../../content');
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as unknown;
const levels = (lang: CurriculumLang) =>
  normalizeLevels((read(`${CURRICULUM_DIRS[lang]}/meta.json`) as { levels: unknown }).levels);
const units = (lang: CurriculumLang, level: string): LevelUnit[] =>
  (read(`${CURRICULUM_DIRS[lang]}/levels/${level}.json`) as unknown[]).map(
    (u) => normalizeUnit(u, level, lang)!,
  );
const topics = (read('topics/topics.json') as { topics: Topic[] }).topics;

describe('moduleSizes', () => {
  it('groups units in threes without a module of one', () => {
    expect(moduleSizes(10)).toEqual([4, 3, 3]);
    expect(moduleSizes(13)).toEqual([4, 3, 3, 3]);
    expect(moduleSizes(5)).toEqual([3, 2]);
    expect(moduleSizes(2)).toEqual([2]);
    expect(moduleSizes(0)).toEqual([]);
    for (let n = 1; n < 20; n++) expect(moduleSizes(n).reduce((a, b) => a + b, 0)).toBe(n);
  });
});

describe('topicLevelCode', () => {
  it('uses the first level of the range', () => {
    const t = { level: { cefr: 'A1–A2', hsk: 'HSK 2–3' } } as Topic;
    expect(topicLevelCode(t, 'en')).toBe('A1');
    expect(topicLevelCode(t, 'zh')).toBe('HSK2');
  });
});

describe('buildLevelSyllabus on the imported content', () => {
  it.each(['en', 'es', 'zh'] as const)('%s: every unit and topic has a place', (lang) => {
    const placedTopics = new Set<string>();
    for (const level of levels(lang)) {
      const u = units(lang, level.code);
      const s = buildLevelSyllabus(lang, level, u, topics);
      const ids = s.modules.flatMap((m) => m.units.map((x) => x.id));
      expect(ids).toEqual(u.map((x) => x.id));
      s.modules.forEach((m) => {
        expect(m.units.length).toBeGreaterThanOrEqual(2);
        m.topicIds.forEach((t) => placedTopics.add(t));
      });
      expect(s.totalMinutes).toBeGreaterThan(0);
    }
    expect(placedTopics.size).toBe(topics.length);
  });

  it('every unit starts with Learn and Practice', () => {
    const unit = units('en', 'A1')[0]!;
    const steps = unitSteps(unit).map((s) => s.kind);
    expect(steps.slice(0, 2)).toEqual(['learn', 'practice']);
  });
});

describe('progress and next step', () => {
  const [a1, a2] = levels('en');
  const s = buildLevelSyllabus('en', a1!, units('en', 'A1'), topics);

  it('points to the first unfinished unit, then the test, then the next level', () => {
    const p = emptyLevelProgress();
    expect(nextStepInLevel(s, p, a2!)).toMatchObject({ kind: 'unit', unitId: 'a1-1' });
    for (const m of s.modules) for (const u of m.units) p.units[u.id] = 1;
    expect(moduleProgress(s.modules[0]!, p).complete).toBe(true);
    expect(nextStepInLevel(s, p, a2!)).toEqual({ kind: 'test', level: 'A1' });
    p.tests.A1 = 0.8;
    expect(nextStepInLevel(s, p, a2!)).toEqual({ kind: 'next-level', level: 'A2' });
    expect(nextStepInLevel(s, p, null)).toEqual({ kind: 'finished' });
    expect(currentLevelIndex(levels('en'), p)).toBe(1);
  });

  it('estimates weeks from the daily goal', () => {
    expect(weeksToFinish(s, 10)).toBeGreaterThan(weeksToFinish(s, 50));
    expect(weeksToFinish({ ...s, totalMinutes: 0 }, 10)).toBe(1);
  });
});
