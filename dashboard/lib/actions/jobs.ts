'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logActivity } from '@/lib/activity';
import { emitN8n } from '@/lib/n8n';
import { ActionResult, asNumber, asString, withOwnerClient, zodIssue } from './common';
import type { JobStatus } from '@/lib/db.types';

const STATUS_VALUES = [
  'pending',
  'bid_requested',
  'bid_received',
  'approved',
  'in_progress',
  'inspection',
  'complete',
  'paid',
] as const;

const jobSchema = z.object({
  property_id: z.string().uuid().nullable(),
  contractor_id: z.string().uuid().nullable().or(z.literal('').transform(() => null)),
  title: z.string().min(2, 'Title is required'),
  description: z.string().nullable(),
  trade: z.string().nullable(),
  status: z.enum(STATUS_VALUES),
  estimated_cost: z.number().nullable(),
  actual_cost: z.number().nullable(),
  start_date: z.string().nullable(),
  due_date: z.string().nullable(),
  notes: z.string().nullable(),
});

function parseJobForm(formData: FormData) {
  return jobSchema.safeParse({
    property_id: asString(formData.get('property_id')),
    contractor_id: asString(formData.get('contractor_id')),
    title: asString(formData.get('title')) ?? '',
    description: asString(formData.get('description')),
    trade: asString(formData.get('trade')),
    status: (asString(formData.get('status')) ?? 'pending') as JobStatus,
    estimated_cost: asNumber(formData.get('estimated_cost')),
    actual_cost: asNumber(formData.get('actual_cost')),
    start_date: asString(formData.get('start_date')),
    due_date: asString(formData.get('due_date')),
    notes: asString(formData.get('notes')),
  });
}

export async function createJob(formData: FormData): Promise<ActionResult> {
  const parsed = parseJobForm(formData);
  if (!parsed.success) return { ok: false, error: zodIssue(parsed.error) };

  return withOwnerClient(async ({ supabase, user }) => {
    const { data, error } = await supabase
      .from('jobs')
      .insert(parsed.data)
      .select('id, title, property_id')
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity(supabase, {
      propertyId: data.property_id,
      jobId: data.id,
      actor: user.email ?? 'owner',
      action: 'job_created',
      details: { title: data.title, trade: parsed.data.trade },
    });
    emitN8n('job.created', { id: data.id, ...parsed.data }, user.email);

    if (data.property_id) revalidatePath(`/properties/${data.property_id}`);
    revalidatePath('/jobs');
    return { ok: true, id: data.id, message: 'Job created' };
  });
}

export async function updateJob(id: string, formData: FormData): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing job id' };
  const parsed = parseJobForm(formData);
  if (!parsed.success) return { ok: false, error: zodIssue(parsed.error) };

  return withOwnerClient(async ({ supabase, user }) => {
    const { data: prev } = await supabase
      .from('jobs')
      .select('status, property_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('jobs')
      .update(parsed.data)
      .eq('id', id);

    if (error) return { ok: false, error: error.message };

    if (prev?.status !== parsed.data.status) {
      await logActivity(supabase, {
        propertyId: prev?.property_id,
        jobId: id,
        actor: user.email ?? 'owner',
        action: parsed.data.status === 'complete' ? 'job_completed' : 'status_changed',
        details: { from: prev?.status, to: parsed.data.status },
      });
      emitN8n(
        parsed.data.status === 'complete' ? 'job.completed' : 'job.status_changed',
        { id, from: prev?.status, to: parsed.data.status },
        user.email,
      );
    }

    emitN8n('job.updated', { id, ...parsed.data }, user.email);
    if (prev?.property_id) revalidatePath(`/properties/${prev.property_id}`);
    revalidatePath('/jobs');
    return { ok: true, id, message: 'Job updated' };
  });
}

