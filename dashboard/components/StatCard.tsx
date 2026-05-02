import clsx from 'clsx';
import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'accent' | 'ok' | 'warn';
}) {
  const ring =
    tone === 'accent'
      ? 'ring-accent/30'
      : tone === 'ok'
        ? 'ring-ok/30'
        : tone === 'warn'
          ? 'ring-warn/30'
          : 'ring-line';

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl bg-surface ring-1 p-4 sm:p-5 shadow-card',
        ring,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 text-xs uppercase tracking-wider text-ink-dim">
          {label}
        </div>
        {icon && <div className="shrink-0 text-ink-dim">{icon}</div>}
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}
