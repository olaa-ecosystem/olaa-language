import type { LanguageCode } from '../../types';
import { createRng, sample, shuffle, type Rng } from '../../utils/random';
import { normalize, tokenize } from '../../utils/text';
import { acceptedAnswers, allLessons, type Course, type Lesson, type Phrase } from '../curriculum';
import type {
  BuildExercise,
  Exercise,
  ListenExercise,
  MatchExercise,
  PictureExercise,
  SelectExercise,
  TypeExercise,
} from './types';

export const MAX_EXERCISES_PER_LESSON = 12;

/** Tiles are shown lowercase, except "I" and names (capitalised words mid-sentence). */
export function toTiles(sentence: string): string[] {
  return tokenize(sentence).map((token, i) =>
    token === 'I' || (i > 0 && /^\p{Lu}/u.test(token)) ? token : token.toLowerCase(),
  );
}

function wordPool(course: Course): Phrase[] {
  return allLessons(course).flatMap((l) => l.words);
}

function distractorTiles(
  course: Course,
  lang: LanguageCode,
  answerTiles: string[],
  count: number,
  rng: Rng,
): string[] {
  const used = new Set(answerTiles.map(normalize));
  const candidates = new Set<string>();
  for (const word of wordPool(course)) {
    for (const token of tokenize(word[lang])) {
      const key = normalize(token);
      if (!used.has(key)) candidates.add(token.toLowerCase());
    }
  }
  return sample([...candidates], count, rng);
}

function distractorWords(
  course: Course,
  word: Phrase,
  lang: LanguageCode,
  count: number,
  rng: Rng,
): string[] {
  const answer = normalize(word[lang]);
  const options = new Map<string, string>();
  for (const candidate of wordPool(course)) {
    const key = normalize(candidate[lang]);
    if (key !== answer && !options.has(key)) options.set(key, candidate[lang]);
  }
  return sample([...options.values()], count, rng);
}

function selectExercise(
  course: Course,
  lesson: Lesson,
  word: Phrase,
  index: number,
  rng: Rng,
): SelectExercise {
  const { targetLang, baseLang } = course;
  // Alternate direction to practise recognition and recall.
  const forward = index % 2 === 0;
  const promptLang = forward ? targetLang : baseLang;
  const optionLang = forward ? baseLang : targetLang;
  const answer = word[optionLang];
  return {
    id: `${lesson.id}:select:${word.en}`,
    lessonId: lesson.id,
    kind: 'select',
    prompt: word[promptLang],
    promptLang,
    optionLang,
    answer,
    options: shuffle([answer, ...distractorWords(course, word, optionLang, 3, rng)], rng),
  };
}

function pictureExercise(
  course: Course,
  lesson: Lesson,
  word: Phrase & { image: NonNullable<Phrase['image']> },
  rng: Rng,
): PictureExercise {
  const others = wordPool(course).filter(
    (w): w is typeof word => !!w.image && w.image !== word.image,
  );
  const options = shuffle([word, ...sample(others, 3, rng)], rng).map((w) => ({
    image: w.image,
    label: w[course.targetLang],
  }));
  return {
    id: `${lesson.id}:picture:${word.en}`,
    lessonId: lesson.id,
    kind: 'picture',
    prompt: word[course.baseLang],
    promptLang: course.baseLang,
    labelLang: course.targetLang,
    options,
    answer: word.image,
  };
}

function matchExercise(course: Course, lesson: Lesson, rng: Rng): MatchExercise {
  return {
    id: `${lesson.id}:match`,
    lessonId: lesson.id,
    kind: 'match',
    leftLang: course.targetLang,
    rightLang: course.baseLang,
    pairs: sample(lesson.words, 5, rng).map((w) => ({
      left: w[course.targetLang],
      right: w[course.baseLang],
    })),
  };
}

