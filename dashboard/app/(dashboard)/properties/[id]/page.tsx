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
  Send,
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
import { ActivityFeed } from '@/components/ActivityFeed';
import { TradePill } from '@/components/TradePill';
import { PropertyStatusMenu } from '@/components/PropertyStatusMenu';
import { JobStatusMenu } from '@/components/JobStatusMenu';
import { EditPropertyButton } from '@/components/dialogs/PropertyDialog';
import { NewJobButton, EditJobButton } from '@/components/dialogs/JobDialog';
import { RequestBidsButton } from '@/components/dialogs/RequestBidsDialog';
import { BidActions } from '@/components/BidActions';
import { InvoiceActions } from '@/components/InvoiceActions';
import { BudgetEditor } from '@/components/BudgetEditor';
import { NoteComposer } from '@/components/NoteComposer';
import { daysUntil, formatLocation, money, signedMoney } from '@/lib/format';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [propertyRes, jobsRes, budgetRes, activityRes, bidsRes, invoicesRes, contractorsRes, allPropertiesRes] =
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
        .limit(25),
      supabase.from('bids').select('*').order('submitted_at', { ascending: false }),
      supabase.from('invoices').select('*'),
      supabase.from('contractors').select('*').order('company_name'),
      supabase.from('properties').select('id,address').order('address'),
    ]);

  if (propertyRes.error || !propertyRes.data) notFound();
  const property = propertyRes.data as Property;
  const jobs = (jobsRes.data ?? []) as Job[];
  const budget = (budgetRes.data ?? []) as BudgetItem[];
  const activity = (activityRes.data ?? []) as ActivityLog[];
  const allBids = (bidsRes.data ?? []) as Bid[];
  const allInvoices = (invoicesRes.data ?? []) as Invoice[];
  const contractors = (contractorsRes.data ?? []) as Contractor[];
  const allProperties = (allPropertiesRes.data ?? []) as Pick<Property, 'id' | 'address'>[];

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

  const contractorOptions = contractors.map((c) => ({
    id: c.id,
    company_name: c.company_name,
    trade: c.trade,
    rating: c.rating,
  }));

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Portfolio
        </Link>
        <div className="flex items-center gap-2">
          <RequestBidsButton propertyId={property.id} contractors={contractorOptions} />
          <NewJobButton
            properties={allProperties}
            contractors={contractorOptions}
            defaultPropertyId={property.id}
          />
          <EditPropertyButton property={property} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl ring-1 ring-line shadow-card">
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
              <PropertyStatusMenu propertyId={property.id} status={property.status} />
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
          <Metric label="Beds" value={property.bedrooms ?? '—'} icon={<Bed className="size-3.5" />} />
          <Metric label="Baths" value={property.bathrooms ?? '—'} icon={<Bath className="size-3.5" />} />
          <Metric
            label="Sqft"
            value={property.square_feet?.toLocaleString() ?? '—'}
            icon={<Square className="size-3.5" />}
          />
          <Metric label="Purchase" value={money(property.purchase_price)} />
          <Metric label="Target" value={money(property.target_sale_price)} accent />
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

      {/* Budget */}
      <section className="rounded-2xl bg-surface ring-1 ring-line p-5 lg:p-6 shadow-card">
        <BudgetEditor
          propertyId={property.id}
          items={budget}
          totalBudget={totalBudget}
          totalSpent={spent}
        />
      </section>

      {/* Two column: jobs & bids on left, activity on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section
            title="Jobs"
            count={jobs.length}
            icon={<Hammer className="size-4" />}
            action={
              <NewJobButton
                size="sm"
                label="Add"
                properties={allProperties}
                contractors={contractorOptions}
                defaultPropertyId={property.id}
              />
            }
          >
            {jobs.length === 0 ? (
              <Empty>No jobs yet. Add one or fan out a bid request.</Empty>
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">{j.title}</span>
                          <TradePill trade={j.trade} />
                          <JobStatusMenu jobId={j.id} status={j.status} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
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
                      <div className="flex items-center gap-3">
                        <div className="text-right num">
                          <div className="text-sm text-ink">
                            {money(j.actual_cost ?? j.estimated_cost)}
                          </div>
                          <div className="text-xs text-ink-faint">
                            {j.actual_cost != null ? 'actual' : 'estimated'}
                          </div>
                        </div>
                        <EditJobButton
                          job={j}
                          properties={allProperties}
                          contractors={contractorOptions}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {propertyBids.length > 0 && (
            <Section
              title="Bids"
              count={propertyBids.length}
              icon={<Send className="size-4" />}
            >
              <div className="divide-y divide-line">
                {propertyBids.map((b) => {
                  const c = contractorById.get(b.contractor_id);
                  const j = jobById.get(b.job_id);
                  return (
                    <div
                      key={b.id}
                      className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink">
                          {c?.company_name ?? 'Unknown contractor'}
                        </div>
                        <div className="text-xs text-ink-faint">
                          {j?.title ?? 'Bid'} · {b.estimated_days ?? '—'} days
                        </div>
                        {b.scope_of_work && (
                          <div className="mt-1 line-clamp-2 text-xs text-ink-dim">
                            {b.scope_of_work}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right num">
                          <div className="text-base font-semibold text-accent-soft">
                            {money(b.amount)}
                          </div>
                          <div className="text-xs capitalize text-ink-faint">
                            {b.status}
                          </div>
                        </div>
                        <BidActions bidId={b.id} status={b.status} />
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
                      className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className="font-medium">
                            {c?.company_name ?? 'Unknown'}
                          </span>
                          {inv.invoice_number && (
                            <span className="text-ink-faint"> · {inv.invoice_number}</span>
                          )}
                        </div>
                        <div className="text-xs text-ink-faint">{j?.title}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right num">
                          <div className="text-sm font-medium text-ink">
                            {money(inv.amount)}
                          </div>
                          <div className={`text-xs capitalize ${tone}`}>{inv.status}</div>
                        </div>
                        <InvoiceActions invoiceId={inv.id} status={inv.status} />
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
            <NoteComposer propertyId={property.id} />
            <div className="mt-4">
              <ActivityFeed items={activity} />
            </div>
          </Section>
          {property.notes && (
            <Section title="Notes">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-dim">
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
        className={`num mt-1 text-base font-semibold ${
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
    tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-ink-dim';

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs uppercase tracking-wider text-ink-dim">{label}</div>
        {icon && <div className={toneClass}>{icon}</div>}
      </div>
      <div className="num mt-2 text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function Section({
  title,
  count,
  icon,
  action,
  children,
}: {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-surface ring-1 ring-line p-5 lg:p-6 shadow-card">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-ink-dim">
          {icon}
          {title}
          {count != null && (
            <span className="num text-xs text-ink-faint">{count}</span>
          )}
        </h3>
        {action}
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
