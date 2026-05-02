import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { DOCUMENTS_BUCKET, supabase } from '../lib/supabase';
import {
  attachmentTypeFor,
  classifyEmail,
  type EmailType,
} from '../lib/classify';
import {
  extractEmail,
  findActiveJob,
  findContractorByEmail,
  findPropertyFromText,
} from '../lib/match';

type SendGridFile = Express.Multer.File;

function firstString(value: unknown): string {
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

/**
 * Handles SendGrid Inbound Parse webhooks.
 * SendGrid posts:
 *   - text fields: from, to, subject, text, html, envelope, headers, attachments (count)
 *   - file fields: attachment1, attachment2, ...
 *
 * We respond 200 even on partial failures so SendGrid doesn't retry forever.
 */
export async function handleInboundEmail(req: Request, res: Response) {
  try {
    const from = firstString(req.body.from);
    const subject = firstString(req.body.subject);
    const text = firstString(req.body.text) || firstString(req.body.html);
    const files = (req.files as SendGridFile[] | undefined) ?? [];

    const senderEmail = extractEmail(from);
    const contractor = senderEmail
      ? await findContractorByEmail(senderEmail)
      : null;
    const property = await findPropertyFromText(`${subject} ${text}`);

    const attachmentTypes = files.map((f) => f.mimetype);
    const emailType: EmailType = classifyEmail({
      subject,
      body: text,
      attachmentTypes,
    });

    const jobId =
      contractor && property
        ? await findActiveJob(contractor.id, property.id)
        : null;

    const sb = supabase();

    // Upload each attachment to Storage and record a documents row.
    const uploadedDocIds: string[] = [];
    let failedAttachments = 0;
    for (const f of files) {
      const safe = (f.originalname || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = jobId ?? property?.id ?? 'unmatched';
      const path = `${folder}/${Date.now()}-${randomUUID()}-${safe}`;

      const { error: upErr } = await sb.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, f.buffer, {
          contentType: f.mimetype,
          upsert: false,
        });
      if (upErr) {
        console.error('storage upload failed', upErr);
        failedAttachments += 1;
        continue;
      }

      const {
        data: { publicUrl },
      } = sb.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);

      const { data: doc, error: docErr } = await sb
        .from('documents')
        .insert({
          property_id: property?.id ?? null,
          job_id: jobId,
          contractor_id: contractor?.id ?? null,
          type: attachmentTypeFor(emailType, f.mimetype),
          filename: f.originalname,
          url: publicUrl,
          uploaded_by: senderEmail ?? from,
          notes: `From email: ${subject}`,
        })
        .select('id')
        .single();
      if (docErr) {
        console.error('document insert failed', docErr);
        failedAttachments += 1;
        continue;
      }
      if (doc?.id) uploadedDocIds.push(doc.id);
    }

    // Always log the email itself.
    const { error: logErr } = await sb.from('activity_log').insert({
      property_id: property?.id ?? null,
      job_id: jobId,
      actor: senderEmail ?? from,
      action: 'email_received',
      details: {
        subject,
        type: emailType,
        attachments: files.length,
        failed_attachments: failedAttachments || undefined,
        unmatched: !contractor || !property ? {
          contractor: !contractor,
          property: !property,
        } : undefined,
        document_ids: uploadedDocIds,
      },
    });
    if (logErr) console.error('activity log insert failed', logErr);

    // Optionally fan out to n8n
    const n8nHook = process.env.N8N_NEW_EMAIL_WEBHOOK;
    if (n8nHook) {
      fetch(n8nHook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: senderEmail,
          subject,
          type: emailType,
          property_id: property?.id ?? null,
          job_id: jobId,
          contractor_id: contractor?.id ?? null,
          attachments: files.length,
        }),
      }).catch((e) => console.warn('n8n notify failed', e));
    }

    res.status(200).json({
      ok: true,
      type: emailType,
      matched: {
        contractor: contractor?.id ?? null,
        property: property?.id ?? null,
        job: jobId,
      },
      attachments: files.length,
      failed_attachments: failedAttachments,
    });
  } catch (err) {
    console.error('inbound email error', err);
    // Still 200 — we don't want SendGrid retrying on our bugs.
    res.status(200).json({ ok: false, accepted: false });
  }
}
