import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Camera, FileSignature, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireContractor } from '@/lib/auth';
import type { Job, Property } from '@/lib/db.types';
import { JobStatusBadge } from '@/components/StatusBadge';
import { TradePill } from '@/components/TradePill';
import { money } from '@/lib/format';

export const metadata = { title: 'My jobs — RehabOps' };

export default async function PortalHome() {
  const user = await requireContractor();
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('contractor_id', user.contractor!.id)
    .order('due_date', { ascending: true, nullsFirst: false });

  const list = (jobs ?? []) as Job[];
  const propertyIds = [...new Set(list.map((j) => j.property_id).filter(Boolean) as string[])];

  const properties: Pick<Property, 'id' | 'address' | 'city' | 'hero_image_url'>[] =
    propertyIds.length === 0
      ? []
      : ((await supabase
          .from('properties')
          .select('id,address,city,hero_image_url')
          .in('id', propertyIds)).data ?? []) as Pick<Property, 'id' | 'address' | 'city' | 'hero_image_url'>[];

  const propertyById = new Map(properties.map((p) => [p.id, p]));

  const open = list.filter(
    (j) => j.status !== 'paid' && j.status !== 'complete',
  );
  const past = list.filter(
    (j) => j.status === 'paid' || j.status === 'complete',
  );

  return (
    <div className="space-y-7 animate-fade-up">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-faint">
          Welcome back
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {user.contractor!.company_name}
        </h1>
        <p className="mt-1 text-sm text-ink-dim">
          {open.length} open {open.length === 1 ? 'job' : 'jobs'} ·{' '}
          {past.length} completed
        </p>
      </header>

      {open.length === 0 && past.length === 0 && (
        <div className="rounded-2xl bg-surface ring-1 ring-line p-10 text-center">
          <h2 className="text-lg font-medium">No jobs yet</h2>
          <p className="mt-1 text-sm text-ink-dim">
            You'll see assigned jobs here once the owner adds them.
          </p>
        </div>
      )}

      {open.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-ink-dim uppercase tracking-wider">
            Open
          </h2>
          {open.map((j) => (
            <JobItem key={j.id} job={j} property={j.property_id ? propertyById.get(j.property_id) : null} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-ink-dim uppercase tracking-wider">
            Completed
          </h2>
          {past.map((j) => (
            <JobItem
              key={j.id}
              job={j}
              property={j.property_id ? propertyById.get(j.property_id) : null}
              dim
            />
          ))}
        </section>
      )}
    </div>
  );
}

function JobItem({
  job,
  property,
  dim = false,
}: {
  job: Job;
  property: Pick<Property, 'id' | 'address' | 'city' | 'hero_image_url'> | null | undefined;
  dim?: boolean;
}) {
  const showActions =
    job.status !== 'paid' &&
    job.status !== 'complete';

  const showBidLink =
    job.status === 'pending' || job.status === 'bid_requested';

  const showInvoiceLink =
    job.status === 'in_progress' ||
    job.status === 'inspection' ||
    job.status === 'approved';

  return (
    <article
      className={`rounded-2xl bg-surface ring-1 ring-line shadow-card overflow-hidden ${
        dim ? 'opacity-70' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {property?.hero_image_url && (
          <div className="relative w-full sm:w-40 aspect-[16/9] sm:aspect-auto sm:h-auto bg-surface-2 shrink-0">
            <Image
              src={property.hero_image_url}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-4 sm:p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink">{job.title}</span>
            <TradePill trade={job.trade} />
            <JobStatusBadge status={job.status} />
          </div>
          {property && (
            <div className="mt-1 text-xs text-ink-faint">
              {property.address}
              {property.city ? `, ${property.city}` : ''}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-ink-dim">
            {job.due_date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Due {new Date(job.due_date).toLocaleDateString()}
              </span>
            )}
            {(job.estimated_cost || job.actual_cost) && (
              <span className="tabular-nums">
                {money(job.actual_cost ?? job.estimated_cost)}
              </span>
            )}
          </div>

          {showActions && (
            <div className="mt-4 flex flex-wrap gap-2">
              {showBidLink && (
                <ActionLink
                  href={`/portal/bid/${job.id}`}
                  icon={<FileSignature className="size-3.5" />}
                  primary
                >
                  Submit bid
                </ActionLink>
              )}
              {showInvoiceLink && (
                <ActionLink
                  href={`/portal/invoice/${job.id}`}
                  icon={<Receipt className="size-3.5" />}
                  primary
                >
                  Submit invoice
                </ActionLink>
              )}
              <ActionLink
                href={`/portal/upload/${job.id}`}
                icon={<Camera className="size-3.5" />}
              >
                Upload photos
              </ActionLink>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ActionLink({
  href,
  icon,
  children,
  primary = false,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? 'inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-accent to-accent-soft px-3 py-1.5 text-xs font-medium text-bg shadow-glow hover:brightness-110'
          : 'inline-flex items-center gap-1.5 rounded-lg bg-surface-2 ring-1 ring-line px-3 py-1.5 text-xs text-ink-dim hover:text-ink'
      }
    >
      {icon}
      {children}
    </Link>
  );
}
