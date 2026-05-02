import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

/**
 * GET /api/inbox?limit=50
 * Returns recent email_received activity log entries.
 */
export async function handleInbox(req: Request, res: Response) {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));

  const { data, error } = await supabase()
    .from('activity_log')
    .select('id, property_id, job_id, actor, action, details, created_at')
    .eq('action', 'email_received')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }

  res.json({ ok: true, items: data ?? [] });
}
