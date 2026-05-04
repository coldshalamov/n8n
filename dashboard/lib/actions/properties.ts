'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logActivity } from '@/lib/activity';
import { emitN8n } from '@/lib/n8n';
import { ActionResult, asInt, asNumber, asString, withOwnerClient, zodIssue } from './common';
import type { PropertyStatus } from '@/lib/db.types';

const STATUS_VALUES = [
  'acquired',
  'permitting',
  'in_progress',
  'punch_list',
  'listing',
  'sold',
] as const;

const propertySchema = z.object({
  address: z.string().min(3, 'Address is required'),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  status: z.enum(STATUS_VALUES),
  purchase_price: z.number().nullable(),
  target_sale_price: z.number().nullable(),
  actual_sale_price: z.number().nullable(),
  total_budget: z.number().nullable(),
  square_feet: z.number().int().nullable(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().nullable(),
  hero_image_url: z.string().url().nullable().or(z.literal('').transform(() => null)),
  notes: z.string().nullable(),
});

function parseFormData(formData: FormData) {
  return propertySchema.safeParse({
    address: asString(formData.get('address')) ?? '',
    city: asString(formData.get('city')),
    state: asString(formData.get('state')),
    zip: asString(formData.get('zip')),
    status: (asString(formData.get('status')) ?? 'acquired') as PropertyStatus,
    purchase_price: asNumber(formData.get('purchase_price')),
    target_sale_price: asNumber(formData.get('target_sale_price')),
    actual_sale_price: asNumber(formData.get('actual_sale_price')),
    total_budget: asNumber(formData.get('total_budget')),
    square_feet: asInt(formData.get('square_feet')),
    bedrooms: asInt(formData.get('bedrooms')),
    bathrooms: asNumber(formData.get('bathrooms')),
    hero_image_url: asString(formData.get('hero_image_url')),
    notes: asString(formData.get('notes')),
  });
}

export async function createProperty(formData: FormData): Promise<ActionResult> {
  const parsed = parseFormData(formData);
  if (!parsed.success) return { ok: false, error: zodIssue(parsed.error) };

  return withOwnerClient(async ({ supabase, user }) => {
    const { data, error } = await supabase
      .from('properties')
      .insert(parsed.data)
      .select('id, address, status')
      .single();

    if (error) return { ok: false, error: error.message };

    await logActivity(supabase, {
      propertyId: data.id,
      actor: user.email ?? 'owner',
      action: 'property_created',
      details: { address: data.address, status: data.status },
    });
    emitN8n('property.created', { id: data.id, ...parsed.data }, user.email);

    revalidatePath('/');
    return { ok: true, id: data.id, message: 'Property created' };
  });
}

export async function updateProperty(id: string, formData: FormData): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing property id' };
  const parsed = parseFormData(formData);
  if (!parsed.success) return { ok: false, error: zodIssue(parsed.error) };

  return withOwnerClient(async ({ supabase, user }) => {
    const { data: prev } = await supabase
      .from('properties')
      .select('status')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('properties')
      .update(parsed.data)
      .eq('id', id);

    if (error) return { ok: false, error: error.message };

    await logActivity(supabase, {
      propertyId: id,
      actor: user.email ?? 'owner',
      action: 'property_updated',
      details: { fields: Object.keys(parsed.data) },
    });
    emitN8n('property.updated', { id, ...parsed.data }, user.email);

    if (prev?.status && prev.status !== parsed.data.status) {
      await logActivity(supabase, {
        propertyId: id,
        actor: user.email ?? 'owner',
        action: 'status_changed',
        details: { from: prev.status, to: parsed.data.status },
      });
      emitN8n(
        parsed.data.status === 'sold' ? 'property.sold' : 'property.status_changed',
        { id, from: prev.status, to: parsed.data.status },
        user.email,
      );
    }

    revalidatePath(`/properties/${id}`);
    revalidatePath('/');
    return { ok: true, id, message: 'Property updated' };
  });
}

export async function changePropertyStatus(
  id: string,
  status: PropertyStatus,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing property id' };
  if (!STATUS_VALUES.includes(status)) return { ok: false, error: 'Invalid status' };

  return withOwnerClient(async ({ supabase, user }) => {
    const { data: prev } = await supabase
      .from('properties')
      .select('status, address')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('properties')
      .update({ status })
      .eq('id', id);

    if (error) return { ok: false, error: error.message };

    await logActivity(supabase, {
      propertyId: id,
      actor: user.email ?? 'owner',
      action: 'status_changed',
      details: { from: prev?.status, to: status },
    });
    emitN8n(
      status === 'sold' ? 'property.sold' : 'property.status_changed',
      { id, address: prev?.address, from: prev?.status, to: status },
      user.email,
    );

    revalidatePath(`/properties/${id}`);
    revalidatePath('/');
    return { ok: true, id, message: `Status: ${status.replace(/_/g, ' ')}` };
  });
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing property id' };

  return withOwnerClient(async ({ supabase, user }) => {
    const { data: prev } = await supabase
      .from('properties')
      .select('address')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };

    emitN8n('property.deleted', { id, address: prev?.address }, user.email);
    revalidatePath('/');
    return { ok: true, message: 'Property deleted' };
  });
}

export async function uploadHeroImage(
  propertyId: string,
  file: File,
): Promise<ActionResult> {
  if (!propertyId) return { ok: false, error: 'Missing property id' };
  if (!file || file.size === 0) return { ok: false, error: 'No file provided' };
  if (file.size > 8 * 1024 * 1024)
    return { ok: false, error: 'Image must be 8 MB or smaller' };

  return withOwnerClient(async ({ supabase }) => {
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().slice(0, 5);
    const path = `properties/${propertyId}/hero-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
        cacheControl: '3600',
      });
    if (upErr) return { ok: false, error: upErr.message };

    const { data: url } = supabase.storage.from('documents').getPublicUrl(path);

    const { error: updErr } = await supabase
      .from('properties')
      .update({ hero_image_url: url.publicUrl })
      .eq('id', propertyId);
    if (updErr) return { ok: false, error: updErr.message };

    revalidatePath(`/properties/${propertyId}`);
    revalidatePath('/');
    return { ok: true, message: 'Photo uploaded', id: propertyId };
  });
}

/**
 * Form-action wrapper for the New Property dialog. Redirects to the new
 * property's detail page on success so the user lands somewhere actionable.
 */
export async function createPropertyAction(formData: FormData) {
  const result = await createProperty(formData);
  if (!result.ok) {
    redirect(`/?dialog=new-property&error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/properties/${result.id}`);
}
