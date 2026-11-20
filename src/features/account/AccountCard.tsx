import { useState, type FormEvent } from 'react';
import {
  createAccountWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOutAndClear,
  useAccount,
  type SyncStatus,
} from '../../services/cloudSync';
import { tr } from '../../i18n/locale';

const statusText = (status: SyncStatus): string | undefined =>
  ({
    connecting: tr('Đang kiểm tra tài khoản…', 'Checking your account…'),
    syncing: tr('Đang lưu lên tài khoản…', 'Saving to your account…'),
    synced: tr(
      'Tiến độ đã lưu vào tài khoản và đồng bộ giữa các thiết bị.',
      'Progress is saved to your account and syncs across your devices.',
    ),
  })[status as 'connecting' | 'syncing' | 'synced'];

/** Olaa ID sign-in and sync status. Renders nothing when Firebase is not configured. */
export function AccountCard({ intro }: { intro?: string }) {
  const account = useAccount();
  const [mode, setMode] = useState<'signin' | 'create' | 'reset'>('signin');
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (account.status === 'off') return null;

  const act = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const message = await action();
    setBusy(false);
    setError(message);
  };

  if (account.email !== null) {
    return (
      <div className="card account-card">
        <p>
          {tr('Đã đăng nhập: ', 'Signed in as ')}
          <strong>{account.email}</strong>
        </p>
        <p className={`small ${account.status === 'error' ? 'account-card__error' : 'muted'}`}>
          {account.status === 'error' ? account.error : statusText(account.status)}
        </p>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => void act(async () => (await signOutAndClear(), null))}
        >
          {tr('Đăng xuất', 'Sign out')}
        </button>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'reset') {
      void act(async () => {
        const message = await sendPasswordReset(email);
        if (!message)
          setNotice(
            tr(
              `Nếu ${email.trim()} có Olaa ID, liên kết đặt mật khẩu mới đang được gửi tới. Xem hộp thư và cả thư rác.`,
              `If ${email.trim()} has an Olaa ID, a link to set a new password is on its way. Check your inbox and spam folder.`,
            ),
          );
        return message;
      });
      return;
    }
    void act(() =>
      mode === 'signin'
        ? signInWithEmail(email, password)
        : createAccountWithEmail(email, password),
    );
  };

  return (
    <div className="card account-card">
      <p className="muted small">
        {intro ??
          tr(
            'Đăng nhập bằng Olaa ID để giữ tiến độ và học trên mọi thiết bị.',
            'Sign in with your Olaa ID to keep your progress and learn on any device.',
          )}
      </p>
      <button
        type="button"
        className="btn btn--block"
        disabled={busy || account.status === 'connecting'}
        onClick={() => void act(signInWithGoogle)}
      >
        {tr('Tiếp tục với Google', 'Continue with Google')}
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
        {mode !== 'reset' && (
          <label className="field">
            <span>{tr('Mật khẩu', 'Password')}</span>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        <button type="submit" className="btn btn--ghost btn--block" disabled={busy}>
          {mode === 'signin'
            ? tr('Đăng nhập bằng email', 'Sign in with email')
            : mode === 'create'
              ? tr('Tạo tài khoản', 'Create account')
              : tr('Gửi liên kết đặt lại', 'Send reset link')}
        </button>
      </form>
      {mode === 'signin' && (
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode('reset');
            setError(null);
            setNotice(null);
          }}
        >
          {tr('Quên mật khẩu?', 'Forgot password?')}
        </button>
      )}
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setMode(mode === 'signin' ? 'create' : 'signin');
          setError(null);
          setNotice(null);
        }}
      >
        {mode === 'signin'
          ? tr('Chưa có tài khoản? Tạo tài khoản', 'New here? Create an account')
          : tr('Quay lại đăng nhập', 'Back to sign in')}
      </button>
      {notice && (
        <p className="small muted" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="small account-card__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
