'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity';
import { emitN8n } from '@/lib/n8n';
import { ActionResult, withOwnerClient } from './common';

export async function approveBid(bidId: string): Promise<ActionResult> {
  if (!bidId) return { ok: false, error: 'Missing bid id' };
  return withOwnerClient(async ({ supabase, user }) => {
    const { data: bid, error: bidErr } = await supabase
      .from('bids')
      .select('id, job_id, contractor_id, amount, jobs(property_id, title)')
      .eq('id', bidId)
      .maybeSingle();
    if (bidErr || !bid) return { ok: false, error: bidErr?.message ?? 'Bid not found' };

    // Reject all other bids on the same job
    const { error: rejectErr } = await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('job_id', bid.job_id)
      .neq('id', bidId);
    if (rejectErr) return { ok: false, error: rejectErr.message };

    const { error: acceptErr } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bidId);
    if (acceptErr) return { ok: false, error: acceptErr.message };

    // Promote the job: assign winning contractor, set approved, copy bid amount
    const { error: jobErr } = await supabase
      .from('jobs')
      .update({
        contractor_id: bid.contractor_id,
        estimated_cost: bid.amount,
        status: 'approved',
      })
      .eq('id', bid.job_id);
    if (jobErr) return { ok: false, error: jobErr.message };

    const joined = bid.jobs as
      | { property_id: string | null; title: string }
      | { property_id: string | null; title: string }[]
      | null;
    const property = Array.isArray(joined) ? (joined[0] ?? null) : joined;
    await logActivity(supabase, {
      propertyId: property?.property_id ?? null,
      jobId: bid.job_id,
      actor: user.email ?? 'owner',
      action: 'bid_approved',
      details: { bid_id: bidId, amount: bid.amount, contractor_id: bid.contractor_id },
    });
    emitN8n(
      'bid.approved',
      {
        bid_id: bidId,
        job_id: bid.job_id,
        contractor_id: bid.contractor_id,
        amount: bid.amount,
        property_id: property?.property_id,
        title: property?.title,
      },
      user.email,
    );

    if (property?.property_id) revalidatePath(`/properties/${property.property_id}`);
    revalidatePath('/jobs');
    return { ok: true, message: 'Bid approved · job assigned' };
  });
}

export async function rejectBid(bidId: string): Promise<ActionResult> {
  if (!bidId) return { ok: false, error: 'Missing bid id' };
  return withOwnerClient(async ({ supabase, user }) => {
    const { data: bid } = await supabase
      .from('bids')
      .select('job_id, jobs(property_id)')
      .eq('id', bidId)
      .maybeSingle();

    const { error } = await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('id', bidId);
    if (error) return { ok: false, error: error.message };

    const joined = bid?.jobs as
      | { property_id: string | null }
      | { property_id: string | null }[]
      | null
      | undefined;
    const property = Array.isArray(joined) ? (joined[0] ?? null) : (joined ?? null);
    await logActivity(supabase, {
      propertyId: property?.property_id ?? null,
      jobId: bid?.job_id ?? null,
      actor: user.email ?? 'owner',
      action: 'bid_rejected',
      details: { bid_id: bidId },
    });
    emitN8n(
      'bid.rejected',
      { bid_id: bidId, job_id: bid?.job_id ?? null, property_id: property?.property_id },
      user.email,
    );

    if (property?.property_id) revalidatePath(`/properties/${property.property_id}`);
    return { ok: true, message: 'Bid rejected' };
  });
}
