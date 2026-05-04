'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logActivity } from '@/lib/activity';
import { emitN8n } from '@/lib/n8n';
import { ActionResult, asInt, asString, withOwnerClient, zodIssue } from './common';

const contractorSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  contact_name: z.string().nullable(),
  email: z.string().email().nullable().or(z.literal('').transform(() => null)),
  phone: z.string().nullable(),
  trade: z.string().nullable(),
  license_number: z.string().nullable(),
  insurance_expiry: z.string().nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  notes: z.string().nullable(),
});

function parseFormData(formData: FormData) {
  return contractorSchema.safeParse({
    company_name: asString(formData.get('company_name')) ?? '',
    contact_name: asString(formData.get('contact_name')),
    email: asString(formData.get('email')),
    phone: asString(formData.get('phone')),
    trade: asString(formData.get('trade')),
    license_number: asString(formData.get('license_number')),
    insurance_expiry: asString(formData.get('insurance_expiry')),
    rating: asInt(formData.get('rating')),
    notes: asString(formData.get('notes')),
  });
}

export async function createContractor(formData: FormData): Promise<ActionResult> {
  const parsed = parseFormData(formData);
  if (!parsed.success) return { ok: false, error: zodIssue(parsed.error) };

  return withOwnerClient(async ({ supabase, user }) => {
    const payload = {
      ...parsed.data,
      rating: parsed.data.rating ?? 3,
    };
    const { data, error } = await supabase
      .from('contractors')
      .insert(payload)
      .select('id, company_name')
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity(supabase, {
      actor: user.email ?? 'owner',
      action: 'contractor_added',
      details: { id: data.id, name: data.company_name },
    });
    emitN8n('contractor.created', { id: data.id, ...payload }, user.email);

    revalidatePath('/contractors');
    return { ok: true, id: data.id, message: 'Contractor added' };
  });
}

export async function updateContractor(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing contractor id' };
  const parsed = parseFormData(formData);
  if (!parsed.success) return { ok: false, error: zodIssue(parsed.error) };

  return withOwnerClient(async ({ supabase, user }) => {
    const { error } = await supabase
      .from('contractors')
      .update({ ...parsed.data, rating: parsed.data.rating ?? 3 })
      .eq('id', id);

    if (error) return { ok: false, error: error.message };

    emitN8n('contractor.updated', { id, ...parsed.data }, user.email);
    revalidatePath(`/contractors/${id}`);
    revalidatePath('/contractors');
    return { ok: true, id, message: 'Contractor updated' };
  });
}

export async function deleteContractor(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing contractor id' };
  return withOwnerClient(async ({ supabase, user }) => {
    const { error } = await supabase.from('contractors').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    emitN8n('contractor.deleted', { id }, user.email);
    revalidatePath('/contractors');
    return { ok: true, message: 'Contractor removed' };
  });
}

export async function createContractorAction(formData: FormData) {
  const result = await createContractor(formData);
  if (!result.ok) {
    redirect(
      `/contractors?dialog=new-contractor&error=${encodeURIComponent(result.error)}`,
    );
  }
  redirect(`/contractors/${result.id}`);
}
