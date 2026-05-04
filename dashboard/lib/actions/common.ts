import 'server-only';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string };

export async function withOwnerClient<T>(
  fn: (ctx: {
    supabase: Awaited<ReturnType<typeof createClient>>;
    user: Awaited<ReturnType<typeof requireOwner>>;
  }) => Promise<T>,
): Promise<T> {
  const user = await requireOwner();
  const supabase = await createClient();
  return fn({ supabase, user });
}

export function asNumber(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  // strip $ and commas to be forgiving with form input
  const cleaned = s.replace(/[$,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function asString(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export function asInt(v: FormDataEntryValue | null): number | null {
  const n = asNumber(v);
  if (n == null) return null;
  return Math.round(n);
}

export function zodIssue(err: z.ZodError): string {
  const first = err.issues[0];
  if (!first) return 'Invalid input';
  const path = first.path.join('.') || 'value';
  return `${path}: ${first.message}`;
}
