/**
 * Firebase connection (platform ADR-0004). The web config is public by design and comes from
 * VITE_FIREBASE_* variables. When it is missing the app runs exactly as before: local only.
 *
 * The SDK is loaded on demand in its own chunk, so the learning UI does not wait for it.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  authSdk: typeof import('firebase/auth');
  firestoreSdk: typeof import('firebase/firestore');
}

let loading: Promise<FirebaseServices> | null = null;
let loaded: FirebaseServices | null = null;

/** Start (or reuse) loading the SDK. Resolves to null when Firebase is not configured. */
export function loadFirebase(): Promise<FirebaseServices | null> {
  if (!firebaseEnabled) return Promise.resolve(null);
  loading ??= (async () => {
    const [{ initializeApp }, authSdk, firestoreSdk] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]);
    const app = initializeApp(config);
    loaded = {
      app,
      auth: authSdk.getAuth(app),
      db: firestoreSdk.getFirestore(app),
      authSdk,
      firestoreSdk,
    };
    return loaded;
  })();
  return loading;
}

/**
 * The SDK if it has finished loading. Sign-in popups must open in the same tick as the tap
 * (Safari blocks them otherwise), so callers use this before falling back to loadFirebase().
 */
export function loadedFirebase(): FirebaseServices | null {
  return loaded;
}
