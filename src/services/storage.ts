/**
 * Local persistence adapter. Progress lives in this browser only (no account sync yet —
 * see docs/decisions/ADR-0001). Every access is guarded: private mode or blocked storage
 * must never break the app, it just means progress is not remembered.
 */
const STORAGE_KEY = 'olaa-language/state';

export function loadJson<T>(fallback: () => T, validate: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback();
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback();
  } catch {
    return fallback();
  }
}

export function saveJson(value: unknown): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearSaved(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
