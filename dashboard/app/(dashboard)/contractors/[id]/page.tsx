import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, HardHat, Mail, Phone, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Contractor, Invoice, Job, Property } from '@/lib/db.types';
import { JobStatusBadge } from '@/components/StatusBadge';
import { TradePill } from '@/components/TradePill';
import { Rating } from '@/components/Rating';
import { EditContractorButton } from '@/components/dialogs/ContractorDialog';
import { daysUntil, money } from '@/lib/format';

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [contractorRes, jobsRes, invoicesRes, propertiesRes] = await Promise.all([
    supabase.from('contractors').select('*').eq('id', id).single(),
    supabase
      .from('jobs')
      .select('*')
      .eq('contractor_id', id)
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('invoices').select('*').eq('contractor_id', id),
    supabase.from('properties').select('id,address,city,state,zip,status,hero_image_url'),
  ]);

  if (contractorRes.error || !contractorRes.data) notFound();
  const c = contractorRes.data as Contractor;
  const jobs = (jobsRes.data ?? []) as Job[];
  const invoices = (invoicesRes.data ?? []) as Invoice[];
  const properties = (propertiesRes.data ?? []) as Pick<
    Property,
    'id' | 'address' | 'city' | 'state' | 'zip' | 'status' | 'hero_image_url'
  >[];
  const propertyById = new Map(properties.map((p) => [p.id, p]));

  const active = jobs.filter(
    (j) =>
      j.status === 'in_progress' ||
      j.status === 'approved' ||
      j.status === 'inspection' ||
      j.status === 'bid_received',
  );
  const completed = jobs.filter((j) => j.status === 'complete' || j.status === 'paid');
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-8 animate-fade-up">
      <Link
        href="/contractors"
        className="inline-flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Contractors
      </Link>

      <section className="rounded-xl bg-surface ring-1 ring-line p-6 lg:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="grid size-14 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-glow shadow-glow">
              <HardHat className="size-7 text-bg" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
                {c.company_name}
              </h1>
              <div className="mt-1 text-sm text-ink-dim">{c.contact_name ?? '—'}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <TradePill trade={c.trade} />
                <Rating value={c.rating} />
                {c.license_number && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 ring-1 ring-line px-2 py-0.5 text-xs text-ink-dim">
                    <ShieldCheck className="size-3" />
                    {c.license_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <EditContractorButton contractor={c} />
            <div className="text-sm text-ink-dim space-y-1.5">
              {c.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-ink-faint" />
                  {c.email}
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-ink-faint" />
                  {c.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {c.notes && (
          <p className="mt-6 text-sm text-ink-dim leading-relaxed border-t border-line pt-4">
            {c.notes}
          </p>
        )}
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Stat label="Active jobs" value={active.length} accent={active.length > 0} />
        <Stat label="Completed" value={completed.length} />
        <Stat label="Total invoiced" value={money(totalInvoiced)} />
        <Stat label="Paid out" value={money(totalPaid)} />
      </section>

      <section className="rounded-xl bg-surface ring-1 ring-line p-5 lg:p-6 shadow-card">
        <h2 className="text-sm font-medium text-ink-dim uppercase tracking-wider mb-4">
          Jobs ({jobs.length})
        </h2>
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-2/40 p-4 text-sm text-ink-faint">
            No jobs assigned yet.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {jobs.map((j) => {
              const p = j.property_id ? propertyById.get(j.property_id) : null;
              return (
                <div
                  key={j.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-ink">{j.title}</span>
                      <JobStatusBadge status={j.status} />
                    </div>
                    {p && (
                      <Link
                        href={`/properties/${p.id}`}
                        className="mt-0.5 inline-block text-xs text-ink-faint hover:text-ink-dim"
                      >
                        {p.address}
                      </Link>
                    )}
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-sm">
                      {money(j.actual_cost ?? j.estimated_cost)}
                    </div>
                    <div
                      className={`text-xs ${
                        j.due_date && (daysUntil(j.due_date) ?? 0) < 0
                          ? 'text-warn'
                          : 'text-ink-faint'
                      }`}
                    >
                      {j.due_date ? formatDueDate(j.due_date) : '—'}
                    </div>
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

function formatDueDate(iso: string) {
  const days = daysUntil(iso);
  const date = new Date(iso).toLocaleDateString();
  if (days == null) return `Due ${date}`;
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due ${date}`;
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface ring-1 ring-line p-5 shadow-card">
      <div className="text-xs uppercase tracking-wider text-ink-dim">{label}</div>
      <div
        className={`mt-2 text-2xl font-semibold tabular-nums ${
          accent ? 'text-accent-soft' : 'text-ink'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
