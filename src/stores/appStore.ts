import { useSyncExternalStore } from 'react';
import { clearSaved, loadJson, saveJson } from '../services/storage';
import { initialState, STATE_VERSION, type AppState } from './appState';

function isAppState(value: unknown): value is AppState {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { version?: unknown }).version === STATE_VERSION
  );
}

function load(): AppState {
  // Merge with defaults so fields added later get sensible values.
  return { ...initialState(), ...loadJson(initialState, isAppState) };
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
