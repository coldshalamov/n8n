import clsx from 'clsx';
import { money, pct } from '@/lib/format';

export function BudgetBar({
  spent,
  budget,
  showLabels = true,
  compact = false,
}: {
  spent: number;
  budget: number;
  showLabels?: boolean;
  compact?: boolean;
}) {
  const safeSpent = Number.isFinite(spent) ? Math.max(0, spent) : 0;
  const safeBudget = Number.isFinite(budget) ? Math.max(0, budget) : 0;
  const percent = pct(safeSpent, safeBudget);
  const tone =
    percent >= 100 ? 'bad' : percent >= 90 ? 'warn' : percent >= 70 ? 'accent' : 'ok';

  const bar =
    tone === 'bad'
      ? 'bg-gradient-to-r from-bad/70 to-bad'
      : tone === 'warn'
        ? 'bg-gradient-to-r from-warn/70 to-warn'
        : tone === 'accent'
          ? 'bg-gradient-to-r from-accent/70 to-accent-soft'
          : 'bg-gradient-to-r from-ok/70 to-ok';

  return (
    <div className="space-y-1.5">
      {showLabels && (
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-ink-dim">Budget</span>
          <span className="tabular-nums">
            <span className="text-ink">{money(safeSpent)}</span>
            <span className="text-ink-faint"> / {safeBudget ? money(safeBudget) : 'unbudgeted'}</span>
          </span>
        </div>
      )}
      <div
        className={clsx(
          'relative w-full overflow-hidden rounded-full bg-line',
          compact ? 'h-1' : 'h-1.5',
        )}
      >
        <div
          className={clsx('absolute inset-y-0 left-0 rounded-full transition-all', bar)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-end text-xs tabular-nums text-ink-faint">
          {safeBudget ? `${percent}%` : 'No budget set'}
        </div>
      )}
    </div>
  );
}
