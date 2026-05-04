import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Hammer,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Contractor, Job, JobStatus, Property } from '@/lib/db.types';
import { TradePill } from '@/components/TradePill';
import { JobStatusMenu } from '@/components/JobStatusMenu';
import { NewJobButton, EditJobButton } from '@/components/dialogs/JobDialog';
import { daysUntil, jobStatusLabel, money } from '@/lib/format';

export const metadata = { title: 'Jobs — RehabOps' };

type SearchParams = {
  status?: string;
  trade?: string;
  property?: string;
  contractor?: string;
  q?: string;
};

const STATUS_FILTERS: { key: string; label: string; statuses: JobStatus[] }[] = [
  { key: 'all', label: 'All', statuses: [] },
  {
    key: 'open',
    label: 'Open',
    statuses: ['pending', 'bid_requested', 'bid_received', 'approved', 'in_progress', 'inspection'],
  },
  { key: 'overdue', label: 'Overdue', statuses: [] },
  { key: 'in_progress', label: 'In progress', statuses: ['in_progress', 'inspection'] },
  { key: 'bidding', label: 'Bidding', statuses: ['bid_requested', 'bid_received'] },
  { key: 'complete', label: 'Complete', statuses: ['complete', 'paid'] },
];

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const [jobsRes, contractorsRes, propertiesRes] = await Promise.all([
    supabase.from('jobs').select('*').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('contractors').select('*').order('company_name'),
    supabase.from('properties').select('id,address').order('address'),
  ]);

  const jobs = (jobsRes.data ?? []) as Job[];
  const contractors = (contractorsRes.data ?? []) as Contractor[];
  const properties = (propertiesRes.data ?? []) as Pick<Property, 'id' | 'address'>[];

  const propertyById = new Map(properties.map((p) => [p.id, p]));
  const contractorById = new Map(contractors.map((c) => [c.id, c]));

  const filterKey = params.status ?? 'open';
  const trade = params.trade ?? '';
  const propertyId = params.property ?? '';
  const contractorId = params.contractor ?? '';
  const q = (params.q ?? '').trim().toLowerCase();

  let filtered = jobs;
  if (filterKey === 'overdue') {
    filtered = filtered.filter((j) => {
      const days = daysUntil(j.due_date);
      const open = j.status !== 'complete' && j.status !== 'paid';
      return open && days != null && days < 0;
    });
  } else {
    const filter = STATUS_FILTERS.find((f) => f.key === filterKey);
    if (filter && filter.statuses.length > 0) {
      const set = new Set(filter.statuses);
      filtered = filtered.filter((j) => set.has(j.status));
    }
  }
  if (trade) filtered = filtered.filter((j) => j.trade === trade);
  if (propertyId) filtered = filtered.filter((j) => j.property_id === propertyId);
  if (contractorId) filtered = filtered.filter((j) => j.contractor_id === contractorId);
  if (q) {
    filtered = filtered.filter((j) =>
      `${j.title} ${j.description ?? ''}`.toLowerCase().includes(q),
    );
  }

  const counts = {
    open: jobs.filter((j) => j.status !== 'complete' && j.status !== 'paid').length,
    overdue: jobs.filter((j) => {
      const days = daysUntil(j.due_date);
      return j.status !== 'complete' && j.status !== 'paid' && days != null && days < 0;
    }).length,
    bidding: jobs.filter((j) => j.status === 'bid_requested' || j.status === 'bid_received').length,
    complete: jobs.filter((j) => j.status === 'complete' || j.status === 'paid').length,
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-faint">Operations</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            <span className="gradient-text num">{counts.open}</span> open jobs
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Bids, schedules, change orders. Click status to advance.
          </p>
        </div>
        <NewJobButton properties={properties} contractors={contractors} />
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Open" value={counts.open} icon={<Hammer className="size-4" />} />
        <KPI
          label="Overdue"
          value={counts.overdue}
          icon={<AlertTriangle className="size-4" />}
          tone={counts.overdue > 0 ? 'warn' : 'default'}
        />
        <KPI label="Bidding" value={counts.bidding} icon={<Clock3 className="size-4" />} />
        <KPI label="Complete" value={counts.complete} icon={<CheckCircle2 className="size-4" />} tone="ok" />
      </section>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((f) => {
          const active = filterKey === f.key;
          const count =
            f.key === 'open'
              ? counts.open
              : f.key === 'overdue'
                ? counts.overdue
                : f.key === 'bidding'
                  ? counts.bidding
                  : f.key === 'complete'
                    ? counts.complete
                    : f.key === 'all'
                      ? jobs.length
                      : null;
          return (
            <Link
              key={f.key}
              href={{ pathname: '/jobs', query: { ...params, status: f.key } }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-surface text-ink ring-1 ring-line'
                  : 'text-ink-dim hover:text-ink'
              }`}
            >
              {f.label}
              {count != null && (
                <span className="num ml-1.5 text-ink-faint">{count}</span>
              )}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <section className="rounded-2xl bg-surface p-10 text-center text-sm text-ink-faint ring-1 ring-line shadow-card">
          No jobs match. Adjust filters or create a new job.
        </section>
      ) : (
        <>
          {/* Mobile / tablet: card-stacked list */}
          <section className="space-y-3 md:hidden">
            {filtered.map((j) => {
              const p = j.property_id ? propertyById.get(j.property_id) : null;
              const c = j.contractor_id ? contractorById.get(j.contractor_id) : null;
              const overdue =
                j.status !== 'complete' && j.status !== 'paid' && j.due_date && (daysUntil(j.due_date) ?? 0) < 0;
              return (
                <div
                  key={j.id}
                  className="rounded-2xl bg-surface p-4 ring-1 ring-line shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{j.title}</span>
                        <TradePill trade={j.trade} />
                      </div>
                      {j.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-ink-faint">
                          {j.description}
                        </div>
                      )}
                    </div>
                    <EditJobButton
                      job={j}
                      properties={properties}
                      contractors={contractors}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/60 pt-3 text-xs">
                    <div>
                      <div className="uppercase tracking-wider text-ink-faint">Property</div>
                      <div className="mt-0.5 truncate">
                        {p ? (
                          <Link href={`/properties/${p.id}`} className="text-ink-dim hover:text-ink">
                            {p.address}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-ink-faint">Contractor</div>
                      <div className="mt-0.5 truncate">
                        {c ? (
                          <Link href={`/contractors/${c.id}`} className="text-ink-dim hover:text-ink">
                            {c.company_name}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">— Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-ink-faint">Cost</div>
                      <div className="num mt-0.5 text-ink">
                        {money(j.actual_cost ?? j.estimated_cost)}
                        <span className="ml-1 text-[10px] text-ink-faint">
                          {j.actual_cost != null ? 'actual' : 'est'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-ink-faint">Due</div>
                      <div
                        className={`mt-0.5 ${overdue ? 'text-warn' : 'text-ink-dim'}`}
                      >
                        {j.due_date ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDue(j.due_date)}
                          </span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-line/60 pt-3">
                    <JobStatusMenu jobId={j.id} status={j.status} />
                  </div>
                </div>
              );
            })}
          </section>

          {/* Desktop: table */}
          <section className="hidden overflow-hidden rounded-2xl bg-surface ring-1 ring-line shadow-card md:block">
            <div className="overflow-x-auto" style={{ overscrollBehaviorX: 'contain' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-ink-faint">
                    <th className="px-5 py-3 font-medium">Job</th>
                    <th className="px-5 py-3 font-medium">Property</th>
                    <th className="px-5 py-3 font-medium">Contractor</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Cost</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((j) => {
                    const p = j.property_id ? propertyById.get(j.property_id) : null;
                    const c = j.contractor_id ? contractorById.get(j.contractor_id) : null;
                    const overdue =
                      j.status !== 'complete' && j.status !== 'paid' && j.due_date && (daysUntil(j.due_date) ?? 0) < 0;
                    return (
                      <tr
                        key={j.id}
                        className="border-b border-line/60 transition-colors last:border-b-0 hover:bg-surface-2/50"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink">{j.title}</span>
                            <TradePill trade={j.trade} />
                          </div>
                          {j.description && (
                            <div className="mt-0.5 line-clamp-1 text-xs text-ink-faint">
                              {j.description}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-ink-dim">
                          {p ? (
                            <Link href={`/properties/${p.id}`} className="hover:text-ink">
                              {p.address}
                            </Link>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-ink-dim">
                          {c ? (
                            <Link href={`/contractors/${c.id}`} className="hover:text-ink">
                              {c.company_name}
                            </Link>
                          ) : (
                            <span className="text-ink-faint">— Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <JobStatusMenu jobId={j.id} status={j.status} />
                        </td>
                        <td className="num px-5 py-3 text-right text-sm">
                          <div className="text-ink">
                            {money(j.actual_cost ?? j.estimated_cost)}
                          </div>
                          <div className="text-[10px] text-ink-faint">
                            {j.actual_cost != null ? 'actual' : 'estimated'}
                          </div>
                        </td>
                        <td className={`px-5 py-3 text-xs ${overdue ? 'text-warn' : 'text-ink-faint'}`}>
                          {j.due_date ? (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDue(j.due_date)}
                            </span>
                          ) : (
                            <span>{jobStatusLabel(j.status)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <EditJobButton
                            job={j}
                            properties={properties}
                            contractors={contractors}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function formatDue(iso: string) {
  const days = daysUntil(iso);
  if (days == null) return iso;
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function KPI({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'default' | 'ok' | 'warn';
}) {
  const toneClass = tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-ink-dim';
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line shadow-card">
      <div className="flex items-start justify-between">
        <span className="text-xs uppercase tracking-wider text-ink-dim">{label}</span>
        <span className={toneClass}>{icon}</span>
      </div>
      <div className="num mt-2 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
