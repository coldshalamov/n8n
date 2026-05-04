'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity';
import { emitN8n } from '@/lib/n8n';
import { ActionResult, withOwnerClient } from './common';
import type { InvoiceStatus } from '@/lib/db.types';

const STATUS: InvoiceStatus[] = ['pending', 'approved', 'paid', 'disputed'];

export async function setInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
): Promise<ActionResult> {
  if (!invoiceId) return { ok: false, error: 'Missing invoice id' };
  if (!STATUS.includes(status)) return { ok: false, error: 'Invalid status' };

  return withOwnerClient(async ({ supabase, user }) => {
    const { data: prev } = await supabase
      .from('invoices')
      .select('amount, job_id, contractor_id, jobs(property_id), status')
      .eq('id', invoiceId)
      .maybeSingle();
    if (!prev) return { ok: false, error: 'Invoice not found' };

    const update: Record<string, unknown> = { status };
    if (status === 'paid' && prev.status !== 'paid') {
      update.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('invoices')
      .update(update)
      .eq('id', invoiceId);
    if (error) return { ok: false, error: error.message };

    const joined = prev.jobs as
      | { property_id: string | null }
      | { property_id: string | null }[]
      | null
      | undefined;
    const propertyId = Array.isArray(joined)
      ? (joined[0]?.property_id ?? null)
      : (joined?.property_id ?? null);

    // When paid, bump the job's actual_cost & the property's total_spent.
    if (status === 'paid' && prev.status !== 'paid' && prev.job_id) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('actual_cost, property_id')
        .eq('id', prev.job_id)
        .maybeSingle();
      const newActual = Number(jobs?.actual_cost ?? 0) + Number(prev.amount ?? 0);
      await supabase
        .from('jobs')
        .update({ actual_cost: newActual })
        .eq('id', prev.job_id);

      if (propertyId) {
        const { data: prop } = await supabase
          .from('properties')
          .select('total_spent')
          .eq('id', propertyId)
          .maybeSingle();
        const newSpent = Number(prop?.total_spent ?? 0) + Number(prev.amount ?? 0);
        await supabase
          .from('properties')
          .update({ total_spent: newSpent })
          .eq('id', propertyId);
      }
    }

    await logActivity(supabase, {
      propertyId,
      jobId: prev.job_id ?? null,
      actor: user.email ?? 'owner',
      action: `invoice_${status}`,
      details: { invoice_id: invoiceId, amount: prev.amount },
    });
    const event =
      status === 'approved'
        ? 'invoice.approved'
        : status === 'paid'
          ? 'invoice.paid'
          : status === 'disputed'
            ? 'invoice.disputed'
            : null;
    if (event) {
      emitN8n(
        event,
        {
          invoice_id: invoiceId,
          job_id: prev.job_id,
          contractor_id: prev.contractor_id,
          amount: prev.amount,
          property_id: propertyId,
        },
        user.email,
      );
    }

    if (propertyId) revalidatePath(`/properties/${propertyId}`);
    revalidatePath('/');
    return { ok: true, message: `Invoice ${status}` };
  });
}
