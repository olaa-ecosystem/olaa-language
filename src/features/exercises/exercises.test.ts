import { COURSES, allLessons } from '../curriculum';
import {
  MAX_EXERCISES_PER_LESSON,
  generateLessonExercises,
  generatePracticeExercises,
  gradeExercise,
  gradeText,
  toTiles,
} from '.';
import type { BuildExercise, Exercise } from './types';
import { normalize } from '../../utils/text';

describe('gradeText', () => {
  it('accepts canonical and alternative answers, ignoring case and punctuation', () => {
    expect(gradeText('hello, i am lan', ['Hello, I am Lan.']).correct).toBe(true);
    expect(gradeText("Hi I'm Lan", ['Hello, I am Lan.', "Hi, I'm Lan."]).correct).toBe(true);
  });

  it('accepts missing Vietnamese accents with a note', () => {
    const result = gradeText('toi an com', ['Tôi ăn cơm.']);
    expect(result).toMatchObject({ correct: true, note: 'accents' });
  });

  it('forgives a single typo on longer answers', () => {
    expect(gradeText('I lik apples', ['I like apples.'])).toMatchObject({
      correct: true,
      note: 'typo',
    });
  });

  it('rejects wrong and empty answers', () => {
    expect(gradeText('I eat bread', ['I eat rice.']).correct).toBe(false);
    expect(gradeText('   ', ['I eat rice.']).correct).toBe(false);
  });
});

describe('toTiles', () => {
  it('lowercases sentence starts but keeps I and names', () => {
    expect(toTiles('Hello, I am Lan.')).toEqual(['hello', 'I', 'am', 'Lan']);
  });
});

describe.each(Object.values(COURSES))('lesson generation for $id', (course) => {
  const lessons = allLessons(course);

  it.each(lessons.map((l) => [l.id, l] as const))('%s produces a solvable session', (_, lesson) => {
    const exercises = generateLessonExercises(course, lesson, 0, 42);
    expect(exercises.length).toBeGreaterThanOrEqual(8);
    expect(exercises.length).toBeLessThanOrEqual(MAX_EXERCISES_PER_LESSON);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
    exercises.forEach((e) => expect(gradeExercise(e, solve(e)).correct).toBe(true));
  });

  it('is deterministic for a given seed', () => {
    const lesson = lessons[0]!;
    expect(generateLessonExercises(course, lesson, 1, 7)).toEqual(
      generateLessonExercises(course, lesson, 1, 7),
    );
  });
});

describe('practice generation', () => {
  it('returns nothing when no lessons are complete', () => {
    expect(generatePracticeExercises(COURSES['en-from-vi'], [], 1)).toEqual([]);
  });

  it('draws only from completed lessons', () => {
    const exercises = generatePracticeExercises(COURSES['vi-from-en'], ['u1-greetings'], 3);
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.every((e) => e.lessonId === 'u1-greetings')).toBe(true);
  });
});

/** Produces a correct response for any exercise, proving each one is answerable. */
function solve(e: Exercise): string {
  switch (e.kind) {
    case 'select':
      return e.answer;
    case 'picture':
      return e.answer;
    case 'build':
    case 'listen':
      return solveTiles(e);
    case 'type':
      return e.accepted[0]!;
    case 'match':
      return '';
  }
}

function solveTiles(e: Pick<BuildExercise, 'tiles' | 'accepted'>): string {
  const remaining = [...e.tiles];
  const answer = toTiles(e.accepted[0]!);
  for (const token of answer) {
    const idx = remaining.findIndex((t) => normalize(t) === normalize(token));
    expect(idx, `tile "${token}" missing`).toBeGreaterThanOrEqual(0);
    remaining.splice(idx, 1);
  }
  return answer.join(' ');
}
