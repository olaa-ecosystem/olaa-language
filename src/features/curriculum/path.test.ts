import { COURSES, allLessons } from './courses';
import { courseCompletion, lessonStatuses, nextLessonId } from './path';

const course = COURSES['en-from-vi'];
const [first, second, third] = allLessons(course);

describe('learning path', () => {
  it('unlocks only the first lesson for a new learner', () => {
    const statuses = lessonStatuses(course, {});
    expect(statuses[first!.id]).toBe('available');
    expect(statuses[second!.id]).toBe('locked');
    expect(nextLessonId(course, {})).toBe(first!.id);
  });

  it('unlocks the next lesson after completion', () => {
    const levels = { [first!.id]: 1 };
    const statuses = lessonStatuses(course, levels);
    expect(statuses[first!.id]).toBe('completed');
    expect(statuses[second!.id]).toBe('available');
    expect(statuses[third!.id]).toBe('locked');
    expect(courseCompletion(course, levels)).toBeCloseTo(1 / allLessons(course).length);
  });
});

describe('content integrity', () => {
  it('has unique lesson ids and enough material per lesson', () => {
    const lessons = allLessons(course);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    for (const lesson of lessons) {
      expect(lesson.words.length).toBeGreaterThanOrEqual(4);
      expect(lesson.sentences.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('uses every mascot as a picture word', () => {
    const images = allLessons(course).flatMap((l) => l.words.map((w) => w.image).filter(Boolean));
    expect(new Set(images).size).toBe(10);
  });
});
