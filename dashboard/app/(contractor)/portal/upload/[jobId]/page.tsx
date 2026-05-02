import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireContractor } from '@/lib/auth';
import type { Job, Property } from '@/lib/db.types';
import { TradePill } from '@/components/TradePill';
import { UploadForm } from './UploadForm';

export default async function UploadPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
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
        <div className="text-xs uppercase tracking-[0.2em] text-ink-faint">
          Upload photos & documents
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{j.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <TradePill trade={j.trade} />
          {p && <span className="text-xs text-ink-faint">{p.address}</span>}
        </div>
      </header>

      <UploadForm
        jobId={j.id}
        propertyId={j.property_id}
        contractorId={user.contractor!.id}
        contractorName={user.contractor!.company_name}
      />
    </div>
  );
}
