import type { BuildExercise, SelectExercise, TextExercise } from './types';
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
const text: TextExercise = {
  id: 'tx',
  lessonId: 'l',
  kind: 'text',
  instruction: null,
  prompt: 'She ___ to school yesterday.',
  lang: 'en',
  accepted: ['went'],
  skill: 'grammar',
  explain: 'Past simple of "go" is "went".',
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

  it('uses the teacher explanation and the skill for curriculum items', () => {
    expect(why(text, 'goed')).toEqual({
      category: 'grammar',
      why: 'Past simple of "go" is "went".',
    });
    expect(why(text, '')).toMatchObject({ category: 'skipped' });
  });

  it('explains meanings and skips', () => {
    expect(why(select, 'con chó')).toEqual({ category: 'meaning', why: '“cat” means “con mèo”.' });
    expect(why(select, '')).toMatchObject({ category: 'skipped' });
  });
});
