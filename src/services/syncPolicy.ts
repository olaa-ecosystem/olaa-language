/**
 * Pure rules for syncing progress between this device and the account (no Firebase imports,
 * so they are unit-tested on their own).
 */
import { STATE_VERSION, type AppState } from '../stores/appState';
import { migrateState, READABLE_VERSIONS } from '../stores/migrate';

export interface RemoteSnapshot {
  state: AppState;
  updatedAt: number;
}

export type InitialSyncAction = 'pull' | 'push' | 'none';

/** Has this device got anything worth keeping? A fresh install has no profile yet. */
export function hasLocalProgress(state: AppState): boolean {
  return state.profile !== null;
}

/**
 * Decide what to do right after sign-in.
 * - No account copy: upload this device's progress if there is any.
 * - Empty device: download the account copy.
 * - Both exist: the most recently changed copy wins.
 */
export function initialSyncAction(
  local: AppState,
  localUpdatedAt: number,
  remote: RemoteSnapshot | null,
): InitialSyncAction {
  if (!remote) return hasLocalProgress(local) ? 'push' : 'none';
  if (!hasLocalProgress(local)) return 'pull';
  if (remote.updatedAt > localUpdatedAt) return 'pull';
  if (remote.updatedAt < localUpdatedAt) return 'push';
  return 'none';
}

/** Firestore document stored at language/{uid}. */
export interface RemoteDoc {
  stateJson: string;
  updatedAt: number;
  schemaVersion: number;
}

export function toRemoteDoc(state: AppState, updatedAt: number): RemoteDoc {
  return { stateJson: JSON.stringify(state), updatedAt, schemaVersion: STATE_VERSION };
}

/** Parse a document from the account; anything unexpected is ignored rather than applied. */
export function fromRemoteDoc(data: unknown): RemoteSnapshot | null {
  if (typeof data !== 'object' || data === null) return null;
  const { stateJson, updatedAt, schemaVersion } = data as Partial<RemoteDoc>;
  if (typeof schemaVersion !== 'number' || !READABLE_VERSIONS.includes(schemaVersion)) return null;
  if (typeof stateJson !== 'string' || typeof updatedAt !== 'number') return null;
  try {
    const parsed: unknown = JSON.parse(stateJson);
    // Older account copies are upgraded (version 1 → 2 drops the old courses and mascots).
    const state = migrateState(parsed);
    return state ? { state, updatedAt } : null;
  } catch {
    return null;
  }
}
