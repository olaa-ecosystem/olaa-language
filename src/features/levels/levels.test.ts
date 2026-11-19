import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { finishLevelTest, finishUnit, initialState, levelProgress } from '../../stores/appState';
import { detectEvents } from '../../services/habitEvents';
import { gradeExercise } from '../exercises';
import { topicExercises } from '../topics/topics';
import type { Topic } from '../topics/types';
import { normalizeLevels, normalizeUnit } from './normalize';
import { LEVEL_TEST_SIZE, levelTestExercises, unitExercises } from './toExercises';
import { CURRICULUM_DIRS, type CurriculumLang, type LevelUnit } from './types';
import { canTakeTest, levelState, unitStates } from './unlock';

const ROOT = join(__dirname, '../../../content');
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as unknown;
const units = (lang: CurriculumLang, level: string): LevelUnit[] =>
  (read(`${CURRICULUM_DIRS[lang]}/levels/${level}.json`) as unknown[]).map(
    (u) => normalizeUnit(u, level, lang)!,
  );
const today = '2026-11-19';

describe('curriculum exercises', () => {
  it.each(['en', 'es', 'zh'] as const)(
    '%s: every unit becomes exercises with unique ids',
    (lang) => {
      const meta = read(`${CURRICULUM_DIRS[lang]}/meta.json`) as { levels: unknown };
      for (const level of normalizeLevels(meta.levels)) {
        for (const unit of units(lang, level.code)) {
          const all = [...unitExercises(unit, lang), ...unitExercises(unit, lang, true)];
          expect(all).toHaveLength(unit.items.length + unit.challenge.length);
          expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
          for (const e of all) {
            // The answer key itself must grade as correct.
            if (e.kind === 'text' || e.kind === 'build')
              expect(gradeExercise(e, e.accepted[0]!).correct, `${e.id}`).toBe(true);
            if (e.kind === 'dictation') expect(gradeExercise(e, e.audioText).correct).toBe(true);
          }
        }
      }
    },
  );

  it('builds a level test from graded questions across units', () => {
    const list = units('en', 'A1');
    const test = levelTestExercises(list, 'en', 42);
    expect(test).toHaveLength(LEVEL_TEST_SIZE);
    expect(test.every((e) => ['choice', 'text', 'build', 'dictation'].includes(e.kind))).toBe(true);
    expect(new Set(test.map((e) => e.lessonId)).size).toBeGreaterThan(5);
  });

  it('grades a correct choice as correct', () => {
    const choice = unitExercises(units('zh', 'HSK1')[0]!, 'zh').find((e) => e.kind === 'choice');
    expect(choice?.kind).toBe('choice');
    if (choice?.kind === 'choice') {
      expect(gradeExercise(choice, String(choice.answerIndex)).correct).toBe(true);
    }
  });
});

describe('unlocking', () => {
  const levels = normalizeLevels((read('english/meta.json') as { levels: unknown }).levels);
  const ids = ['u1', 'u2', 'u3'];

  it('opens the first level and unit only, at the start', () => {
    const p = levelProgress(initialState(), 'en');
    expect(levelState(levels, p, 0)).toBe('open');
    expect(levelState(levels, p, 1)).toBe('locked');
    expect(canTakeTest(levels, p, 1)).toBe(true);
    expect(canTakeTest(levels, p, 2)).toBe(false);
    expect(unitStates(ids, p, 'A1', true)).toEqual({ u1: 'open', u2: 'locked', u3: 'locked' });
  });

  it('opens the next unit after one is finished, and everything after a passed test', () => {
    const unit = units('en', 'A1')[0]!;
    let s = finishUnit(initialState(), { lang: 'en', unit, score: 0.8, xp: 10, today });
    let p = levelProgress(s, 'en');
    expect(unitStates([unit.id, 'x'], p, 'A1', true)).toEqual({ [unit.id]: 'done', x: 'open' });
    expect(Object.keys(p.cards)).toHaveLength(unit.vocab.length);

    s = finishLevelTest(s, { lang: 'en', level: 'A1', score: 0.6, xp: 0, today });
    expect(levelState(levels, levelProgress(s, 'en'), 1)).toBe('locked');
    s = finishLevelTest(s, { lang: 'en', level: 'A1', score: 0.75, xp: 30, today });
    p = levelProgress(s, 'en');
    expect(levelState(levels, p, 0)).toBe('done');
    expect(levelState(levels, p, 1)).toBe('open');
    expect(unitStates(ids, p, 'A1', true)).toEqual({ u1: 'open', u2: 'open', u3: 'open' });
  });

  it('sends a lesson-completed event the first time a unit is finished', () => {
    const unit = units('es', 'A1')[0]!;
    const before = initialState();
    const after = finishUnit(before, { lang: 'es', unit, score: 1, xp: 10, today });
    expect(detectEvents(before, after, today)).toContainEqual({
      type: 'language.lesson.completed',
      date: today,
      payload: { courseId: 'es-vi', lessonId: unit.id },
    });
    const again = finishUnit(after, { lang: 'es', unit, score: 1, xp: 10, today });
    expect(
      detectEvents(after, again, today).filter((e) => e.type === 'language.lesson.completed'),
    ).toEqual([]);
  });
});

describe('topics', () => {
  const topics = (read('topics/topics.json') as { topics: Topic[] }).topics;

  it('has 15 topics', () => expect(topics).toHaveLength(15));

  it.each(['en', 'es', 'zh'] as const)('%s: every topic gives answerable practice', (lang) => {
    for (const topic of topics) {
      const list = topicExercises(topic, lang, 1);
      expect(list.length).toBeGreaterThanOrEqual(10 + 4 + 2);
      for (const e of list) {
        if (e.kind === 'choice') expect(e.options[e.answerIndex]).toBeTruthy();
        if (e.kind === 'text') expect(gradeExercise(e, e.accepted[0]!).correct).toBe(true);
        if (e.kind === 'say') expect(e.text.trim()).not.toBe('');
      }
    }
  });
});
