/** Turn curriculum content into player exercises. Ids are stable so answers can be tracked. */
import { createRng, sample, shuffle } from '../../utils/random';
import type { Exercise } from '../exercises';
import type { ContentItem, CurriculumLang, LevelUnit } from './types';

export function itemToExercise(
  item: ContentItem,
  unit: Pick<LevelUnit, 'id' | 'passage'>,
  lang: CurriculumLang,
  index: number,
  seed = index,
): Exercise {
  const base = {
    id: `${unit.id}:${index}`,
    lessonId: unit.id,
    skill: item.skill,
    explain: 'explain' in item ? item.explain : null,
  };
  switch (item.kind) {
    case 'choice':
      return {
        ...base,
        kind: 'choice',
        instruction: item.instruction,
        prompt: item.prompt,
        lang,
        options: item.options,
        answerIndex: item.answer,
        audioText: item.audio,
        passage: item.passage ? unit.passage : null,
      };
    case 'text':
      return {
        ...base,
        kind: 'text',
        instruction: item.instruction,
        prompt: item.prompt,
        lang,
        accepted: item.accepted,
      };
    case 'order':
      return {
        ...base,
        kind: 'build',
        prompt: item.meaning ?? 'Sắp xếp thành câu đúng',
        promptLang: 'vi',
        answerLang: lang,
        tiles: shuffle(item.parts, createRng(seed + 1)),
        accepted: [item.parts.join(' ')],
      };
    case 'dictation':
      return { ...base, kind: 'dictation', audioText: item.audio, lang };
    case 'say':
      return { ...base, kind: 'say', text: item.text, lang };
    case 'free':
      return { ...base, kind: 'free', prompt: item.prompt, model: item.model, lang };
  }
}

/** The unit's main session: warm-up, practice and application, in teaching order. */
export function unitExercises(
  unit: LevelUnit,
  lang: CurriculumLang,
  challenge = false,
): Exercise[] {
  const list = challenge ? unit.challenge : unit.items;
  const offset = challenge ? unit.items.length : 0;
  return list.map((item, i) => itemToExercise(item, unit, lang, offset + i));
}

/** Kinds that can be graded automatically, so they can count in a level test. */
const GRADED: ContentItem['kind'][] = ['choice', 'text', 'order', 'dictation'];

export const LEVEL_TEST_SIZE = 20;
export const LEVEL_TEST_PASS = 0.7;

/**
 * A level test: auto-graded questions sampled across every unit of the level (challenge
 * questions included), so passing it means the whole level, not one unit.
 */
export function levelTestExercises(
  units: LevelUnit[],
  lang: CurriculumLang,
  seed: number,
): Exercise[] {
  const rng = createRng(seed);
  const pool: Exercise[] = [];
  for (const unit of units) {
    [...unit.items, ...unit.challenge].forEach((item, i) => {
      if (GRADED.includes(item.kind)) pool.push(itemToExercise(item, unit, lang, i, seed + i));
    });
  }
  // Spread across units: take round-robin from a shuffled pool per unit.
  const byUnit = new Map<string, Exercise[]>();
  for (const e of shuffle(pool, rng))
    byUnit.set(e.lessonId, [...(byUnit.get(e.lessonId) ?? []), e]);
  const picked: Exercise[] = [];
  const queues = [...byUnit.values()];
  while (picked.length < LEVEL_TEST_SIZE && queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next && picked.length < LEVEL_TEST_SIZE) picked.push(next);
    }
  }
  return sample(picked, picked.length, rng);
}
