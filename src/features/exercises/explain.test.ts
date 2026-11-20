import type { BuildExercise, ListenExercise, SelectExercise, TypeExercise } from './types';
import { explainMistake } from './explain';
import { gradeExercise } from './grade';
import { setLocale } from '../../i18n/locale';

// These checks were written against the English interface.
beforeAll(() => setLocale('en'));
afterAll(() => setLocale('vi'));

const base = { lessonId: 'l', promptLang: 'vi', answerLang: 'en' } as const;
const build: BuildExercise = {
  ...base,
  id: 'b',
  kind: 'build',
  prompt: 'Tôi là học sinh',
  tiles: [],
  accepted: ['I am a student'],
};
const type: TypeExercise = {
  ...base,
  id: 't',
  kind: 'type',
  prompt: 'Chào buổi sáng',
  accepted: ['Good morning'],
};
const listen: ListenExercise = {
  id: 'li',
  lessonId: 'l',
  kind: 'listen',
  audioText: 'I like cats',
  audioLang: 'en',
  tiles: [],
  accepted: ['I like cats'],
};
const select: SelectExercise = {
  id: 's',
  lessonId: 'l',
  kind: 'select',
  prompt: 'cat',
  promptLang: 'en',
  optionLang: 'vi',
  options: [],
  answer: 'con mèo',
};

const why = (e: Parameters<typeof explainMistake>[0], r: string) =>
  explainMistake(e, r, gradeExercise(e, r));

describe('explainMistake', () => {
  it('says nothing for correct answers', () => {
    expect(why(build, 'I am a student')).toBeNull();
  });

  it('spots word order', () => {
    expect(why(build, 'am I a student')).toEqual({
      category: 'word-order',
      why: 'You have the right words in the wrong order. It is “I am a student”.',
    });
  });

  it('lists missing and extra words', () => {
    expect(why(build, 'I am student the')).toEqual({
      category: 'missing-words',
      why: 'Missing “a”. Not needed: “the”.',
    });
  });

  it('separates spelling slips from wrong translations', () => {
    expect(why(type, 'God mornng')).toMatchObject({ category: 'spelling' });
    expect(why(type, 'Gud morming')).toEqual({
      category: 'spelling',
      why: 'Close! Check the spelling of “good”, “morning”.',
    });
    expect(why(type, 'Hello there')).toEqual({
      category: 'translation',
      why: 'A correct translation is “Good morning”.',
    });
  });

  it('explains meanings, listening and skips', () => {
    expect(why(select, 'con chó')).toEqual({ category: 'meaning', why: '“cat” means “con mèo”.' });
    expect(why(listen, 'I like dogs')?.category).toBe('listening');
    expect(why(listen, 'I like dogs')?.why).toContain('You heard “I like cats”.');
    expect(why(type, '')).toMatchObject({ category: 'skipped' });
  });
});
