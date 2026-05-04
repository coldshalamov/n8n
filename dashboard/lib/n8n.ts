import 'server-only';
import crypto from 'node:crypto';

/**
 * Event names emitted to n8n. Keeping this typed so workflows on the n8n side
 * can switch on `event` reliably and we never accidentally rename one.
 */
export type N8nEvent =
  | 'property.created'
  | 'property.updated'
  | 'property.status_changed'
  | 'property.sold'
  | 'property.deleted'
  | 'contractor.created'
  | 'contractor.updated'
  | 'contractor.deleted'
  | 'job.created'
  | 'job.updated'
  | 'job.status_changed'
  | 'job.completed'
  | 'job.deleted'
  | 'bid.requested'
  | 'bid.approved'
  | 'bid.rejected'
  | 'invoice.approved'
  | 'invoice.disputed'
  | 'invoice.paid'
  | 'budget_item.upserted'
  | 'budget_item.deleted'
  | 'note.added';

export type N8nPayload = {
  event: N8nEvent;
  actor: string | null;
  timestamp: string;
  data: Record<string, unknown>;
};

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL?.trim();
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET?.trim();

function sign(body: string): string | null {
  if (!WEBHOOK_SECRET) return null;
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
}

/**
 * Fire-and-forget webhook to n8n. Failures never block the user action — they
 * are logged so we can fix integrations without breaking writes.
 */
export function emitN8n(event: N8nEvent, data: Record<string, unknown>, actor: string | null = null) {
  if (!WEBHOOK_URL) return; // n8n integration not yet configured

  const payload: N8nPayload = {
    event,
    actor,
    timestamp: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);
  const signature = sign(body);

  // Don't await — let the request fly and log failures.
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RehabOps-Event': event,
      ...(signature ? { 'X-RehabOps-Signature': signature } : {}),
    },
    body,
    cache: 'no-store',
  }).catch((err) => {
    console.error(`[n8n] failed to deliver ${event}`, err);
  });
}
