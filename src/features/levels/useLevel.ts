import { useEffect, useState } from 'react';
import { loadLevel } from './load';
import type { CurriculumLang, LevelUnit } from './types';

export type Loaded<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

/** Units of one level, fetched on demand. */
export function useLevel(lang: CurriculumLang, code: string): Loaded<LevelUnit[]> {
  const [state, setState] = useState<Loaded<LevelUnit[]>>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    loadLevel(lang, code).then(
      (data) => live && setState({ status: 'ready', data }),
      () => live && setState({ status: 'error' }),
    );
    return () => {
      live = false;
    };
  }, [lang, code]);
  return state;
}
