import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Hammer,
  Route,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { ActivityLog, Invoice, Job, Property } from '@/lib/db.types';
import { ActivityFeed } from '@/components/ActivityFeed';
import { PropertyCard } from '@/components/PropertyCard';
import { StatCard } from '@/components/StatCard';
import { NewPropertyButton } from '@/components/dialogs/PropertyDialog';
import { PortfolioFilters } from '@/components/PortfolioFilters';
import {
  daysUntil,
  externalUrl,
  money,
  pct,
  propertyStatusLabel,
  relativeDate,
  signedMoney,
} from '@/lib/format';

export const metadata = {
  title: 'Portfolio — RehabOps',
};

const STATUS_ORDER: Property['status'][] = [
  'in_progress',
  'permitting',
  'punch_list',
  'listing',
  'acquired',
  'sold',
];

const ACTIVE_JOB_STATUSES = new Set<Job['status']>([
  'approved',
  'in_progress',
  'inspection',
  'bid_received',
]);

type SearchParams = {
  status?: string;
  q?: string;
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const n8nUrl = externalUrl(process.env.NEXT_PUBLIC_N8N_URL);

  const [propertiesRes, jobsRes, invoicesRes, activityRes] = await Promise.all([
    supabase.from('properties').select('*').order('created_at', { ascending: false }),
    supabase.from('jobs').select('*').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('invoices').select('*'),
    supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  if (propertiesRes.error) {
    return <ErrorState message={propertiesRes.error.message} />;
  }

  const list = (propertiesRes.data ?? []) as Property[];
  const jobs = (jobsRes.data ?? []) as Job[];
  const invoices = (invoicesRes.data ?? []) as Invoice[];
  const activity = (activityRes.data ?? []) as ActivityLog[];

  const active = list.filter((p) => p.status !== 'sold');
  const sold = list.filter((p) => p.status === 'sold');
  const totalBudget = list.reduce((s, p) => s + Number(p.total_budget ?? 0), 0);
  const totalSpent = list.reduce((s, p) => s + Number(p.total_spent ?? 0), 0);
  const budgetDelta = totalBudget - totalSpent;
  const openJobs = jobs.filter((j) => j.status !== 'complete' && j.status !== 'paid');
  const activeJobs = jobs.filter((j) => ACTIVE_JOB_STATUSES.has(j.status));
  const overdueJobs = openJobs.filter((j) => {
    const dueIn = daysUntil(j.due_date);
    return dueIn != null && dueIn < 0;
  });
  const pendingInvoices = invoices.filter((i) => i.status === 'pending' || i.status === 'approved');
  const payableAmount = pendingInvoices.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const realizedMargin = sold.reduce(
    (s, p) =>
      s +
      (Number(p.actual_sale_price ?? 0) -
        Number(p.purchase_price ?? 0) -
        Number(p.total_spent ?? 0)),
    0,
  );

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: list.filter((p) => p.status === status).length,
  })).filter(({ count }) => count > 0);

  // Filter & search applied to the displayed grid (KPIs still reflect full portfolio).
  const q = (params.q ?? '').trim().toLowerCase();
  const statusFilter = (params.status ?? '') as Property['status'] | '';
  const filtered = list.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (q) {
      const hay = `${p.address} ${p.city ?? ''} ${p.state ?? ''} ${p.zip ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    const aRank = STATUS_ORDER.indexOf(a.status);
    const bRank = STATUS_ORDER.indexOf(b.status);
    return (aRank === -1 ? STATUS_ORDER.length : aRank) - (bRank === -1 ? STATUS_ORDER.length : bRank);
  });

  const radarItems = [
    {
      label: overdueJobs.length ? 'Field attention' : 'Field clear',
      value: overdueJobs.length ? `${overdueJobs.length} overdue` : 'On schedule',
      tone: overdueJobs.length ? 'warn' : 'ok',
      icon: overdueJobs.length ? AlertTriangle : CheckCircle2,
      detail:
        overdueJobs[0]?.title ??
        `${activeJobs.length} active ${activeJobs.length === 1 ? 'job' : 'jobs'}`,
    },
    {
      label: budgetDelta < 0 ? 'Budget pressure' : 'Budget reserve',
      value: signedMoney(budgetDelta),
      tone: budgetDelta < 0 ? 'warn' : 'ok',
      icon: BadgeDollarSign,
      detail: `${pct(totalSpent, totalBudget)}% of rehab budget used`,
    },
    {
      label: pendingInvoices.length ? 'Payables queue' : 'Payables clear',
      value: money(payableAmount),
      tone: pendingInvoices.length ? 'accent' : 'ok',
      icon: Clock3,
      detail: `${pendingInvoices.length} invoice${pendingInvoices.length === 1 ? '' : 's'} awaiting owner action`,
    },
  ] as const;

  return (
    <div className="space-y-8 animate-fade-up">
      <header className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-7 lg:p-8">
        <div className="absolute right-0 top-0 h-44 w-72 bg-gradient-to-bl from-accent/15 to-transparent" />
        <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-ink-faint ring-1 ring-line">
              <Sparkles className="size-3 text-accent-soft" />
              Owner cockpit
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              <span className="gradient-text num">{active.length}</span>{' '}
              <span className="text-ink">active rehab{active.length === 1 ? '' : 's'}</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-dim">
              Portfolio health, contractor load, payables, and n8n automation pulse — one operating view.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <NewPropertyButton />
              {n8nUrl ? (
                <a
                  href="/n8n"
                  className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3.5 py-2 text-sm font-medium text-ink-dim ring-1 ring-line transition-colors hover:bg-surface-3 hover:text-ink"
                >
                  <Workflow className="size-4" />
                  n8n builder
                  <ExternalLink className="size-3.5 text-ink-faint" />
                </a>
              ) : (
                <span className="rounded-lg bg-warn/10 px-3.5 py-2 text-xs text-warn ring-1 ring-warn/30">
                  Set NEXT_PUBLIC_N8N_URL to enable the builder shortcut.
                </span>
              )}
            </div>
          </div>
          <div className="grid min-w-56 grid-cols-2 gap-2 rounded-xl bg-bg/55 p-2.5 ring-1 ring-line backdrop-blur">
            <MiniMetric label="Open jobs" value={openJobs.length} />
            <MiniMetric label="Automation" value={activity.length ? 'Live' : 'Quiet'} accent />
            <MiniMetric label="Sold" value={sold.length} />
            <MiniMetric label="Overdue" value={overdueJobs.length} warn={overdueJobs.length > 0} />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Active"
          value={active.length}
          hint="Properties in flight"
          icon={<Building2 className="size-4" />}
          tone="accent"
        />
        <StatCard
          label="Rehab budget"
          value={money(totalBudget)}
          hint={`${pct(totalSpent, totalBudget)}% consumed`}
          icon={<Hammer className="size-4" />}
          tone={totalSpent > totalBudget ? 'warn' : 'default'}
        />
        <StatCard
          label="Payables"
          value={money(payableAmount)}
          hint={`${pendingInvoices.length} queued`}
          icon={<BadgeDollarSign className="size-4" />}
          tone={pendingInvoices.length ? 'accent' : 'ok'}
        />
        <StatCard
          label="Realized margin"
          value={money(realizedMargin)}
          hint={`${sold.length} sold`}
          icon={<TrendingUp className="size-4" />}
          tone={realizedMargin >= 0 ? 'ok' : 'warn'}
        />
      </section>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
                    Pipeline
                  </h2>
                  <p className="mt-1 text-xs text-ink-faint">
                    Stage mix by property count
                  </p>
                </div>
                <Route className="size-4 text-ink-faint" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {statusCounts.map(({ status, count }) => (
                  <div key={status} className="rounded-lg bg-surface-2 p-3 ring-1 ring-line">
                    <div className="num text-2xl font-semibold text-ink">{count}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-faint">
                      {propertyStatusLabel(status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
                    n8n engine room
                  </h2>
                  <p className="mt-1 text-xs text-ink-faint">
                    Last run {activity[0] ? relativeDate(activity[0].created_at) : 'waiting'}
                  </p>
                </div>
                <Zap className="size-4 text-accent-soft" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniMetric label="Events" value={activity.length} />
                <MiniMetric
                  label="Bids"
                  value={
                    jobs.filter(
                      (j) => j.status === 'bid_requested' || j.status === 'bid_received',
                    ).length
                  }
                />
                <MiniMetric label="Invoices" value={pendingInvoices.length} accent />
              </div>
              {n8nUrl && (
                <a
                  href={n8nUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs font-medium text-ink-dim ring-1 ring-line transition hover:text-ink"
                >
                  Open workflows
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {radarItems.map(({ label, value, detail, tone, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ink-faint">
                      {label}
                    </div>
                    <div className="num mt-2 text-xl font-semibold text-ink">{value}</div>
                  </div>
                  <div
                    className={`grid size-9 place-items-center rounded-lg ring-1 ${
                      tone === 'warn'
                        ? 'bg-warn/10 text-warn ring-warn/30'
                        : tone === 'accent'
                          ? 'bg-accent/10 text-accent-soft ring-accent/30'
                          : 'bg-ok/10 text-ok ring-ok/30'
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                </div>
                <p className="mt-2 line-clamp-1 text-xs text-ink-faint">{detail}</p>
              </div>
            ))}
          </section>

          <PortfolioFilters />

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {sorted.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-line bg-surface-2/40 p-8 text-center text-sm text-ink-faint">
                  No properties match your filter.
                </div>
              ) : (
                sorted.map((p) => <PropertyCard key={p.id} p={p} />)
              )}
            </div>
            <aside className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line xl:sticky xl:top-8 xl:self-start">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
                  Live activity
                </h2>
                <Activity className="size-4 text-ink-faint" />
              </div>
              <ActivityFeed items={activity} />
            </aside>
          </section>
        </>
      )}
    </div>
  );
}

function MiniMetric({
  label,
  value,
  accent = false,
  warn = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2 ring-1 ring-line">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className={`num mt-0.5 text-sm font-semibold ${
          warn ? 'text-warn' : accent ? 'text-accent-soft' : 'text-ink'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-line p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line text-ink-faint">
        <Building2 className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-medium">Add your first property</h2>
      <p className="mt-1 text-sm text-ink-dim">
        Drop in an address. Track rehab budget, jobs, contractors, and invoices end to end.
      </p>
      <div className="mt-5 flex justify-center">
        <NewPropertyButton size="lg" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-bad/10 ring-1 ring-bad/30 p-6">
      <h2 className="font-medium text-bad">Couldn’t load properties</h2>
      <p className="mt-1 text-sm text-ink-dim">{message}</p>
      <p className="mt-3 text-xs text-ink-faint">
        Most common cause: schema.sql hasn’t been run yet, or RLS is blocking
        unauthenticated requests. Make sure you’re signed in and the schema is
        applied.
      </p>
    </div>
  );
}
