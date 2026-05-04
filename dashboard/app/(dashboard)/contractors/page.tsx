import Link from 'next/link';
import { CheckCircle2, Clock3, HardHat, Mail, Phone, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Contractor, Job } from '@/lib/db.types';
import { TradePill } from '@/components/TradePill';
import { Rating } from '@/components/Rating';
import { NewContractorButton } from '@/components/dialogs/ContractorDialog';
import { ContractorFilters } from '@/components/ContractorFilters';
import { daysUntil } from '@/lib/format';

export const metadata = {
  title: 'Contractors — RehabOps',
};

type SearchParams = {
  trade?: string;
  q?: string;
};

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const [contractorsRes, jobsRes] = await Promise.all([
    supabase
      .from('contractors')
      .select('*')
      .order('rating', { ascending: false })
      .order('company_name', { ascending: true }),
    supabase.from('jobs').select('id,contractor_id,status'),
  ]);

  const contractors = (contractorsRes.data ?? []) as Contractor[];
  const jobs = (jobsRes.data ?? []) as Pick<Job, 'id' | 'contractor_id' | 'status'>[];

  const activeByContractor = new Map<string, number>();
  const totalByContractor = new Map<string, number>();
  for (const j of jobs) {
    if (!j.contractor_id) continue;
    totalByContractor.set(
      j.contractor_id,
      (totalByContractor.get(j.contractor_id) ?? 0) + 1,
    );
    if (
      j.status === 'in_progress' ||
      j.status === 'approved' ||
      j.status === 'inspection' ||
      j.status === 'bid_received'
    ) {
      activeByContractor.set(
        j.contractor_id,
        (activeByContractor.get(j.contractor_id) ?? 0) + 1,
      );
    }
  }

  const activeJobCount = [...activeByContractor.values()].reduce((s, n) => s + n, 0);
  const readyContractors = contractors.filter(
    (c) => (activeByContractor.get(c.id) ?? 0) === 0,
  ).length;
  const licensedContractors = contractors.filter((c) => c.license_number).length;

  const trades = [...new Set(contractors.map((c) => c.trade).filter(Boolean) as string[])].sort();

  // Apply filters
  const trade = params.trade ?? '';
  const q = (params.q ?? '').trim().toLowerCase();
  const filtered = contractors.filter((c) => {
    if (trade && c.trade !== trade) return false;
    if (q) {
      const hay = `${c.company_name} ${c.contact_name ?? ''} ${c.email ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-7 animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-faint">Trade network</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            <span className="gradient-text num">{contractors.length}</span> contractors
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Sub-contractors and trades by performance.
          </p>
        </div>
        <NewContractorButton />
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Network" value={contractors.length} icon={<HardHat className="size-4" />} />
        <Summary label="Active jobs" value={activeJobCount} icon={<Clock3 className="size-4" />} accent />
        <Summary label="Bench ready" value={readyContractors} icon={<CheckCircle2 className="size-4" />} />
        <Summary label="Licensed" value={licensedContractors} icon={<ShieldCheck className="size-4" />} />
      </section>

      <ContractorFilters trades={trades} />

      {contractors.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-2/40 p-8 text-center text-sm text-ink-faint">
          No contractors match your filter.
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const active = activeByContractor.get(c.id) ?? 0;
            const total = totalByContractor.get(c.id) ?? 0;
            return (
              <Link
                key={c.id}
                href={`/contractors/${c.id}`}
                className="group rounded-2xl bg-surface ring-1 ring-line shadow-card p-5 transition-all hover:ring-accent/40 hover:shadow-glow hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 ring-1 ring-line text-ink-dim">
                      <HardHat className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{c.company_name}</div>
                      <div className="text-xs text-ink-faint truncate">{c.contact_name ?? '—'}</div>
                    </div>
                  </div>
                  <Rating value={c.rating} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <TradePill trade={c.trade} />
                  {c.license_number && (
                    <span className="inline-flex items-center rounded-md bg-surface-2 ring-1 ring-line px-2 py-0.5 text-xs text-ink-dim">
                      {c.license_number}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-line">
                  <Stat label="Active" value={active} accent={active > 0} />
                  <Stat label="Total jobs" value={total} />
                  <Stat
                    label="Load"
                    value={active > 2 ? 'Hot' : active > 0 ? 'Open' : 'Ready'}
                    accent={active === 0}
                  />
                </div>

                {(c.email || c.phone || c.insurance_expiry) && (
                  <div className="mt-3 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
                    {c.email && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </span>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-3" />
                        {c.phone}
                      </span>
                    )}
                    {c.insurance_expiry && (
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          (daysUntil(c.insurance_expiry) ?? 999) < 30 ? 'text-warn' : ''
                        }`}
                      >
                        <ShieldCheck className="size-3" />
                        {formatInsurance(c.insurance_expiry)}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-line p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line text-ink-faint">
        <HardHat className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-medium">Build your trade bench</h2>
      <p className="mt-1 text-sm text-ink-dim">
        Add contractors so you can request bids, track jobs, and pay invoices through the platform.
      </p>
      <div className="mt-5 flex justify-center">
        <NewContractorButton size="lg" />
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs uppercase tracking-wider text-ink-dim">{label}</div>
        <div className={accent ? 'text-accent-soft' : 'text-ink-dim'}>{icon}</div>
      </div>
      <div className="num mt-2 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className={`num text-sm font-semibold ${accent ? 'text-accent-soft' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}

function formatInsurance(iso: string) {
  const days = daysUntil(iso);
  if (days == null) return 'Insurance on file';
  if (days < 0) return 'Insurance expired';
  if (days <= 30) return `Insurance ${days}d`;
  return 'Insurance active';
}
