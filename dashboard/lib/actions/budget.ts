'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { emitN8n } from '@/lib/n8n';
import { ActionResult, asNumber, asString, withOwnerClient, zodIssue } from './common';

const itemSchema = z.object({
  property_id: z.string().uuid(),
  category: z.string().min(2, 'Category required'),
  estimated: z.number().nullable(),
  actual: z.number().nullable(),
  notes: z.string().nullable(),
});

export async function upsertBudgetItem(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = itemSchema.safeParse({
    property_id: asString(formData.get('property_id')),
    category: asString(formData.get('category')) ?? '',
    estimated: asNumber(formData.get('estimated')),
    actual: asNumber(formData.get('actual')),
    notes: asString(formData.get('notes')),
  });
  if (!parsed.success) return { ok: false, error: zodIssue(parsed.error) };

  return withOwnerClient(async ({ supabase, user }) => {
    if (id) {
      const { error } = await supabase
        .from('budget_items')
        .update({
          category: parsed.data.category,
          estimated: parsed.data.estimated ?? 0,
          actual: parsed.data.actual ?? 0,
          notes: parsed.data.notes,
        })
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from('budget_items').insert({
        property_id: parsed.data.property_id,
        category: parsed.data.category,
        estimated: parsed.data.estimated ?? 0,
        actual: parsed.data.actual ?? 0,
        notes: parsed.data.notes,
      });
      if (error) return { ok: false, error: error.message };
    }

    // Roll the property's total_budget = sum(estimated)
    const { data: items } = await supabase
      .from('budget_items')
      .select('estimated')
      .eq('property_id', parsed.data.property_id);
    const total = (items ?? []).reduce(
      (s, r) => s + Number((r as { estimated: number }).estimated ?? 0),
      0,
    );
    await supabase
      .from('properties')
      .update({ total_budget: total })
      .eq('id', parsed.data.property_id);

    emitN8n('budget_item.upserted', { ...parsed.data, id }, user.email);

    revalidatePath(`/properties/${parsed.data.property_id}`);
    return { ok: true, message: 'Budget saved' };
  });
}

export async function deleteBudgetItem(
  id: string,
  propertyId: string,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing item id' };
  return withOwnerClient(async ({ supabase, user }) => {
    const { error } = await supabase.from('budget_items').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };

    const { data: items } = await supabase
      .from('budget_items')
      .select('estimated')
      .eq('property_id', propertyId);
    const total = (items ?? []).reduce(
      (s, r) => s + Number((r as { estimated: number }).estimated ?? 0),
      0,
    );
    await supabase
      .from('properties')
      .update({ total_budget: total })
      .eq('id', propertyId);

    emitN8n('budget_item.deleted', { id, property_id: propertyId }, user.email);
    revalidatePath(`/properties/${propertyId}`);
    return { ok: true, message: 'Budget item removed' };
  });
}

export async function addNote(
  propertyId: string,
  note: string,
): Promise<ActionResult> {
  if (!propertyId) return { ok: false, error: 'Missing property id' };
  const trimmed = note.trim();
  if (!trimmed) return { ok: false, error: 'Note cannot be empty' };

  return withOwnerClient(async ({ supabase, user }) => {
    const { error } = await supabase.from('activity_log').insert({
      property_id: propertyId,
      actor: user.email ?? 'owner',
      action: 'note_added',
      details: { note: trimmed },
    });
    if (error) return { ok: false, error: error.message };

    emitN8n('note.added', { property_id: propertyId, note: trimmed }, user.email);

    revalidatePath(`/properties/${propertyId}`);
    return { ok: true, message: 'Note added' };
  });
}
