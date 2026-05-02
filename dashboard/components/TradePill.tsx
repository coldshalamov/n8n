import clsx from 'clsx';
import { tradeLabel } from '@/lib/format';

const TRADE_TONE: Record<string, string> = {
  plumbing:   'bg-info/10      text-info       ring-info/30',
  electrical: 'bg-warn/10      text-warn       ring-warn/30',
  roofing:    'bg-purple-500/10 text-purple-300 ring-purple-500/30',
  painting:   'bg-cyan-500/10  text-cyan-300   ring-cyan-500/30',
  flooring:   'bg-accent/10    text-accent-soft ring-accent/30',
  general:    'bg-ok/10        text-ok         ring-ok/30',
  hvac:       'bg-pink-500/10  text-pink-300   ring-pink-500/30',
};

export function TradePill({ trade }: { trade: string | null }) {
  if (!trade) return null;
  const tone = TRADE_TONE[trade.toLowerCase()] ?? 'bg-ink-faint/10 text-ink-dim ring-ink-faint/20';
  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1', tone)}>
      {tradeLabel(trade)}
    </span>
  );
}
