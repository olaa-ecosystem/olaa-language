/**
 * What is open in the level curriculum. A level opens when the level before it is passed (its
 * test at 70 % or more). Inside a level, units open one after another; passing the level test
 * opens them all, so a learner who already knows a level can skip ahead.
 */
import type { LevelProgress } from '../../stores/appState';
import { LEVEL_TEST_PASS } from './toExercises';
import type { LevelMeta } from './types';

export type OpenState = 'locked' | 'open' | 'done';

export function levelPassed(progress: LevelProgress, code: string): boolean {
  return (progress.tests[code] ?? 0) >= LEVEL_TEST_PASS;
}

export function levelState(levels: LevelMeta[], progress: LevelProgress, index: number): OpenState {
  const level = levels[index];
  if (!level) return 'locked';
  if (levelPassed(progress, level.code)) return 'done';
  const previous = levels[index - 1];
  return index === 0 || (previous && levelPassed(progress, previous.code)) ? 'open' : 'locked';
}

/** A level test can be taken for an open level, or for the next locked one (placement). */
export function canTakeTest(levels: LevelMeta[], progress: LevelProgress, index: number): boolean {
  if (levelState(levels, progress, index) !== 'locked') return true;
  return levelState(levels, progress, index - 1) !== 'locked';
}

export function unitStates(
  unitIds: string[],
  progress: LevelProgress,
  levelCode: string,
  levelOpen: boolean,
): Record<string, OpenState> {
  const passed = levelPassed(progress, levelCode);
  const out: Record<string, OpenState> = {};
  unitIds.forEach((id, i) => {
    const prev = unitIds[i - 1];
    if (progress.units[id] !== undefined) out[id] = 'done';
    else if (levelOpen && (passed || i === 0 || (prev && progress.units[prev] !== undefined)))
      out[id] = 'open';
    else out[id] = 'locked';
  });
  return out;
}
