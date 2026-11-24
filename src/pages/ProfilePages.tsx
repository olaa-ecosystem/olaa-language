/** Hồ sơ: stats, settings, Olaa ID account, data export, and the learning notes for Olaa Note. */
import { useState, type FormEvent } from 'react';
import { OLAA_APPS } from '../app/router';
import { themeStore, type Theme } from '../app/theme';
import { Icon } from '../components/Icon';
import { AppTile, Dialog, Empty, toast, useToday } from '../components/ui';
import { downloadExport } from '../features/data-export/exportData';
import { masteredCount } from '../features/flashcards-srs/srs';
import { visibleStreak } from '../features/learning-progress/streak';
import { CURRICULUM_LANGS, languageName, levelsOf } from '../features/levels/load';
import { downloadNotes, markSent, notesStore, removeNote } from '../features/notes/notes';
import { currentLevelIndex } from '../features/syllabus/syllabus';
import { activityStore } from '../features/today/plan';
import { formatNumber, pick, setLocale, tr, useLocale } from '../i18n/locale';
import {
  createAccountWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOutAndClear,
  useAccount,
} from '../services/cloudSync';
import { appStore, useAppState } from '../stores/appStore';
import { DAILY_GOAL_OPTIONS, levelProgress, setDailyGoal, setSound } from '../stores/appState';
import { fromDayKey, lastNDays } from '../utils/date';
import { GOAL_NAMES } from './WelcomePage';

