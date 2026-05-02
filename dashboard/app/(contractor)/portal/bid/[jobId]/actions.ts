'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireContractor } from '@/lib/auth';

export async function submitBid(formData: FormData) {
  const jobId = String(formData.get('jobId') ?? '');
  const amount = Number(formData.get('amount'));
  const estimated_days = formData.get('estimated_days')
    ? Number(formData.get('estimated_days'))
    : null;
  const scope_of_work = String(formData.get('scope_of_work') ?? '').trim() || null;

  if (!jobId || !Number.isFinite(amount) || amount <= 0) {
    redirect(
      `/portal/bid/${jobId}?error=${encodeURIComponent('A valid amount is required.')}`,
    );
  }

  const user = await requireContractor();
  const supabase = await createClient();

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, contractor_id')
    .eq('id', jobId)
    .eq('contractor_id', user.contractor!.id)
    .maybeSingle();

  if (jobError || !job) {
    redirect(
      `/portal/bid/${jobId}?error=${encodeURIComponent('That job is not assigned to this contractor.')}`,
    );
  }

  const { error } = await supabase.from('bids').insert({
    job_id: jobId,
    contractor_id: user.contractor!.id,
    amount,
    estimated_days,
    scope_of_work,
  });

  if (error) {
    redirect(
      `/portal/bid/${jobId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  const admin = createAdminClient();
  const { error: statusError } = await admin
    .from('jobs')
    .update({ status: 'bid_received' })
    .eq('id', jobId)
    .eq('contractor_id', user.contractor!.id);

  if (statusError) {
    redirect(
      `/portal/bid/${jobId}?error=${encodeURIComponent(statusError.message)}`,
    );
  }

  await supabase.from('activity_log').insert({
    job_id: jobId,
    actor: user.contractor!.company_name,
    action: 'bid_submitted',
    details: { amount, estimated_days },
  });

  revalidatePath('/portal');
  redirect('/portal?submitted=bid');
}
