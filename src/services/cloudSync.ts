/**
 * Olaa ID sign-in and progress sync (platform ADR-0004, Language PRD REQ-01-040/041).
 *
 * Progress still lives in localStorage first, so the app works offline and without an account.
 * When signed in, every change is also written to Firestore at language/{uid} (debounced), and
 * changes made on another device are applied here. Conflicts: the most recent copy wins.
 */
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { useSyncExternalStore } from 'react';
import { appStore } from '../stores/appStore';
import type { AppState } from '../stores/appState';
import { firebaseEnabled, loadedFirebase, loadFirebase, type FirebaseServices } from './firebase';
import { fromRemoteDoc, initialSyncAction, toRemoteDoc } from './syncPolicy';

const META_KEY = 'olaa-language/sync-meta';
const PUSH_DELAY_MS = 1500;

export type SyncStatus = 'off' | 'connecting' | 'signed-out' | 'syncing' | 'synced' | 'error';

export interface AccountState {
  status: SyncStatus;
  email: string | null;
  error: string | null;
}

let account: AccountState = {
  status: firebaseEnabled ? 'connecting' : 'off',
  email: null,
  error: null,
};
const accountListeners = new Set<() => void>();

function setAccount(patch: Partial<AccountState>): void {
  account = { ...account, ...patch };
  accountListeners.forEach((l) => l());
}

let localUpdatedAt = readMeta();
let currentUid: string | null = null;
let applyingRemote = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let stopSnapshot: Unsubscribe | null = null;
let started = false;

function readMeta(): number {
  try {
    const value = Number(window.localStorage.getItem(META_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeMeta(value: number): void {
  localUpdatedAt = value;
  try {
    window.localStorage.setItem(META_KEY, String(value));
  } catch {
    // Without storage the timestamp lives in memory only; sync still works this session.
  }
}

function userDoc(fb: FirebaseServices, uid: string) {
  return fb.firestoreSdk.doc(fb.db, 'language', uid);
}

async function push(): Promise<void> {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  const uid = currentUid;
  const fb = loadedFirebase();
  if (!uid || !fb) return;
  setAccount({ status: 'syncing' });
  try {
    await fb.firestoreSdk.setDoc(
      userDoc(fb, uid),
      toRemoteDoc(appStore.getState(), localUpdatedAt),
    );
    if (currentUid === uid) setAccount({ status: 'synced', error: null });
  } catch {
    if (currentUid === uid) {
      setAccount({
        status: 'error',
        error: 'Could not save to your account. Your progress is safe on this device.',
      });
    }
  }
}

function schedulePush(): void {
  if (!currentUid) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void push(), PUSH_DELAY_MS);
}

async function flush(): Promise<void> {
  if (pushTimer) await push();
}

function applyRemote(state: AppState, updatedAt: number): void {
  applyingRemote = true;
  try {
    appStore.replace(state);
  } finally {
    applyingRemote = false;
  }
  writeMeta(updatedAt);
}

async function handleSignedIn(fb: FirebaseServices, user: User): Promise<void> {
  const { getDoc, onSnapshot } = fb.firestoreSdk;
  currentUid = user.uid;
  setAccount({ status: 'syncing', email: user.email, error: null });
  try {
    const snap = await getDoc(userDoc(fb, user.uid));
    const remote = snap.exists() ? fromRemoteDoc(snap.data()) : null;
    if (snap.exists() && !remote) {
      // Written by a newer app version: never overwrite it from here.
      setAccount({
        status: 'error',
        error: 'Your account was saved by a newer version of the app. Reload the page to update.',
      });
      return;
    }
    const action = initialSyncAction(appStore.getState(), localUpdatedAt, remote);
    if (action === 'pull' && remote) applyRemote(remote.state, remote.updatedAt);
    if (action === 'push') await push();
    if (currentUid !== user.uid) return;

    stopSnapshot?.();
    stopSnapshot = onSnapshot(
      userDoc(fb, user.uid),
      (s) => {
        if (s.metadata.hasPendingWrites || !s.exists()) return;
        const latest = fromRemoteDoc(s.data());
        if (latest && latest.updatedAt > localUpdatedAt)
          applyRemote(latest.state, latest.updatedAt);
      },
      () => setAccount({ status: 'error', error: 'Lost the connection to your account.' }),
    );
    setAccount({ status: 'synced' });
  } catch {
    if (currentUid === user.uid) {
      setAccount({
        status: 'error',
        error: 'Could not reach your account. Your progress is safe on this device.',
      });
    }
  }
}

function handleSignedOut(): void {
  currentUid = null;
  stopSnapshot?.();
  stopSnapshot = null;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  setAccount({ status: 'signed-out', email: null, error: null });
}

/** Call once at startup. Does nothing when Firebase is not configured. */
export function startCloudSync(): void {
  if (started || !firebaseEnabled) return;
  started = true;

  appStore.subscribe(() => {
    if (applyingRemote) return;
    writeMeta(Date.now());
    schedulePush();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  loadFirebase().then(
    (fb) => {
      if (!fb) return;
      fb.authSdk.onAuthStateChanged(fb.auth, (user) => {
        if (user) void handleSignedIn(fb, user);
        else handleSignedOut();
      });
    },
    () =>
      setAccount({
        status: 'error',
        error: 'Could not load sign-in. Check your connection and reload the page.',
      }),
  );
}

function authErrorMessage(error: unknown): string | null {
  const code = (error as { code?: unknown } | null)?.code;
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null;
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/weak-password':
      return 'Use at least 6 characters for the password.';
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups and try again.';
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not turned on yet.';
    case 'auth/unauthorized-domain':
      return 'Sign-in is not allowed on this web address yet.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

/**
 * Run an auth action and resolve to an error message, or null on success / user cancel.
 * Uses the already-loaded SDK synchronously when possible so popups stay tied to the tap.
 */
function run(action: (fb: FirebaseServices) => Promise<unknown>): Promise<string | null> {
  const attempt = (fb: FirebaseServices | null) =>
    fb
      ? action(fb).then(
          () => null,
          (error: unknown) => authErrorMessage(error),
        )
      : Promise.resolve('Sign-in is not available.');
  const ready = loadedFirebase();
  if (ready) return attempt(ready);
  return loadFirebase().then(attempt, () => 'Could not load sign-in. Check your connection.');
}

export function signInWithGoogle(): Promise<string | null> {
  return run((fb) => fb.authSdk.signInWithPopup(fb.auth, new fb.authSdk.GoogleAuthProvider()));
}

export function signInWithEmail(email: string, password: string): Promise<string | null> {
  return run((fb) => fb.authSdk.signInWithEmailAndPassword(fb.auth, email.trim(), password));
}

export function createAccountWithEmail(email: string, password: string): Promise<string | null> {
  return run((fb) => fb.authSdk.createUserWithEmailAndPassword(fb.auth, email.trim(), password));
}

/** Save pending changes, sign out, and clear this device (the account keeps the progress). */
export async function signOutAndClear(): Promise<void> {
  const fb = loadedFirebase();
  if (!fb) return;
  await flush();
  await fb.authSdk.signOut(fb.auth);
  handleSignedOut();
  applyingRemote = true;
  try {
    appStore.reset();
  } finally {
    applyingRemote = false;
  }
  writeMeta(0);
}

function subscribeAccount(listener: () => void): () => void {
  accountListeners.add(listener);
  return () => accountListeners.delete(listener);
}

export function useAccount(): AccountState {
  return useSyncExternalStore(
    subscribeAccount,
    () => account,
    () => account,
  );
}