export function ProfilePage() {
  const state = useAppState();
  const today = useToday();
  const locale = useLocale();
  const theme = themeStore.use();
  const account = useAccount();
  const [confirmReset, setConfirmReset] = useState(false);
  const week = lastNDays(today, 7);
  const maxXp = Math.max(state.dailyGoalXp, ...week.map((d) => state.xpByDay[d] ?? 0));
  const allCards = CURRICULUM_LANGS.reduce((n, l) => n + Object.keys(levelProgress(state, l).cards).length, 0);
  const mastered = CURRICULUM_LANGS.reduce((n, l) => n + masteredCount(levelProgress(state, l).cards), 0);

  return (
    <>
      <div className="page__head">
        <div>
          <p className="eyebrow">{tr('Hồ sơ', 'Me')}</p>
          <h1>{state.profile?.name}</h1>
          {account.email && <p>{account.email}</p>}
        </div>
      </div>
      <div className="grid grid--today">
        <div className="stack">
          <section className="card">
            <div className="stats" style={{ marginTop: 0, gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat"><b>{visibleStreak(state.streak, today)}</b><span>{tr('chuỗi ngày', 'streak')}</span></div>
              <div className="stat"><b>{state.streak.longest}</b><span>{tr('dài nhất', 'longest')}</span></div>
              <div className="stat"><b>{formatNumber(state.totalXp)}</b><span>XP</span></div>
              <div className="stat"><b>{state.lessonsCompleted}</b><span>{tr('bài', 'units')}</span></div>
            </div>
          </section>
          <section className="card">
            <h2><Icon name="progress" /> {tr('7 ngày qua', 'Last 7 days')} <small>{tr(`mục tiêu ${state.dailyGoalXp} XP`, `goal ${state.dailyGoalXp} XP`)}</small></h2>
            <div className="bars">
              {week.map((d) => {
                const xp = state.xpByDay[d] ?? 0;
                return (
                  <div key={d} className="bars__col" data-goal={xp >= state.dailyGoalXp}>
                    <span className="tiny">{xp}</span>
                    <i style={{ height: `${(xp / maxXp) * 100}%` }} />
                    <span>{fromDayKey(d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN', { weekday: 'narrow' })}</span>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="card">
            <h2><Icon name="language" /> {tr('Các ngôn ngữ', 'Languages')} <small>{tr(`${allCards} thẻ · ${mastered} đã nhớ`, `${allCards} cards · ${mastered} mastered`)}</small></h2>
            <div className="list">
              {CURRICULUM_LANGS.map((l) => {
                const p = levelProgress(state, l);
                const levels = levelsOf(l);
                const cur = levels[currentLevelIndex(levels, p)];
                return (
                  <div key={l} className="list-row">
                    <span>
                      <b>{pick(languageName(l))}</b>
                      <small className="muted" style={{ display: 'block' }}>
                        {cur?.code} · {tr(`${Object.keys(p.units).length} bài xong`, `${Object.keys(p.units).length} units done`)}
                      </small>
                    </span>
                    <span className="tag tag--accent zh">{cur?.code}</span>
                  </div>
                );
              })}
            </div>
          </section>
          <AccountCard />
        </div>

        <div className="stack">
          <section className="card stack">
            <h2><Icon name="settings" /> {tr('Cài đặt', 'Settings')}</h2>
            <Setting label={tr('Mục tiêu ngày', 'Daily goal')}>
              {DAILY_GOAL_OPTIONS.map((g) => (
                <button key={g} type="button" className="chip" role="radio" aria-checked={state.dailyGoalXp === g} onClick={() => appStore.update((s) => setDailyGoal(s, g))}>
                  {g} XP · {tr(...GOAL_NAMES[g]!)}
                </button>
              ))}
            </Setting>
            <Setting label={tr('Ngôn ngữ giao diện', 'Interface language')}>
              <button type="button" className="chip" role="radio" aria-checked={locale === 'vi'} onClick={() => setLocale('vi')}>Tiếng Việt</button>
              <button type="button" className="chip" role="radio" aria-checked={locale === 'en'} onClick={() => setLocale('en')}>English</button>
            </Setting>
            <Setting label={tr('Giao diện', 'Theme')}>
              {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                <button key={t} type="button" className="chip" role="radio" aria-checked={theme === t} onClick={() => themeStore.set(t)}>
                  <Icon name={t === 'light' ? 'sun' : t === 'dark' ? 'moon' : 'auto'} size="sm" />
                  {{ light: tr('Sáng', 'Light'), dark: tr('Tối', 'Dark'), system: tr('Theo thiết bị', 'Device') }[t]}
                </button>
              ))}
            </Setting>
            <Setting label={tr('Âm thanh hiệu ứng', 'Sound effects')}>
              <button type="button" className="chip" role="switch" aria-checked={state.soundOn} onClick={() => appStore.update((s) => setSound(s, !s.soundOn))}>
                <Icon name="sound" size="sm" /> {state.soundOn ? tr('Bật', 'On') : tr('Tắt', 'Off')}
              </button>
            </Setting>
          </section>

          <section className="card appcard">
            <AppTile app="note" size="lg" />
            <b>{tr('Ghi chú học tập', 'Study notes')}</b>
            <p>{tr('Từ, quy tắc và chủ đề bạn đã lưu, sẵn sàng gửi sang Olaa Note.', 'Words, rules and topics you saved, ready for Olaa Note.')}</p>
            <div className="row"><a className="btn btn--sm btn--ghost" href="#/notes">{tr('Mở ghi chú', 'Open notes')}</a></div>
          </section>

          <section className="card stack">
            <h2><Icon name="collections" /> {tr('Dữ liệu của bạn', 'Your data')}</h2>
            <button type="button" className="btn btn--ghost" onClick={() => downloadExport(appStore.getState(), account.email)}>
              <Icon name="download" /> {tr('Tải dữ liệu của tôi (JSON)', 'Download my data (JSON)')}
            </button>
            <button type="button" className="btn btn--danger" onClick={() => setConfirmReset(true)}>
              <Icon name="delete" /> {tr('Xoá toàn bộ dữ liệu trên máy này', 'Delete all data on this device')}
            </button>
          </section>
        </div>
      </div>
      {confirmReset && (
        <Dialog
          title={tr('Xoá toàn bộ dữ liệu?', 'Delete all data?')}
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button type="button" className="btn btn--text" data-autofocus onClick={() => setConfirmReset(false)}>{tr('Huỷ', 'Cancel')}</button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  appStore.reset();
                  activityStore.set({});
                  notesStore.set([]);
                  setConfirmReset(false);
                  window.location.hash = '#/';
                }}
              >
                <Icon name="delete" /> {tr('Xoá hết', 'Delete all')}
              </button>
            </>
          }
        >
          <p className="muted">
            {tr(
              'Tiến độ, thẻ từ, lỗi sai và ghi chú trên máy này sẽ mất và không khôi phục được. Dữ liệu đã lưu trong tài khoản Olaa ID không bị xoá.',
              'Progress, cards, mistakes and notes on this device will be gone for good. Data saved in your Olaa ID account is not deleted.',
            )}
          </p>
        </Dialog>
      )}
    </>
  );
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="small muted" style={{ fontWeight: 650, marginBottom: 8 }}>{label}</p>
      <div className="chips" role="radiogroup" aria-label={label}>{children}</div>
    </div>
  );
}

function AccountCard() {
  const account = useAccount();
  const [mode, setMode] = useState<'signin' | 'create' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  if (account.status === 'off') return null;

  const act = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const message = await action();
    setBusy(false);
    setError(message);
  };
  if (account.email)
    return (
      <section className="card stack">
        <h2><Icon name="profile" /> Olaa ID</h2>
        <p className="small">
          {account.status === 'error'
            ? account.error
            : account.status === 'synced'
              ? tr('Tiến độ đã lưu vào tài khoản và đồng bộ giữa các thiết bị.', 'Progress is saved to your account and syncs across devices.')
              : tr('Đang đồng bộ…', 'Syncing…')}
        </p>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => void act(async () => (await signOutAndClear(), null))}>
          <Icon name="logout" /> {tr('Đăng xuất', 'Sign out')}
        </button>
      </section>
    );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'reset')
      return void act(async () => {
        const message = await sendPasswordReset(email);
        if (!message) setNotice(tr('Nếu email có Olaa ID, liên kết đặt lại đang được gửi. Xem cả thư rác.', 'If this email has an Olaa ID, a reset link is on its way. Check spam too.'));
        return message;
      });
    void act(() => (mode === 'signin' ? signInWithEmail(email, password) : createAccountWithEmail(email, password)));
  };
  return (
    <section className="card stack">
      <h2><Icon name="profile" /> Olaa ID</h2>
      <p className="small muted">{tr('Đăng nhập để giữ tiến độ trên mọi thiết bị và để Olaa Habits tự ghi nhận buổi học.', 'Sign in to keep progress on every device and let Olaa Habits record your study.')}</p>
      <button type="button" className="btn" disabled={busy || account.status === 'connecting'} onClick={() => void act(signInWithGoogle)}>
        {tr('Tiếp tục với Google', 'Continue with Google')}
      </button>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field-label">
          Email
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode !== 'reset' && (
          <label className="field-label">
            {tr('Mật khẩu', 'Password')}
            <input className="input" type="password" minLength={6} required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}
        <button type="submit" className="btn btn--ghost" disabled={busy}>
          {mode === 'signin' ? tr('Đăng nhập bằng email', 'Sign in with email') : mode === 'create' ? tr('Tạo tài khoản', 'Create account') : tr('Gửi liên kết đặt lại', 'Send reset link')}
        </button>
      </form>
      <div className="row">
        {mode === 'signin' && <button type="button" className="btn btn--text btn--sm" onClick={() => setMode('reset')}>{tr('Quên mật khẩu?', 'Forgot password?')}</button>}
        <button type="button" className="btn btn--text btn--sm" onClick={() => setMode(mode === 'signin' ? 'create' : 'signin')}>
          {mode === 'signin' ? tr('Tạo tài khoản', 'Create account') : tr('Quay lại đăng nhập', 'Back to sign in')}
        </button>
      </div>
      {notice && <p className="small muted" role="status">{notice}</p>}
      {error && <p className="small" style={{ color: 'var(--warm)' }} role="alert">{error}</p>}
    </section>
  );
}

