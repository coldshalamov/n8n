import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

type Json = Record<string, unknown>;

/**
 * Append a row to activity_log. Best-effort — never throws so it can't break
 * the originating mutation.
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: {
    propertyId?: string | null;
    jobId?: string | null;
    actor: string | null;
    action: string;
    details?: Json;
  },
) {
  try {
    await supabase.from('activity_log').insert({
      property_id: params.propertyId ?? null,
      job_id: params.jobId ?? null,
      actor: params.actor,
      action: params.action,
      details: params.details ?? null,
    });
  } catch (err) {
    console.error('[activity] failed to log', err);
  }
}
