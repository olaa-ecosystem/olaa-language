/**
 * A small value kept in this browser's localStorage under its own key, with a React hook.
 * For Language-owned side data that is not part of the synced app state (daily activity
 * log, learning notes, theme). Unreadable or invalid saved data falls back to the default.
 */
import { useSyncExternalStore } from 'react';

export interface LocalStore<T> {
  get(): T;
  set(next: T | ((current: T) => T)): void;
  subscribe(listener: () => void): () => void;
  use(): T;
}

export function createLocalStore<T>(
  key: string,
  fallback: () => T,
  validate: (value: unknown) => value is T,
): LocalStore<T> {
  const read = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback();
      const parsed: unknown = JSON.parse(raw);
      return validate(parsed) ? parsed : fallback();
    } catch {
      return fallback();
    }
  };
  let value: T = typeof window === 'undefined' ? fallback() : read();
  const listeners = new Set<() => void>();
  const store: LocalStore<T> = {
    get: () => value,
    set(next) {
      const resolved = typeof next === 'function' ? (next as (c: T) => T)(value) : next;
      if (resolved === value) return;
      value = resolved;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Kept in memory for this visit when storage is blocked.
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    use() {
      return useSyncExternalStore(store.subscribe, store.get, store.get);
    },
  };
  return store;
}

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
