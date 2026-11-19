import { COURSES, findLesson } from '../features/curriculum';
import { generateLessonExercises } from '../features/exercises';
import {
  applyCardReview,
  completeOnboarding,
  courseProgress,
  finishLesson,
  initialState,
  loseHeart,
  recordMistake,
  resolveMistake,
} from './appState';

const course = COURSES['en-from-vi'];
const { lesson } = findLesson(course, 'u1-animals')!;
const today = '2026-11-19';

describe('app state actions', () => {
  it('onboards a learner', () => {
    const state = completeOnboarding(initialState(), {
      name: '  Mai ',
      buddy: 'frog',
      courseId: course.id,
      dailyGoalXp: 30,
    });
    expect(state.profile).toEqual({ name: 'Mai', buddy: 'frog' });
    expect(state.activeCourseId).toBe(course.id);
    expect(state.dailyGoalXp).toBe(30);
  });

  it('finishing a lesson levels it up, awards XP, starts a streak and adds flashcards', () => {
    const state = finishLesson(initialState(), { course, lesson, xp: 15, today });
    const progress = courseProgress(state, course.id);
    expect(progress.lessonLevels[lesson.id]).toBe(1);
    expect(state.totalXp).toBe(15);
    expect(state.xpByDay[today]).toBe(15);
    expect(state.streak.count).toBe(1);
    expect(Object.keys(progress.cards)).toHaveLength(lesson.words.length);
    expect(progress.cards['u1-animals:cat']).toMatchObject({ front: 'cat', back: 'con mèo' });
  });

  it('caps lesson level at 5 and keeps flashcard progress on repeats', () => {
    let state = initialState();
    for (let i = 0; i < 7; i++) state = finishLesson(state, { course, lesson, xp: 10, today });
    expect(courseProgress(state, course.id).lessonLevels[lesson.id]).toBe(5);
    state = applyCardReview(state, course.id, 'u1-animals:cat', 'easy', today);
    state = finishLesson(state, { course, lesson, xp: 10, today });
    expect(courseProgress(state, course.id).cards['u1-animals:cat']!.box).toBe(3);
  });

  it('records and resolves mistakes, ignoring match exercises', () => {
    const exercises = generateLessonExercises(course, lesson, 0, 1);
    const match = exercises.find((e) => e.kind === 'match')!;
    const other = exercises.find((e) => e.kind !== 'match')!;
    let state = recordMistake(initialState(), course.id, match);
    expect(courseProgress(state, course.id).mistakes).toEqual({});
    state = recordMistake(state, course.id, other);
    expect(Object.keys(courseProgress(state, course.id).mistakes)).toEqual([other.id]);
    state = resolveMistake(state, course.id, other.id);
    expect(courseProgress(state, course.id).mistakes).toEqual({});
  });

  it('loses hearts', () => {
    expect(loseHeart(initialState(), 1000).hearts.current).toBe(4);
  });
});
