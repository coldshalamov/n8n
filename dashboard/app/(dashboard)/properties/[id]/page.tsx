import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Bed,
  Bath,
  Square,
  ArrowLeft,
  Calendar,
  CircleDollarSign,
  Hammer,
  MapPin,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type {
  ActivityLog,
  Bid,
  BudgetItem,
  Contractor,
  Invoice,
  Job,
  Property,
} from '@/lib/db.types';
import { PropertyStatusBadge, JobStatusBadge } from '@/components/StatusBadge';
import { BudgetBar } from '@/components/BudgetBar';
import { ActivityFeed } from '@/components/ActivityFeed';
import { TradePill } from '@/components/TradePill';
import { daysUntil, formatLocation, money, pct, signedMoney } from '@/lib/format';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [propertyRes, jobsRes, budgetRes, activityRes, bidsRes, invoicesRes, contractorsRes] =
    await Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase
        .from('jobs')
        .select('*')
        .eq('property_id', id)
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('budget_items').select('*').eq('property_id', id),
      supabase
        .from('activity_log')
        .select('*')
        .eq('property_id', id)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase.from('bids').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('contractors').select('*'),
    ]);

  if (propertyRes.error || !propertyRes.data) notFound();
  const property = propertyRes.data as Property;
  const jobs = (jobsRes.data ?? []) as Job[];
  const budget = (budgetRes.data ?? []) as BudgetItem[];
  const activity = (activityRes.data ?? []) as ActivityLog[];
  const allBids = (bidsRes.data ?? []) as Bid[];
  const allInvoices = (invoicesRes.data ?? []) as Invoice[];
  const contractors = (contractorsRes.data ?? []) as Contractor[];

  const jobIds = new Set(jobs.map((j) => j.id));
  const propertyBids = allBids.filter((b) => jobIds.has(b.job_id));
  const propertyInvoices = allInvoices.filter((i) => jobIds.has(i.job_id));
  const contractorById = new Map(contractors.map((c) => [c.id, c]));
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  const spent = Number(property.total_spent ?? 0);
  const totalBudget = Number(property.total_budget ?? 0);
  const remainingBudget = totalBudget - spent;

  const targetMargin =
    Number(property.target_sale_price ?? 0) -
    Number(property.purchase_price ?? 0) -
    totalBudget;
  const unpaidInvoices = propertyInvoices.filter((i) => i.status !== 'paid');
  const openJobs = jobs.filter((j) => j.status !== 'complete' && j.status !== 'paid');

  return (
    <div className="space-y-8 animate-fade-up">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Portfolio
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl ring-1 ring-line shadow-card">
        <div className="relative h-64 sm:h-80 lg:h-96 bg-surface-2">
          {property.hero_image_url ? (
            <Image
              src={property.hero_image_url}
              alt={property.address}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-grid-faint bg-[length:24px_24px] text-ink-faint">
              <MapPin className="size-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
            <div className="mb-3">
              <PropertyStatusBadge status={property.status} size="md" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
              {property.address}
            </h1>
            <p className="mt-1 text-sm text-ink-dim">
              {formatLocation(property) || 'Location pending'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-line">
          <Metric label="Beds"          value={property.bedrooms ?? '—'} icon={<Bed className="size-3.5" />} />
          <Metric label="Baths"         value={property.bathrooms ?? '—'} icon={<Bath className="size-3.5" />} />
          <Metric label="Sqft"          value={property.square_feet?.toLocaleString() ?? '—'} icon={<Square className="size-3.5" />} />
          <Metric label="Purchase"      value={money(property.purchase_price)} />
          <Metric label="Target"        value={money(property.target_sale_price)} accent />
          <Metric label="Target margin" value={money(targetMargin)} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Open jobs"
          value={openJobs.length}
          icon={<Hammer className="size-4" />}
        />
        <MetricCard
          label="Budget reserve"
          value={signedMoney(remainingBudget)}
          tone={remainingBudget < 0 ? 'warn' : 'ok'}
          icon={<CircleDollarSign className="size-4" />}
        />
        <MetricCard
          label="Unpaid invoices"
          value={unpaidInvoices.length}
          tone={unpaidInvoices.length ? 'warn' : 'ok'}
          icon={<ReceiptText className="size-4" />}
        />
        <MetricCard
          label="Target margin"
          value={money(targetMargin)}
          tone={targetMargin < 0 ? 'warn' : 'ok'}
          icon={<TrendingUp className="size-4" />}
        />
      </section>

      {/* Budget summary */}
      <section className="rounded-xl bg-surface ring-1 ring-line p-5 lg:p-6 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
          <h2 className="text-lg font-semibold tracking-tight">Budget</h2>
          <div className="text-sm tabular-nums">
            <span className="text-ink">{money(spent)}</span>
            <span className="text-ink-faint"> spent of </span>
            <span className="text-ink">{money(totalBudget)}</span>
            <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs">
              {pct(spent, totalBudget)}%
            </span>
          </div>
        </div>
        <BudgetBar spent={spent} budget={totalBudget} showLabels={false} />

        {budget.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
            {budget.map((b) => {
              const p = pct(Number(b.actual), Number(b.estimated));
              const overTone =
                p >= 100 ? 'text-bad' : p >= 90 ? 'text-warn' : 'text-ink';
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-sm text-ink-dim capitalize">
                    {b.category}
                  </div>
                  <div className="flex-1">
                    <BudgetBar
                      spent={Number(b.actual)}
                      budget={Number(b.estimated)}
                      showLabels={false}
                      compact
                    />
                  </div>
                  <div className={`w-32 text-right text-xs tabular-nums ${overTone}`}>
                    {money(Number(b.actual))}
                    <span className="text-ink-faint"> / {money(Number(b.estimated))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Two column: jobs & bids on left, activity on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Jobs" count={jobs.length} icon={<Hammer className="size-4" />}>
            {jobs.length === 0 ? (
              <Empty>No jobs assigned to this property yet.</Empty>
            ) : (
              <div className="divide-y divide-line">
                {jobs.map((j) => {
                  const c = j.contractor_id ? contractorById.get(j.contractor_id) : null;
                  return (
                    <div
                      key={j.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-ink">{j.title}</span>
                          <TradePill trade={j.trade} />
                          <JobStatusBadge status={j.status} />
                        </div>
                        <div className="mt-1 text-xs text-ink-faint flex items-center gap-3 flex-wrap">
                          {c && (
                            <Link
                              href={`/contractors/${c.id}`}
                              className="hover:text-ink-dim"
                            >
                              {c.company_name}
                            </Link>
                          )}
                          {j.due_date && (
                            <span
                              className={`inline-flex items-center gap-1 ${
                                (daysUntil(j.due_date) ?? 0) < 0 ? 'text-warn' : ''
                              }`}
                            >
                              <Calendar className="size-3" />
                              {formatDueDate(j.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right sm:min-w-32 tabular-nums">
                        <div className="text-sm text-ink">
                          {money(j.actual_cost ?? j.estimated_cost)}
                        </div>
                        <div className="text-xs text-ink-faint">
                          {j.actual_cost != null ? 'actual' : 'estimated'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {propertyBids.length > 0 && (
            <Section
              title="Open bids"
              count={propertyBids.length}
              icon={<CircleDollarSign className="size-4" />}
            >
              <div className="divide-y divide-line">
                {propertyBids.map((b) => {
                  const c = contractorById.get(b.contractor_id);
                  const j = jobById.get(b.job_id);
                  return (
                    <div
                      key={b.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {c?.company_name ?? 'Unknown contractor'}
                        </div>
                        <div className="text-xs text-ink-faint">
                          {j?.title} · {b.estimated_days ?? '—'} days
                        </div>
                        {b.scope_of_work && (
                          <div className="mt-1 text-xs text-ink-dim">
                            {b.scope_of_work}
                          </div>
                        )}
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-base font-semibold text-accent-soft">
                          {money(b.amount)}
                        </div>
                        <div className="text-xs text-ink-faint capitalize">
                          {b.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {propertyInvoices.length > 0 && (
            <Section
              title="Invoices"
              count={propertyInvoices.length}
              icon={<CircleDollarSign className="size-4" />}
            >
              <div className="divide-y divide-line">
                {propertyInvoices.map((inv) => {
                  const c = contractorById.get(inv.contractor_id);
                  const j = jobById.get(inv.job_id);
                  const tone =
                    inv.status === 'paid'
                      ? 'text-ok'
                      : inv.status === 'approved'
                        ? 'text-info'
                        : inv.status === 'disputed'
                          ? 'text-bad'
                          : 'text-warn';
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className="font-medium">{c?.company_name ?? 'Unknown'}</span>
                          {inv.invoice_number && (
                            <span className="text-ink-faint"> · {inv.invoice_number}</span>
                          )}
                        </div>
                        <div className="text-xs text-ink-faint">{j?.title}</div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-medium">{money(inv.amount)}</div>
                        <div className={`text-xs capitalize ${tone}`}>{inv.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        <aside className="space-y-6">
          <Section title="Activity">
            <ActivityFeed items={activity} />
          </Section>
          {property.notes && (
            <Section title="Notes">
              <p className="text-sm text-ink-dim leading-relaxed whitespace-pre-line">
                {property.notes}
              </p>
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-faint">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 text-base font-semibold tabular-nums ${
          accent ? 'text-accent-soft' : 'text-ink'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'ok' | 'warn';
}) {
  const toneClass =
    tone === 'ok'
      ? 'text-ok'
      : tone === 'warn'
        ? 'text-warn'
        : 'text-ink-dim';

  return (
    <div className="rounded-xl bg-surface p-4 shadow-card ring-1 ring-line">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs uppercase tracking-wider text-ink-dim">{label}</div>
        {icon && <div className={toneClass}>{icon}</div>}
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}

function Section({
  title,
  count,
  icon,
  children,
}: {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-surface ring-1 ring-line p-5 lg:p-6 shadow-card">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-ink-dim uppercase tracking-wider">
          {icon}
          {title}
        </h3>
        {count != null && (
          <span className="text-xs text-ink-faint tabular-nums">{count}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface-2/40 p-4 text-sm text-ink-faint">
      {children}
    </div>
  );
}

function formatDueDate(iso: string) {
  const days = daysUntil(iso);
  const date = new Date(iso).toLocaleDateString();
  if (days == null) return `Due ${date}`;
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due ${date}`;
}
