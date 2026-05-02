'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireContractor } from '@/lib/auth';

export async function submitInvoice(formData: FormData) {
  const jobId = String(formData.get('jobId') ?? '');
  const amount = Number(formData.get('amount'));
  const invoice_number =
    String(formData.get('invoice_number') ?? '').trim() || null;

  if (!jobId || !Number.isFinite(amount) || amount <= 0) {
    redirect(
      `/portal/invoice/${jobId}?error=${encodeURIComponent('A valid amount is required.')}`,
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
      `/portal/invoice/${jobId}?error=${encodeURIComponent('That job is not assigned to this contractor.')}`,
    );
  }

  const { error } = await supabase.from('invoices').insert({
    job_id: jobId,
    contractor_id: user.contractor!.id,
    amount,
    invoice_number,
  });

  if (error) {
    redirect(
      `/portal/invoice/${jobId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  await supabase.from('activity_log').insert({
    job_id: jobId,
    actor: user.contractor!.company_name,
    action: 'invoice_submitted',
    details: { amount, invoice_number },
  });

  revalidatePath('/portal');
  redirect('/portal?submitted=invoice');
}