export async function changeJobStatus(id: string, status: JobStatus): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing job id' };
  if (!STATUS_VALUES.includes(status)) return { ok: false, error: 'Invalid status' };

  return withOwnerClient(async ({ supabase, user }) => {
    const { data: prev } = await supabase
      .from('jobs')
      .select('status, property_id, title')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('jobs').update({ status }).eq('id', id);
    if (error) return { ok: false, error: error.message };

    await logActivity(supabase, {
      propertyId: prev?.property_id,
      jobId: id,
      actor: user.email ?? 'owner',
      action: status === 'complete' ? 'job_completed' : 'status_changed',
      details: { from: prev?.status, to: status, job: prev?.title },
    });
    emitN8n(
      status === 'complete' ? 'job.completed' : 'job.status_changed',
      { id, from: prev?.status, to: status, title: prev?.title },
      user.email,
    );

    if (prev?.property_id) revalidatePath(`/properties/${prev.property_id}`);
    revalidatePath('/jobs');
    return { ok: true, id, message: `Status: ${status.replace(/_/g, ' ')}` };
  });
}

export async function deleteJob(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing job id' };
  return withOwnerClient(async ({ supabase, user }) => {
    const { data: prev } = await supabase
      .from('jobs')
      .select('property_id, title')
      .eq('id', id)
      .maybeSingle();
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    emitN8n('job.deleted', { id, title: prev?.title }, user.email);
    if (prev?.property_id) revalidatePath(`/properties/${prev.property_id}`);
    revalidatePath('/jobs');
    return { ok: true, message: 'Job deleted' };
  });
}

/**
 * Multi-contractor bid request fanout. Creates one job per contractor in
 * `bid_requested` status (or, if a single base job already exists, dups it),
 * logs activity, and emits a bid.requested webhook the n8n workflow can handle
 * to send SMS/email blasts via HighLevel.
 */
const requestBidsSchema = z.object({
  property_id: z.string().uuid(),
  title: z.string().min(2),
  trade: z.string().nullable(),
  description: z.string().nullable(),
  estimated_cost: z.number().nullable(),
  due_date: z.string().nullable(),
  contractor_ids: z.array(z.string().uuid()).min(1),
});

export async function requestBids(input: {
  property_id: string;
  title: string;
  trade: string | null;
  description: string | null;
  estimated_cost: number | null;
  due_date: string | null;
  contractor_ids: string[];
}): Promise<ActionResult> {
  const parsed = requestBidsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodIssue(parsed.error) };

  return withOwnerClient(async ({ supabase, user }) => {
    const rows = parsed.data.contractor_ids.map((cid) => ({
      property_id: parsed.data.property_id,
      contractor_id: cid,
      title: parsed.data.title,
      trade: parsed.data.trade,
      description: parsed.data.description,
      estimated_cost: parsed.data.estimated_cost,
      due_date: parsed.data.due_date,
      status: 'bid_requested' as JobStatus,
    }));

    const { data, error } = await supabase
      .from('jobs')
      .insert(rows)
      .select('id, contractor_id');

    if (error) return { ok: false, error: error.message };

    const created = (data ?? []) as { id: string; contractor_id: string }[];

    await Promise.all(
      created.map((j) =>
        logActivity(supabase, {
          propertyId: parsed.data.property_id,
          jobId: j.id,
          actor: user.email ?? 'owner',
          action: 'bid_requested',
          details: {
            title: parsed.data.title,
            trade: parsed.data.trade,
            contractor_id: j.contractor_id,
          },
        }),
      ),
    );

    emitN8n(
      'bid.requested',
      {
        property_id: parsed.data.property_id,
        title: parsed.data.title,
        trade: parsed.data.trade,
        description: parsed.data.description,
        estimated_cost: parsed.data.estimated_cost,
        due_date: parsed.data.due_date,
        jobs: created,
      },
      user.email,
    );

    revalidatePath(`/properties/${parsed.data.property_id}`);
    revalidatePath('/jobs');
    return {
      ok: true,
      message: `Bid request sent to ${created.length} contractor${created.length === 1 ? '' : 's'}`,
    };
  });
}

export async function createJobAction(formData: FormData) {
  const result = await createJob(formData);
  if (!result.ok) {
    const propId = formData.get('property_id');
    const target = propId ? `/properties/${propId}` : '/jobs';
    redirect(`${target}?error=${encodeURIComponent(result.error)}`);
  }
}
