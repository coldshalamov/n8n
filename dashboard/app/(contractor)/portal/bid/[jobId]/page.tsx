import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireContractor } from '@/lib/auth';
import type { Job, Property } from '@/lib/db.types';
import { TradePill } from '@/components/TradePill';
import { submitBid } from './actions';

export default async function BidPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { jobId } = await params;
  const { error } = await searchParams;
  const user = await requireContractor();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('contractor_id', user.contractor!.id)
    .maybeSingle();
  if (!job) notFound();
  const j = job as Job;

  const { data: property } = j.property_id
    ? await supabase
        .from('properties')
        .select('id,address,city')
        .eq('id', j.property_id)
        .maybeSingle()
    : { data: null };
  const p = property as Pick<Property, 'id' | 'address' | 'city'> | null;

  return (
    <div className="space-y-6 animate-fade-up">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> All jobs
      </Link>

      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-faint">Submit bid</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{j.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <TradePill trade={j.trade} />
          {p && <span className="text-xs text-ink-faint">{p.address}</span>}
        </div>
        {j.description && (
          <p className="mt-3 text-sm text-ink-dim leading-relaxed">{j.description}</p>
        )}
      </header>

      <form
        action={submitBid}
        className="space-y-5 rounded-2xl bg-surface ring-1 ring-line p-5 lg:p-6 shadow-card"
      >
        <input type="hidden" name="jobId" value={j.id} />

        <Field
          label="Bid amount (USD)"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
        />

        <Field
          label="Estimated days"
          name="estimated_days"
          type="number"
          min="1"
          placeholder="e.g. 7"
        />

        <FieldArea
          label="Scope of work"
          name="scope_of_work"
          rows={5}
          placeholder="Describe what's included — materials, labor, timeline, exclusions."
        />

        {error && (
          <div className="rounded-lg bg-bad/10 ring-1 ring-bad/30 px-3.5 py-2.5 text-sm text-bad">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-to-br from-accent to-accent-soft px-4 py-2.5 text-sm font-medium text-bg shadow-glow hover:brightness-110"
        >
          Submit bid →
        </button>
      </form>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, name, ...rest } = props;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs font-medium text-ink-dim">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...rest}
        className="w-full rounded-lg bg-surface-2 ring-1 ring-line px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:ring-accent/50"
      />
    </div>
  );
}

function FieldArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string },
) {
  const { label, name, ...rest } = props;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs font-medium text-ink-dim">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        {...rest}
        className="w-full rounded-lg bg-surface-2 ring-1 ring-line px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:ring-accent/50 resize-y"
      />
    </div>
  );
}