function buildExercise(
  course: Course,
  lesson: Lesson,
  sentence: Phrase,
  toTarget: boolean,
  rng: Rng,
): BuildExercise {
  const answerLang = toTarget ? course.targetLang : course.baseLang;
  const promptLang = toTarget ? course.baseLang : course.targetLang;
  const answerTiles = toTiles(sentence[answerLang]);
  return {
    id: `${lesson.id}:build:${answerLang}:${sentence.en}`,
    lessonId: lesson.id,
    kind: 'build',
    prompt: sentence[promptLang],
    promptLang,
    answerLang,
    accepted: acceptedAnswers(sentence, answerLang),
    tiles: shuffle(
      [...answerTiles, ...distractorTiles(course, answerLang, answerTiles, 3, rng)],
      rng,
    ),
  };
}

function typeExercise(course: Course, lesson: Lesson, sentence: Phrase): TypeExercise {
  return {
    id: `${lesson.id}:type:${sentence.en}`,
    lessonId: lesson.id,
    kind: 'type',
    prompt: sentence[course.baseLang],
    promptLang: course.baseLang,
    answerLang: course.targetLang,
    accepted: acceptedAnswers(sentence, course.targetLang),
  };
}

function listenExercise(
  course: Course,
  lesson: Lesson,
  sentence: Phrase,
  rng: Rng,
): ListenExercise {
  const answerTiles = toTiles(sentence[course.targetLang]);
  return {
    id: `${lesson.id}:listen:${sentence.en}`,
    lessonId: lesson.id,
    kind: 'listen',
    audioText: sentence[course.targetLang],
    audioLang: course.targetLang,
    // Only the spoken sentence is accepted: you build exactly what you heard.
    accepted: [sentence[course.targetLang]],
    tiles: shuffle(
      [...answerTiles, ...distractorTiles(course, course.targetLang, answerTiles, 2, rng)],
      rng,
    ),
  };
}

/**
 * Builds one lesson session. Higher lesson levels shift the mix from recognition
 * (pictures, tiles) toward recall (typing).
 */
export function generateLessonExercises(
  course: Course,
  lesson: Lesson,
  level: number,
  seed: number,
): Exercise[] {
  const rng = createRng(seed);

  const pictureWords = lesson.words.filter(
    (w): w is Phrase & { image: NonNullable<Phrase['image']> } => !!w.image,
  );
  const wordExercises: Exercise[] = [
    ...sample(pictureWords, 3, rng).map((w) => pictureExercise(course, lesson, w, rng)),
  ];
  const selectWords = sample(
    lesson.words.filter((w) => !w.image || pictureWords.length > 3),
    4 - wordExercises.length,
    rng,
  );
  selectWords.forEach((w, i) => wordExercises.push(selectExercise(course, lesson, w, i, rng)));

  const sentences = shuffle(lesson.sentences, rng);
  const typeCount = Math.min(sentences.length, level >= 2 ? 2 : 1);
  const sentenceExercises: Exercise[] = [];
  sentences.forEach((s, i) => {
    sentenceExercises.push(buildExercise(course, lesson, s, i % 2 === 0, rng));
  });
  sentences
    .slice(0, typeCount)
    .forEach((s) => sentenceExercises.push(typeExercise(course, lesson, s)));
  const listenSentence = sentences[sentences.length - 1];
  if (listenSentence) sentenceExercises.push(listenExercise(course, lesson, listenSentence, rng));

  const ordered = [
    ...wordExercises,
    matchExercise(course, lesson, rng),
    ...shuffle(sentenceExercises, rng),
  ];
  return ordered.slice(0, MAX_EXERCISES_PER_LESSON);
}

/** Mixed review drawn from lessons the learner has already completed. */
export function generatePracticeExercises(
  course: Course,
  completedLessonIds: string[],
  seed: number,
  count = 10,
): Exercise[] {
  const rng = createRng(seed);
  const lessons = allLessons(course).filter((l) => completedLessonIds.includes(l.id));
  if (!lessons.length) return [];
  const pool = lessons.flatMap((lesson, i) =>
    generateLessonExercises(course, lesson, 3, seed + i).filter((e) => e.kind !== 'match'),
  );
  return sample(pool, count, rng);
}
