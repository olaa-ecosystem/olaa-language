import { allLessons } from './courses';
import type { Course } from './types';

export type LessonStatus = 'locked' | 'available' | 'completed';

/** Lessons unlock in order: each needs the previous one finished at least once. */
export function lessonStatuses(
  course: Course,
  lessonLevels: Record<string, number>,
): Record<string, LessonStatus> {
  const result: Record<string, LessonStatus> = {};
  let previousDone = true;
  for (const lesson of allLessons(course)) {
    const level = lessonLevels[lesson.id] ?? 0;
    result[lesson.id] = level > 0 ? 'completed' : previousDone ? 'available' : 'locked';
    previousDone = level > 0;
  }
  return result;
}

export function nextLessonId(course: Course, lessonLevels: Record<string, number>): string | null {
  const statuses = lessonStatuses(course, lessonLevels);
  return allLessons(course).find((l) => statuses[l.id] === 'available')?.id ?? null;
}

export function courseCompletion(course: Course, lessonLevels: Record<string, number>): number {
  const lessons = allLessons(course);
  const done = lessons.filter((l) => (lessonLevels[l.id] ?? 0) > 0).length;
  return lessons.length ? done / lessons.length : 0;
}
