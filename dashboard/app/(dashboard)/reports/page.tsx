import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Bid, Contractor, Invoice, Job, Property } from '@/lib/db.types';
import { TradePill } from '@/components/TradePill';
import { Rating } from '@/components/Rating';
import { PropertyStatusBadge } from '@/components/StatusBadge';
import { daysUntil, money, pct, signedMoney } from '@/lib/format';

export const metadata = { title: 'Reports — RehabOps' };

export default async function ReportsPage() {
  const supabase = await createClient();
  const [propsRes, jobsRes, bidsRes, invoicesRes, contractorsRes] = await Promise.all([
    supabase.from('properties').select('*'),
    supabase.from('jobs').select('*'),
    supabase.from('bids').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('contractors').select('*'),
  ]);

  const properties = (propsRes.data ?? []) as Property[];
  const jobs = (jobsRes.data ?? []) as Job[];
  const bids = (bidsRes.data ?? []) as Bid[];
  const invoices = (invoicesRes.data ?? []) as Invoice[];
  const contractors = (contractorsRes.data ?? []) as Contractor[];

  // Portfolio P&L
  const sold = properties.filter((p) => p.status === 'sold');
  const realizedRevenue = sold.reduce((s, p) => s + Number(p.actual_sale_price ?? 0), 0);
  const realizedCost = sold.reduce(
    (s, p) => s + Number(p.purchase_price ?? 0) + Number(p.total_spent ?? 0),
    0,
  );
  const realizedMargin = realizedRevenue - realizedCost;

  const projectedRevenue = properties
    .filter((p) => p.status !== 'sold')
    .reduce((s, p) => s + Number(p.target_sale_price ?? 0), 0);
  const projectedCost = properties
    .filter((p) => p.status !== 'sold')
    .reduce(
      (s, p) => s + Number(p.purchase_price ?? 0) + Number(p.total_budget ?? 0),
      0,
    );
  const projectedMargin = projectedRevenue - projectedCost;

  const totalCommitted = properties.reduce(
    (s, p) => s + Number(p.purchase_price ?? 0) + Number(p.total_budget ?? 0),
    0,
  );
  const totalSpent = properties.reduce((s, p) => s + Number(p.total_spent ?? 0), 0);

  const pendingPayables = invoices
    .filter((i) => i.status === 'pending' || i.status === 'approved')
    .reduce((s, i) => s + Number(i.amount ?? 0), 0);

  // Per-property P&L rows
  const rows = properties
    .map((p) => {
      const purchase = Number(p.purchase_price ?? 0);
      const budget = Number(p.total_budget ?? 0);
      const spent = Number(p.total_spent ?? 0);
      const sale =
        p.status === 'sold' ? Number(p.actual_sale_price ?? 0) : Number(p.target_sale_price ?? 0);
      const margin = sale - purchase - (p.status === 'sold' ? spent : budget);
      return { p, purchase, budget, spent, sale, margin };
    })
    .sort((a, b) => b.margin - a.margin);

  // Contractor scorecards
  const jobsByContractor = new Map<string, Job[]>();
  for (const j of jobs) {
    if (!j.contractor_id) continue;
    const arr = jobsByContractor.get(j.contractor_id) ?? [];
    arr.push(j);
    jobsByContractor.set(j.contractor_id, arr);
  }
  const bidsByContractor = new Map<string, Bid[]>();
  for (const b of bids) {
    const arr = bidsByContractor.get(b.contractor_id) ?? [];
    arr.push(b);
    bidsByContractor.set(b.contractor_id, arr);
  }
  const invoicesByContractor = new Map<string, Invoice[]>();
  for (const i of invoices) {
    const arr = invoicesByContractor.get(i.contractor_id) ?? [];
    arr.push(i);
    invoicesByContractor.set(i.contractor_id, arr);
  }

  const scorecards = contractors
    .map((c) => {
      const cJobs = jobsByContractor.get(c.id) ?? [];
      const cBids = bidsByContractor.get(c.id) ?? [];
      const cInvoices = invoicesByContractor.get(c.id) ?? [];

      const completedJobs = cJobs.filter((j) => j.status === 'complete' || j.status === 'paid');

      // On-time = completed_date <= due_date
      const ratedForOnTime = completedJobs.filter((j) => j.due_date && j.completed_date);
      const onTime = ratedForOnTime.filter(
        (j) => new Date(j.completed_date!) <= new Date(j.due_date!),
      ).length;
      const onTimePct = ratedForOnTime.length ? (onTime / ratedForOnTime.length) * 100 : null;

      // Overruns: actual_cost vs estimated_cost
      const ratedForOverrun = completedJobs.filter(
        (j) => j.estimated_cost != null && j.actual_cost != null,
      );
      const totalEst = ratedForOverrun.reduce(
        (s, j) => s + Number(j.estimated_cost ?? 0),
        0,
      );
      const totalActual = ratedForOverrun.reduce(
        (s, j) => s + Number(j.actual_cost ?? 0),
        0,
      );
      const overrunPct = totalEst > 0 ? ((totalActual - totalEst) / totalEst) * 100 : null;

      const totalBilled = cInvoices.reduce((s, i) => s + Number(i.amount ?? 0), 0);
      const disputed = cInvoices.filter((i) => i.status === 'disputed').length;
      const disputeRate = cInvoices.length ? (disputed / cInvoices.length) * 100 : 0;

      const acceptedBids = cBids.filter((b) => b.status === 'accepted').length;
      const winRate = cBids.length ? (acceptedBids / cBids.length) * 100 : null;

      return {
        c,
        cJobs,
        completedJobs,
        onTimePct,
        overrunPct,
        totalBilled,
        disputeRate,
        winRate,
      };
    })
    .filter((row) => row.cJobs.length > 0 || row.totalBilled > 0)
    .sort((a, b) => b.totalBilled - a.totalBilled);

  return (
    <div className="space-y-8 animate-fade-up">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-faint">Reports</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          <span className="gradient-text">Operating snapshot</span>
        </h1>
        <p className="mt-1 text-sm text-ink-dim">
          Realized P&L, projected margin, and contractor performance across the portfolio.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card label="Realized" sub={`${sold.length} sold`}>
          <PnL
            revenue={realizedRevenue}
            cost={realizedCost}
            margin={realizedMargin}
            tone={realizedMargin >= 0 ? 'ok' : 'warn'}
          />
        </Card>
        <Card
          label="Projected (active book)"
          sub={`${properties.length - sold.length} active`}
        >
          <PnL
            revenue={projectedRevenue}
            cost={projectedCost}
            margin={projectedMargin}
            tone={projectedMargin >= 0 ? 'accent' : 'warn'}
          />
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI label="Total committed" value={money(totalCommitted)} />
        <KPI label="Spent to date" value={money(totalSpent)} />
        <KPI label="Pending payables" value={money(pendingPayables)} tone="warn" />
        <KPI label="Avg margin / sold" value={money(sold.length ? realizedMargin / sold.length : 0)} />
      </section>

      <section className="rounded-2xl bg-surface ring-1 ring-line shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
            Per-property P&L
          </h2>
          <span className="text-xs text-ink-faint">Sorted by margin</span>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-faint">
            No properties yet.
          </div>
        ) : (
          <>
            {/* Mobile: stacked card list */}
            <div className="divide-y divide-line md:hidden">
              {rows.map(({ p, purchase, budget, spent, sale, margin }) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="block px-5 py-4 transition-colors hover:bg-surface-2/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{p.address}</div>
                      <div className="text-xs text-ink-faint">{p.city ?? ''}</div>
                    </div>
                    <PropertyStatusBadge status={p.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="uppercase tracking-wider text-ink-faint">Purchase</div>
                      <div className="num mt-0.5 text-ink">{money(purchase)}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-ink-faint">
                        {p.status === 'sold' ? 'Spent' : 'Budget'}
                      </div>
                      <div className="num mt-0.5 text-ink">
                        {money(p.status === 'sold' ? spent : budget)}
                        {p.status !== 'sold' && (
                          <span className="ml-1 text-[10px] text-ink-faint">
                            · {pct(spent, budget)}% used
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-ink-faint">Sale</div>
                      <div className="num mt-0.5 text-ink">{money(sale)}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-ink-faint">Margin</div>
                      <div
                        className={`num mt-0.5 font-semibold ${
                          margin >= 0 ? 'text-ok' : 'text-bad'
                        }`}
                      >
                        {margin >= 0 ? (
                          <ArrowUp className="inline size-3" />
                        ) : (
                          <ArrowDown className="inline size-3" />
                        )}{' '}
                        {signedMoney(margin)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Desktop: table */}
            <div
              className="hidden overflow-x-auto md:block"
              style={{ overscrollBehaviorX: 'contain' }}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-ink-faint">
                    <th className="px-5 py-3 font-medium">Property</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Purchase</th>
                    <th className="px-5 py-3 font-medium text-right">Budget / Spent</th>
                    <th className="px-5 py-3 font-medium text-right">Sale</th>
                    <th className="px-5 py-3 font-medium text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p, purchase, budget, spent, sale, margin }) => (
                    <tr
                      key={p.id}
                      className="border-b border-line/60 last:border-b-0 transition-colors hover:bg-surface-2/40"
                    >
                      <td className="px-5 py-3">
                        <Link href={`/properties/${p.id}`} className="text-sm text-ink hover:underline">
                          {p.address}
                        </Link>
                        <div className="text-xs text-ink-faint">{p.city ?? ''}</div>
                      </td>
                      <td className="px-5 py-3">
                        <PropertyStatusBadge status={p.status} />
                      </td>
                      <td className="num px-5 py-3 text-right text-sm">{money(purchase)}</td>
                      <td className="num px-5 py-3 text-right text-sm">
                        <div>{money(p.status === 'sold' ? spent : budget)}</div>
                        <div className="text-xs text-ink-faint">
                          {p.status === 'sold'
                            ? `actual`
                            : `${pct(spent, budget)}% spent`}
                        </div>
                      </td>
                      <td className="num px-5 py-3 text-right text-sm">{money(sale)}</td>
                      <td
                        className={`num px-5 py-3 text-right text-sm font-semibold ${
                          margin >= 0 ? 'text-ok' : 'text-bad'
                        }`}
                      >
                        {margin >= 0 ? <ArrowUp className="inline size-3" /> : <ArrowDown className="inline size-3" />}
                        {' '}
                        {signedMoney(margin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl bg-surface ring-1 ring-line shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
            Contractor scorecards
          </h2>
          <span className="text-xs text-ink-faint">Sorted by total billed</span>
        </div>
        {scorecards.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-faint">
            No contractor activity yet — request bids to start scoring.
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-line">
            {scorecards.map(({ c, completedJobs, onTimePct, overrunPct, totalBilled, disputeRate, winRate }) => {
              const insuranceDays = daysUntil(c.insurance_expiry);
              const insuranceWarn = insuranceDays != null && insuranceDays < 30;
              return (
                <div key={c.id} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-surface-2 ring-1 ring-line">
                      <TrendingUp className="size-4 text-ink-dim" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/contractors/${c.id}`}
                        className="block truncate text-sm font-medium text-ink hover:underline"
                      >
                        {c.company_name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <TradePill trade={c.trade} />
                        <Rating value={c.rating} />
                        {insuranceWarn && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warn/10 px-2 py-0.5 text-[10px] text-warn ring-1 ring-warn/30">
                            <AlertTriangle className="size-3" />
                            Insurance {insuranceDays! < 0 ? 'expired' : `${insuranceDays}d`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Metric
                      label="Total billed"
                      value={money(totalBilled)}
                      tone="default"
                    />
                    <Metric
                      label="On time"
                      value={onTimePct == null ? '—' : `${Math.round(onTimePct)}%`}
                      tone={onTimePct == null ? 'default' : onTimePct >= 80 ? 'ok' : 'warn'}
                      sub={`${completedJobs.length} done`}
                    />
                    <Metric
                      label="Cost vs estimate"
                      value={overrunPct == null ? '—' : `${overrunPct >= 0 ? '+' : ''}${Math.round(overrunPct)}%`}
                      tone={
                        overrunPct == null
                          ? 'default'
                          : overrunPct <= 5
                            ? 'ok'
                            : overrunPct <= 15
                              ? 'warn'
                              : 'bad'
                      }
                    />
                    <Metric
                      label="Win rate"
                      value={winRate == null ? '—' : `${Math.round(winRate)}%`}
                      tone="default"
                      sub={disputeRate > 0 ? `${Math.round(disputeRate)}% disputed` : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PnL({
  revenue,
  cost,
  margin,
  tone,
}: {
  revenue: number;
  cost: number;
  margin: number;
  tone: 'ok' | 'warn' | 'accent';
}) {
  const marginClass = tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-accent-soft';
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-faint">Revenue</div>
        <div className="num mt-1 text-xl font-semibold text-ink">{money(revenue)}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-faint">Cost basis</div>
        <div className="num mt-1 text-xl font-semibold text-ink">{money(cost)}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-faint">Margin</div>
        <div className={`num mt-1 text-xl font-semibold ${marginClass}`}>
          {signedMoney(margin)}
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-5 ring-1 ring-line shadow-card">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
          {label}
        </h3>
        {sub && <span className="text-xs text-ink-faint">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function KPI({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'ok' | 'warn';
}) {
  const cls = tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-ink';
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line shadow-card">
      <div className="text-xs uppercase tracking-wider text-ink-dim">{label}</div>
      <div className={`num mt-2 text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'default',
  sub,
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'ok' | 'warn' | 'bad';
  sub?: string;
}) {
  const cls =
    tone === 'ok'
      ? 'text-ok'
      : tone === 'warn'
        ? 'text-warn'
        : tone === 'bad'
          ? 'text-bad'
          : 'text-ink';
  return (
    <div className="rounded-lg bg-surface-2 p-3 ring-1 ring-line">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className={`num mt-1 text-base font-semibold ${cls}`}>{value}</div>
      {sub && <div className="text-[10px] text-ink-faint">{sub}</div>}
      {!sub && <div className="text-[10px] text-transparent select-none">·</div>}
      {/* CheckCircle marker for visual completeness when tone=ok */}
      {tone === 'ok' && (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-ok">
          <CheckCircle2 className="size-2.5" />
          on track
        </div>
      )}
    </div>
  );
}
