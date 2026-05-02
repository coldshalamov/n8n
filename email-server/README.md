# Email Ingestion Server

Receives inbound emails via SendGrid Inbound Parse and writes them to Supabase.
Each email becomes an `activity_log` entry; attachments become `documents` rows
with files in the `documents` storage bucket.

## Endpoints

| Method | Path                          | Purpose                         |
|--------|-------------------------------|---------------------------------|
| GET    | `/health`                     | health check                    |
| POST   | `/webhooks/inbound-email`     | SendGrid Inbound Parse target   |
| GET    | `/api/inbox?limit=50`         | recent parsed emails (for UI)   |

## What it does on each email

1. Extracts the sender email from `from`.
2. Looks up `contractors` by that email (case-insensitive).
3. Scans subject + body for a known property address; finds the longest match.
4. Classifies the email by keywords:
   - bid / estimate / quote / proposal → **bid**
   - invoice / payment due / bill → **invoice**
   - lien / waiver → **lien_waiver**
   - permit → **permit**
   - contract / agreement → **contract**
   - update / progress / status → **update**
   - has image attachments otherwise → **photos**
   - else → **general**
5. Finds the matching active job (contractor + property + not paid/complete).
6. Uploads each attachment to Storage at `{job_id}/{timestamp}-{filename}`.
7. Inserts `documents` rows.
8. Inserts an `activity_log` row with the full classification result.
9. Optionally fires `N8N_NEW_EMAIL_WEBHOOK` for downstream automation.

If the contractor or property can't be matched, the email is still logged with
`details.unmatched` set so it shows up in the dashboard inbox for triage.

## Local dev

```bash
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
pnpm install
pnpm dev    # http://localhost:8080
```

Test the inbound webhook:

```bash
curl -X POST http://localhost:8080/webhooks/inbound-email \
  -F 'from=Carlos Mendez <carlos@apexplumbing.com>' \
  -F 'subject=Invoice for 742 NW 43rd Street' \
  -F 'text=See attached invoice for the kitchen plumbing rough-in.' \
  -F 'attachment1=@./test-invoice.pdf'
```

## SendGrid Inbound Parse setup

1. **Domain**: in your DNS, add an MX record:
   `mail.<yourdomain>` → `mx.sendgrid.net` (priority 10)
2. **SendGrid → Settings → Inbound Parse → Add Host & URL**:
   - Receiving Domain: `mail.<yourdomain>`
   - Destination URL: `https://<your-render-service>.onrender.com/webhooks/inbound-email`
   - Check "POST the raw, full MIME message" → **off**
   - Check "Send Grid will check incoming emails for spam" → optional
3. Test with a real email to `anything@mail.yourdomain.com`. Watch logs.

For dev without DNS, use ngrok or similar to expose `localhost:8080`.

## Deploy on Render

This folder includes a `Dockerfile`. Either:

- Use Render's auto-detected Docker setup (point service to this folder), or
- Use the repo-root `render.yaml` Blueprint.

Required env vars on Render:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` — the Blueprint pins this to `10000`; local dev defaults to `8080`
- `N8N_NEW_EMAIL_WEBHOOK` — required once the `new-email-alert` workflow is active

Render health checks use `GET /health`.
