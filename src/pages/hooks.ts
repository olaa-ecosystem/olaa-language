import { useMemo } from 'react';
import { href } from '../app/router';
import { useAsync, type Async } from '../components/ui';
import { levelsOf, loadLevel } from '../features/levels/load';
import type { CurriculumLang, LevelMeta, LevelUnit } from '../features/levels/types';
import { buildLevelSyllabus, currentLevelIndex, nextStepInLevel, type LevelSyllabus, type NextStep } from '../features/syllabus/syllabus';
import { loadTopics } from '../features/topics/topics';
import type { Topic } from '../features/topics/types';
import { getLocale } from '../i18n/locale';
import { useAppState } from '../stores/appStore';
import { levelProgress } from '../stores/appState';

export function useLevelUnits(lang: CurriculumLang, code: string): Async<LevelUnit[]> {
  return useAsync(() => loadLevel(lang, code), `${getLocale()}/${lang}/${code}`);
}

export function useTopics(): Async<Topic[]> {
  return useAsync(loadTopics, 'topics');
}

export interface CurrentLevel {
  level: LevelMeta;
  index: number;
  levels: LevelMeta[];
  units: LevelUnit[];
  syllabus: LevelSyllabus;
  next: NextStep;
  /** Link for the next step. */
  nextHref: string;
}

/** The level the learner is working in, with its syllabus and next step. */
export function useCurrentLevel(lang: CurriculumLang): Async<CurrentLevel> {
  const state = useAppState();
  const progress = levelProgress(state, lang);
  const levels = levelsOf(lang);
  const index = currentLevelIndex(levels, progress);
  const level = levels[index]!;
  const units = useLevelUnits(lang, level.code);
  const topics = useTopics();
  return useMemo((): Async<CurrentLevel> => {
    if (units.status === 'error' || topics.status === 'error') return { status: 'error' };
    if (units.status !== 'ready' || topics.status !== 'ready') return { status: 'loading' };
    const syllabus = buildLevelSyllabus(lang, level, units.data, topics.data);
    const next = nextStepInLevel(syllabus, progress, levels[index + 1] ?? null);
    const nextHref =
      next.kind === 'unit'
        ? href({ name: 'unit', lang, level: level.code, unitId: next.unitId, challenge: false })
        : next.kind === 'test'
          ? href({ name: 'test', lang, level: level.code })
          : href({ name: 'path' });
    return { status: 'ready', data: { level, index, levels, units: units.data, syllabus, next, nextHref } };
  }, [units, topics, lang, level, levels, index, progress]);
}
