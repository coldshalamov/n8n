# n8n Workflows

Importable JSON templates. After deploying n8n (see `../render.yaml`),
go to your n8n instance → **Workflows → Import from File** → pick each one.

## Setup, once

1. **Create a Postgres credential** in n8n named exactly `RehabOps Postgres`.
   Connection details from Supabase → Settings → Database → Connection string.
   (Or "Connection pooler" — that's fine too.)

2. **Set environment variables** on your n8n service:
   - `DIGEST_WEBHOOK_URL` — where to post the daily digest (Slack incoming
     webhook, GHL webhook, or Twilio relay)
   - `OWNER_ALERT_WEBHOOK` — where to post urgent alerts (same idea)
   - `CONTRACTOR_REMIND_WEBHOOK` — where to send contractor reminders
     (a small relay you build, or a transactional-email service webhook)

   These are required for executions that call outbound relays. For a demo,
   set them to temporary webhook.site URLs if the final Slack/GHL/Twilio relays
   are not ready yet.

3. After import, open each workflow, confirm each Postgres node uses the
   `RehabOps Postgres` credential, then click **Activate** in the top right.

## Workflows

### `daily-digest.json`
Runs at **7am EST** daily. Pulls active properties, overdue jobs, and pending
invoices into a single Slack-style summary and POSTs it to
`DIGEST_WEBHOOK_URL`.

### `deadline-reminder.json`
Runs at **8am EST** daily. Finds jobs due within 3 days. Each row branches:
- Overdue → POST to `OWNER_ALERT_WEBHOOK`
- Due soon → POST to `CONTRACTOR_REMIND_WEBHOOK` with the contractor's email
  in the body.

### `invoice-approved.json`
Triggered by webhook `POST /webhook/invoice-approved` with body
`{ invoice_id }`. Updates job `actual_cost`, property `total_spent`, and
alerts the owner if the property goes over budget.

Wire this from the dashboard's "approve invoice" action, or call it from the
MCP server's `approve_invoice` tool. The webhook URL is shown in the n8n UI
once the workflow is active.

### `new-email-alert.json`
Triggered by webhook `POST /webhook/new-email` from `email-server`. If the
email type is `bid`, `invoice`, or `lien_waiver`, alerts the owner immediately.
Otherwise drops it into the digest path.

Wire this by setting `N8N_NEW_EMAIL_WEBHOOK` on the email server to the
production webhook URL n8n shows you.

## Editing

These templates are starting points. Replace the placeholder relays
(`DIGEST_WEBHOOK_URL`, etc.) with whatever channel actually reaches the owner —
GHL, WhatsApp via Twilio, Slack, or all three branched off the same trigger.
