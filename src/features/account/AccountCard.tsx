import { useState, type FormEvent } from 'react';
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutAndClear,
  useAccount,
  type SyncStatus,
} from '../../services/cloudSync';

const STATUS_TEXT: Partial<Record<SyncStatus, string>> = {
  connecting: 'Checking your account…',
  syncing: 'Saving to your account…',
  synced: 'Progress is saved to your account and syncs across your devices.',
};

/** Olaa ID sign-in and sync status. Renders nothing when Firebase is not configured. */
export function AccountCard({ intro }: { intro?: string }) {
  const account = useAccount();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (account.status === 'off') return null;

  const act = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const message = await action();
    setBusy(false);
    setError(message);
  };

  if (account.email !== null) {
    return (
      <div className="card account-card">
        <p>
          Signed in as <strong>{account.email}</strong>
        </p>
        <p className={`small ${account.status === 'error' ? 'account-card__error' : 'muted'}`}>
          {account.status === 'error' ? account.error : STATUS_TEXT[account.status]}
        </p>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => void act(async () => (await signOutAndClear(), null))}
        >
          Sign out
        </button>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void act(() =>
      mode === 'signin'
        ? signInWithEmail(email, password)
        : createAccountWithEmail(email, password),
    );
  };

  return (
    <div className="card account-card">
      <p className="muted small">
        {intro ?? 'Sign in with your Olaa ID to keep your progress and learn on any device.'}
      </p>
      <button
        type="button"
        className="btn btn--block"
        disabled={busy || account.status === 'connecting'}
        onClick={() => void act(signInWithGoogle)}
      >
        Continue with Google
      </button>
      <form className="account-card__form" onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--ghost btn--block" disabled={busy}>
          {mode === 'signin' ? 'Sign in with email' : 'Create account'}
        </button>
      </form>
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setMode(mode === 'signin' ? 'create' : 'signin');
          setError(null);
        }}
      >
        {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
      {error && (
        <p className="small account-card__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
