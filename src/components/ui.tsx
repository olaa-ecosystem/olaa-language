import type { ReactNode } from 'react';
import { BoltIcon, FlameIcon } from './Icons';
import { tr } from '../i18n/locale';

export function ProgressBar({
  value,
  label,
  variant,
}: {
  value: number;
  label: string;
  variant?: 'gold';
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={`progress ${variant ? `progress--${variant}` : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className="progress__fill" style={{ width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }} />
    </div>
  );
}

export function StreakStat({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={`stat stat--streak ${active ? '' : 'is-off'}`}
      title={
        active
          ? tr('Chuỗi ngày học: hôm nay đã học!', 'Day streak: practised today!')
          : tr('Chuỗi ngày học: học hôm nay để nối dài', 'Day streak: practise today to extend it')
      }
    >
      <FlameIcon />
      {count}
      <span className="visually-hidden">{tr(' ngày liên tiếp', ' day streak')}</span>
    </span>
  );
}

export function XpStat({ xp }: { xp: number }) {
  return (
    <span className="stat stat--xp" title={tr('Tổng XP', 'Total XP')}>
      <BoltIcon />
      {xp}
      <span className="visually-hidden"> XP</span>
    </span>
  );
}

export function EmptyState({
  mascot,
  title,
  children,
}: {
  mascot: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {mascot}
      <h2>{title}</h2>
      {children}
    </div>
  );
}
