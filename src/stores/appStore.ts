import { useSyncExternalStore } from 'react';
import { clearSaved, loadJson, saveJson } from '../services/storage';
import { initialState, type AppState } from './appState';
import { migrateState } from './migrate';

function load(): AppState {
  const raw = loadJson<unknown>(
    () => null,
    (_v): _v is unknown => true,
  );
  return migrateState(raw) ?? initialState();
}

let state: AppState = load();
const listeners = new Set<() => void>();

export const appStore = {
  getState: (): AppState => state,
  update(updater: (current: AppState) => AppState): void {
    const next = updater(state);
    if (next === state) return;
    state = next;
    saveJson(state);
    listeners.forEach((l) => l());
  },
  /** Replace the whole state, e.g. with progress downloaded from the account. */
  replace(next: AppState): void {
    state = migrateState(next) ?? initialState();
    saveJson(state);
    listeners.forEach((l) => l());
  },
  reset(): void {
    clearSaved();
    state = initialState();
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAppState(): AppState {
  return useSyncExternalStore(appStore.subscribe, appStore.getState, appStore.getState);
}
