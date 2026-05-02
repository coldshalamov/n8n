# Deploy

Two platforms, three services + one frontend.

```
            ┌────────────────────────────┐
            │           Vercel           │
            │     (Next.js dashboard)    │
            └──────────────┬─────────────┘
                           │ NEXT_PUBLIC_SUPABASE_URL
                           │ NEXT_PUBLIC_SUPABASE_ANON_KEY
                           │ SUPABASE_SERVICE_ROLE_KEY
                           ▼
            ┌────────────────────────────┐
            │          Supabase          │
            │  Postgres + Auth + Storage │
            └──────────────▲─────────────┘
                           │
   ┌───────────────────────┼──────────────────────────┐
   │                       │                          │
   ▼                       ▼                          ▼
┌──────────┐         ┌────────────┐            ┌──────────┐
│   n8n    │  ───►   │ email-srv  │            │ mcp-srv  │
│ (Render) │         │  (Render)  │            │ (Render) │
└──────────┘         └────────────┘            └──────────┘
       ▲                                             ▲
       │                                             │
       │  webhooks from email-srv                    │  SSE
       │  to /webhook/new-email                      │  from OpenClaw
       │  /webhook/invoice-approved                  │
```

## Order of operations

### 1. Supabase (5 min)

1. supabase.com → New project (you've done this).
2. SQL editor: run `schema.sql`, then `seed.sql`, then `schema-phase2.sql`.
3. Authentication → Users → Add user (your email + password, *Auto-confirm*).
4. Settings → API → copy URL + anon key + service role key.
5. Authentication → URL Configuration → add your Vercel URL to *Site URL* and
   add `https://your-vercel-url.com/auth/callback` to *Redirect URLs*.
   (For local dev, `http://localhost:3000/auth/callback` is already allowed.)

### 2. Push to GitHub

```bash
cd rehab-ops
git init
git add .
git commit -m "rehab-ops: phase 1-5"
gh repo create rehab-ops --private --source=. --push
```

(or do it via GitHub.com if `gh` isn't installed.)

### 3. Vercel — dashboard (2 min)

1. vercel.com → Add New → Project → import your repo.
2. **Root directory**: `dashboard`
3. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy.
5. Your dashboard is live at `<project>.vercel.app`.

### 4. Render — n8n + email + MCP (10 min)

1. render.com → New + → **Blueprint**.
2. Connect the GitHub repo. Render reads `render.yaml`.
3. Apply. Render starts provisioning all three services + a 1GB disk for n8n.
4. While they're building:
   - Set the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars on
     **email-server** and **mcp-server**.
   - The `MCP_API_KEY` for **mcp-server** auto-generates — copy it from the
     env vars panel for OpenClaw.
   - The `N8N_ENCRYPTION_KEY` auto-generates and stays put — don't lose the
     n8n disk.
   - n8n derives `N8N_HOST`, `WEBHOOK_URL`, and `N8N_EDITOR_BASE_URL` from
     Render's runtime `RENDER_EXTERNAL_*` values. Do not replace them with
     Render private-network `host`/`hostport` values.
5. Once n8n is up, open it, create your admin user, then:
   - **Credentials → New → Postgres** → name: `RehabOps Postgres`. Use the
     Supabase Database connection string (Settings → Database → Connection
     pooler URI).
   - **Workflows → Import from File** → import each file from
     `n8n-workflows/`, click Activate.
   - Set the webhook env vars (`DIGEST_WEBHOOK_URL`,
     `OWNER_ALERT_WEBHOOK`, `CONTRACTOR_REMIND_WEBHOOK`). For a demo before
     final channels exist, use temporary webhook.site URLs so HTTP Request
     nodes do not fail on blank URLs.
6. Health sanity checks:
   - n8n: `https://<n8n-service>.onrender.com/healthz`
   - email-server: `https://<email-service>.onrender.com/health`
   - mcp-server: `https://<mcp-service>.onrender.com/health`
   If n8n restarts and prompts for setup again, the persistent disk is not
   attached at `/home/node/.n8n`.

### 5. Wire the email server into n8n

Once `new-email-alert` is active in n8n, copy its production webhook URL
(it'll look like `https://n8n-xxx.onrender.com/webhook/new-email`).
Set it as `N8N_NEW_EMAIL_WEBHOOK` on the email-server in Render → save →
the service redeploys.

### 6. SendGrid Inbound Parse

1. sendgrid.com → free tier (100/day is plenty).
2. Settings → Sender Authentication → verify a domain you own.
3. Settings → Inbound Parse → Add Host & URL:
   - Receiving Domain: `mail.yourdomain.com`
   - Destination URL: `https://email-server-xxx.onrender.com/webhooks/inbound-email`
4. Add an MX record on `mail.yourdomain.com` pointing to `mx.sendgrid.net`
   priority 10.
5. Email anything to `anything@mail.yourdomain.com` to test.

### 7. OpenClaw

Add an MCP server to OpenClaw with URL:
```
https://mcp-server-xxx.onrender.com/sse?key=<MCP_API_KEY>
```

Tools auto-discover. Test with: "What's overdue?"

## Costs (Render starter tier)

| Service     | Plan    | $/mo |
|-------------|---------|------|
| n8n         | Starter | $7   |
| email-srv   | Starter | $7   |
| mcp-srv     | Starter | $7   |
| n8n disk    | 1 GB    | $0.25|
| Supabase    | Free    | $0   |
| Vercel      | Hobby   | $0   |
| **Total**   |         | ~$22 |

Supabase Free pauses projects after 7 days idle — bump to Pro ($25) once
this is in daily use, OR rely on the dashboard pinging it.
