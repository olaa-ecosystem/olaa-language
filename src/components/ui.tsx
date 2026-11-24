import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { tr } from '../i18n/locale';
import { toDayKey } from '../utils/date';
import { isSpeechSupported, speak, type SpeechLang } from '../utils/speech';
import { Icon, type IconName } from './Icon';

/* ---------- progress ---------- */

export function Ring({
  value,
  size = 64,
  width = 7,
  warm,
  children,
  label,
}: {
  value: number;
  size?: number;
  width?: number;
  warm?: boolean;
  children?: ReactNode;
  label?: string;
}) {
  const r = (size - width) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="ring-wrap" role="img" aria-label={label}>
      <svg className={`ring${warm ? ' ring--warm' : ''}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={width} />
        <circle
          className="fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={width}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <span className="ring-label">{children}</span>}
    </span>
  );
}

export function Bar({ value, warm, label }: { value: number; warm?: boolean; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`bar${warm ? ' bar--warm' : ''}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- Olaa app tiles (same look as Olaa Note's) ---------- */

export type OlaaApp = 'lang' | 'note' | 'habit';

export function AppTile({ app, size, open }: { app: OlaaApp; size?: 'sm' | 'lg'; open?: boolean }) {
  const cls = `apptile apptile--${app}${size ? ` ${size}` : ''}`;
  const glyph =
    app === 'lang' ? <span className="gl">Aa</span> : app === 'habit' ? <Icon name="ring" /> : <Icon name="note" />;
  if (open)
    return (
      <span className={`${cls} apptile--open`}>
        {glyph}
        {app === 'lang' ? 'Language' : app === 'note' ? 'Note' : 'Habits'}
      </span>
    );
  return (
    <span className={cls} aria-hidden="true">
      {glyph}
    </span>
  );
}

/* ---------- text ---------- */

function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
    );
}

/** The content's light formatting: **bold**, line breaks, "•"/"-" bullets. Text only, never HTML. */
export function RichText({ text, lang }: { text: string; lang?: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {bullets.map((b, i) => (
            <li key={i}>{inline(b)}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };
  for (const line of text.split('\n')) {
    const bullet = /^\s*(?:[•·]|-\s)\s*(.*)$/.exec(line);
    if (bullet) {
      bullets.push(bullet[1] ?? '');
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p-${blocks.length}`}>{inline(line)}</p>);
  }
  flush();
  return (
    <div className="rich" lang={lang}>
      {blocks}
    </div>
  );
}

/* ---------- buttons ---------- */

export function SpeakButton({ text, lang, slow, label }: { text: string; lang: SpeechLang; slow?: boolean; label?: string }) {
  if (!isSpeechSupported()) return null;
  const name = label ?? (slow ? tr(`Nghe chậm: ${text}`, `Listen slowly: ${text}`) : tr(`Nghe: ${text}`, `Listen: ${text}`));
  return (
    <button type="button" className="iconbtn" aria-label={name} title={name} onClick={() => speak(text, lang, slow)}>
      <Icon name={slow ? 'slow' : 'sound'} />
    </button>
  );
}

export function IconButton({ icon, label, onClick, pressed }: { icon: IconName; label: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button type="button" className="iconbtn" aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}>
      <Icon name={icon} />
    </button>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a className="back" href={to}>
      <Icon name="back" size="sm" />
      {children}
    </a>
  );
}

/* ---------- dialog & toast ---------- */

export function Dialog({ title, children, actions, onClose }: { title: string; children?: ReactNode; actions: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="dialog-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title" ref={ref}>
        <h2 id="dlg-title">{title}</h2>
        {children}
        <div className="row row--end">{actions}</div>
      </div>
    </div>
  );
}

let toastMessage: string | null = null;
const toastListeners = new Set<() => void>();
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const setToast = (m: string | null) => {
  toastMessage = m;
  toastListeners.forEach((l) => l());
};

export function toast(message: string): void {
  setToast(message);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setToast(null), 2400);
}

export function Toasts() {
  const message = useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => toastListeners.delete(l);
    },
    () => toastMessage,
    () => null,
  );
  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}

/* ---------- states ---------- */

export function Empty({ icon = 'collections', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <h3>{title}</h3>
      {children && <div className="small" style={{ marginTop: 6 }}>{children}</div>}
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <div className="stack" role="status" aria-label={label ?? tr('Đang tải…', 'Loading…')}>
      <div className="skeleton" />
      <div className="skeleton" style={{ height: 140 }} />
    </div>
  );
}

export type Async<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error' };

/** Runs a loader when its key changes. */
export function useAsync<T>(load: () => Promise<T>, key: string): Async<T> {
  const [state, setState] = useState<{ key: string; value: Async<T> }>({ key, value: { status: 'loading' } });
  useEffect(() => {
    let live = true;
    load().then(
      (data) => live && setState({ key, value: { status: 'ready', data } }),
      () => live && setState({ key, value: { status: 'error' } }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state.key === key ? state.value : { status: 'loading' };
}

/** Today's day key, refreshed every minute so the app rolls over at midnight. */
export function useToday(): string {
  const [day, setDay] = useState(() => toDayKey(new Date()));
  useEffect(() => {
    const id = setInterval(() => setDay(toDayKey(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);
  return day;
}

export function Confetti() {
  const colors = ['#82c3a6', '#f3bd90', '#f3e2b3', '#dcd6ea', '#d8835d', '#4e8d73'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 9) * 0.08}s`,
            animationDuration: `${1.8 + (i % 5) * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}
