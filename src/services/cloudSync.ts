/**
 * Olaa ID sign-in and progress sync (platform ADR-0004, Language PRD REQ-01-040/041).
 *
 * Progress still lives in localStorage first, so the app works offline and without an account.
 * When signed in, every change is also written to Firestore at language/{uid} (debounced), and
 * changes made on another device are applied here. Conflicts: the most recent copy wins.
 */
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { useSyncExternalStore } from 'react';
import { appStore } from '../stores/appStore';
import type { AppState } from '../stores/appState';
import { firebaseEnabled, getFirebase } from './firebase';
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

function userDoc(uid: string) {
  const fb = getFirebase();
  if (!fb) throw new Error('Firebase is not configured');
  return doc(fb.db, 'language', uid);
}

async function push(): Promise<void> {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  const uid = currentUid;
  if (!uid) return;
  setAccount({ status: 'syncing' });
  try {
    await setDoc(userDoc(uid), toRemoteDoc(appStore.getState(), localUpdatedAt));
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

async function handleSignedIn(user: User): Promise<void> {
  currentUid = user.uid;
  setAccount({ status: 'syncing', email: user.email, error: null });
  try {
    const snap = await getDoc(userDoc(user.uid));
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
      userDoc(user.uid),
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
  if (started) return;
  started = true;
  const fb = getFirebase();
  if (!fb) return;

  appStore.subscribe(() => {
    if (applyingRemote) return;
    writeMeta(Date.now());
    schedulePush();
  });
  onAuthStateChanged(fb.auth, (user) => {
    if (user) void handleSignedIn(user);
    else handleSignedOut();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
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

/** Each action resolves to an error message, or null on success / user cancel. */
async function run(action: () => Promise<unknown>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    return authErrorMessage(error);
  }
}

export function signInWithGoogle(): Promise<string | null> {
  const fb = getFirebase();
  if (!fb) return Promise.resolve('Sign-in is not available.');
  return run(() => signInWithPopup(fb.auth, new GoogleAuthProvider()));
}

export function signInWithEmail(email: string, password: string): Promise<string | null> {
  const fb = getFirebase();
  if (!fb) return Promise.resolve('Sign-in is not available.');
  return run(() => signInWithEmailAndPassword(fb.auth, email.trim(), password));
}

export function createAccountWithEmail(email: string, password: string): Promise<string | null> {
  const fb = getFirebase();
  if (!fb) return Promise.resolve('Sign-in is not available.');
  return run(() => createUserWithEmailAndPassword(fb.auth, email.trim(), password));
}

/** Save pending changes, sign out, and clear this device (the account keeps the progress). */
export async function signOutAndClear(): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await flush();
  await signOut(fb.auth);
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