export function NotesPage() {
  const notes = notesStore.use();
  const state = useAppState();
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const shown = notes.filter((n) => (filter === 'pending' ? n.pending : true) && n.lang === state.levelLang);
  const pending = notes.filter((n) => n.pending);
  return (
    <>
      <a className="back" href="#/me"><Icon name="back" size="sm" />{tr('Hồ sơ', 'Me')}</a>
      <div className="page__head">
        <div>
          <p className="eyebrow">Olaa Note</p>
          <h1>{tr('Ghi chú học tập', 'Study notes')}</h1>
          <p>
            {tr(
              'Ghi chú thuộc Olaa Language và nằm trên máy này. Kênh gửi thẳng sang Olaa Note (lệnh takenote.note.create_from_source) đang chờ duyệt; trong lúc chờ, tải file Markdown rồi nhập vào Note.',
              'Notes belong to Olaa Language and stay on this device. The direct channel to Olaa Note (takenote.note.create_from_source) is awaiting approval; meanwhile, download a Markdown file and import it into Note.',
            )}
          </p>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn"
            disabled={!pending.length}
            onClick={() => {
              downloadNotes(pending, tr('Ghi chú Olaa Language', 'Olaa Language notes'));
              notesStore.set((n) => markSent(n, pending.map((x) => x.id)));
              toast(tr('Đã tải file. Mở Olaa Note → Nhập để thêm vào.', 'File downloaded. In Olaa Note, use Import to add it.'));
            }}
          >
            <Icon name="download" /> {tr(`Xuất ${pending.length} ghi chú mới cho Note`, `Export ${pending.length} new notes for Note`)}
          </button>
          <a className="btn btn--ghost" href={OLAA_APPS.note}>{tr('Mở Olaa Note', 'Open Olaa Note')}</a>
        </div>
      </div>
      <div className="chips" role="radiogroup" style={{ marginBottom: 14 }}>
        <button type="button" className="chip" role="radio" aria-checked={filter === 'all'} onClick={() => setFilter('all')}>
          {tr('Tất cả', 'All')} <span className="count">{notes.filter((n) => n.lang === state.levelLang).length}</span>
        </button>
        <button type="button" className="chip" role="radio" aria-checked={filter === 'pending'} onClick={() => setFilter('pending')}>
          {tr('Chờ gửi', 'Waiting')} <span className="count">{pending.filter((n) => n.lang === state.levelLang).length}</span>
        </button>
        {notes.length > 0 && (
          <button type="button" className="chip" onClick={() => downloadNotes(notes, tr('Ghi chú Olaa Language', 'Olaa Language notes'))}>
            <Icon name="download" size="sm" /> {tr('Tải tất cả (.md)', 'Download all (.md)')}
          </button>
        )}
      </div>
      {shown.length ? (
        <div className="grid grid--tiles">
          {shown.map((n) => (
            <div key={n.id} className="card note-item" style={{ marginTop: 0 }}>
              <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                <b>{n.title}</b>
                <button type="button" className="iconbtn" aria-label={tr(`Xoá ghi chú ${n.title}`, `Delete note ${n.title}`)} onClick={() => notesStore.set((x) => removeNote(x, n.id))}>
                  <Icon name="delete" />
                </button>
              </div>
              <span className="tiny faint">{n.source.title}</span>
              <p>{n.body}</p>
              <div className="row" style={{ gap: 6 }}>
                {n.pending ? <span className="tag tag--warm">{tr('Chờ gửi', 'Waiting')}</span> : <span className="tag tag--accent">{tr('Đã xuất', 'Exported')}</span>}
                {n.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon="note" title={tr('Chưa có ghi chú', 'No notes yet')}>
          {tr('Trong một bài học, bấm “Lưu vào ghi chú” dưới quy tắc, hoặc chạm vào một từ trong bài đọc.', 'In a unit, tap “Save to notes” under a rule, or tap a word in a passage.')}
        </Empty>
      )}
    </>
  );
}
