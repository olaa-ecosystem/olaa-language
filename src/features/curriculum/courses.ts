import type { LanguageCode } from '../../types';
import { UNITS } from './content';
import type { Course, CourseId, Lesson, Phrase, Unit } from './types';
import { tr } from '../../i18n/locale';

export const COURSES: Record<CourseId, Course> = {
  'en-from-vi': {
    id: 'en-from-vi',
    get title() {
      return tr('Tiếng Anh', 'English');
    },
    get subtitle() {
      return tr('Học tiếng Anh từ tiếng Việt', 'Learn English from Vietnamese');
    },
    targetLang: 'en',
    baseLang: 'vi',
    mascot: 'whale',
    units: UNITS,
  },
  'vi-from-en': {
    id: 'vi-from-en',
    get title() {
      return tr('Tiếng Việt', 'Vietnamese');
    },
    get subtitle() {
      return tr('Học tiếng Việt từ tiếng Anh', 'Learn Vietnamese from English');
    },
    targetLang: 'vi',
    baseLang: 'en',
    mascot: 'frog',
    units: UNITS,
  },
};

export function isCourseId(value: unknown): value is CourseId {
  return typeof value === 'string' && value in COURSES;
}

export function getCourse(id: CourseId): Course {
  return COURSES[id];
}

export function allLessons(course: Course): Lesson[] {
  return course.units.flatMap((u) => u.lessons);
}

export function findLesson(
  course: Course,
  lessonId: string,
): { unit: Unit; lesson: Lesson } | null {
  for (const unit of course.units) {
    const lesson = unit.lessons.find((l) => l.id === lessonId);
    if (lesson) return { unit, lesson };
  }
  return null;
}

/** Canonical text first, then accepted alternatives. */
export function acceptedAnswers(phrase: Phrase, lang: LanguageCode): string[] {
  const extra = lang === 'en' ? phrase.acceptEn : phrase.acceptVi;
  return [phrase[lang], ...(extra ?? [])];
}
