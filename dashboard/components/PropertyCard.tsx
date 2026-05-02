import Link from 'next/link';
import Image from 'next/image';
import { Bed, Bath, Square, MapPin, TrendingUp } from 'lucide-react';
import type { Property } from '@/lib/db.types';
import { PropertyStatusBadge } from './StatusBadge';
import { BudgetBar } from './BudgetBar';
import { formatLocation, moneyShort, pct, signedMoney } from '@/lib/format';

export function PropertyCard({ p }: { p: Property }) {
  const spent = Number(p.total_spent ?? 0);
  const budget = Number(p.total_budget ?? 0);
  const targetProfit =
    Number(p.target_sale_price ?? 0) -
    Number(p.purchase_price ?? 0) -
    Number(p.total_budget ?? 0);
  const budgetPct = pct(spent, budget);
  const isOverBudget = budget > 0 && spent > budget;

  return (
    <Link
      href={`/properties/${p.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line shadow-card transition-all hover:-translate-y-0.5 hover:ring-accent/40 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {p.hero_image_url ? (
          <Image
            src={p.hero_image_url}
            alt={p.address}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-grid-faint bg-[length:22px_22px] text-ink-faint">
            <MapPin className="size-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        {budget > 0 && (
          <div
            className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ${
              isOverBudget
                ? 'bg-bad/15 text-bad ring-bad/30'
                : 'bg-bg/70 text-ink-dim ring-white/10 backdrop-blur'
            }`}
          >
            {budgetPct}% used
          </div>
        )}
        <div className="absolute top-3 right-3">
          <PropertyStatusBadge status={p.status} />
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="line-clamp-2 text-base font-semibold leading-tight tracking-tight text-ink">
            {p.address}
          </div>
          <div className="text-xs text-ink-dim mt-0.5">
            {formatLocation(p) || 'Location pending'}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        <div className="flex items-center gap-4 text-xs text-ink-dim">
          {p.bedrooms != null && (
            <span className="flex items-center gap-1.5">
              <Bed className="size-3.5" />
              {p.bedrooms}
            </span>
          )}
          {p.bathrooms != null && (
            <span className="flex items-center gap-1.5">
              <Bath className="size-3.5" />
              {p.bathrooms}
            </span>
          )}
          {p.square_feet != null && (
            <span className="flex items-center gap-1.5">
              <Square className="size-3.5" />
              {p.square_feet.toLocaleString()} sqft
            </span>
          )}
        </div>

        <BudgetBar spent={spent} budget={budget} compact showLabels={false} />

        <div className="grid grid-cols-3 gap-2 pt-1">
          <Stat label="Purchase" value={moneyShort(p.purchase_price)} />
          <Stat label="Target" value={moneyShort(p.target_sale_price)} accent />
          <Stat label="Spread" value={signedMoney(targetProfit)} icon={<TrendingUp className="size-3" />} />
        </div>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className={`mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums ${
          accent ? 'text-accent-soft' : 'text-ink'
        }`}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}
