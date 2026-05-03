# RehabOps

Operations platform for a Miami real estate rehab/dev shop. It wraps around
GoHighLevel and n8n with contractor management, email ingestion, per-property
budget tracking, job coordination, and an MCP endpoint so OpenClaw can query
and operate on the system from chat.

```
rehab-ops/
├── schema.sql              - Postgres schema (run in Supabase)
├── seed.sql                - sample portfolio
├── schema-phase2.sql       - contractor-role RLS + storage bucket
├── render.yaml             - Render Blueprint (n8n + email + mcp)
├── dashboard/              - Next.js 15 dashboard and contractor portal
├── email-server/           - SendGrid Inbound Parse to Supabase
├── mcp-server/             - MCP over SSE for OpenClaw
├── n8n-workflows/          - daily digest, deadlines, alerts
└── deploy/README.md        - deployment walkthrough
```

## Architecture

```
Owner web + WhatsApp        Contractors web + email
        |                            |
        v                            v
  Vercel dashboard             SendGrid inbound
        |                            |
        v                            v
  Supabase Postgres <---- email-server on Render
        ^
        |
  MCP server on Render <---- OpenClaw
        |
        v
  n8n on Render for deterministic workflows
```

## Quick Start

1. Supabase: run `schema.sql`, `seed.sql`, then `schema-phase2.sql`.
2. Dashboard: deploy `dashboard/` to Vercel with Supabase URL, anon key, and
   service-role key, or use the free `rehab-ops-dashboard` Render service from
   `render.yaml` for the public demo wrapper.
3. Render: apply `render.yaml`. It creates n8n, email ingestion, and MCP
   services on free plans. Keep n8n on the free image service for the demo;
   when you have the Supabase database connection details ready, add `DB_TYPE`
   and `DB_POSTGRESDB_*` env vars in Render so workflows and credentials
   survive restarts without a Render disk.
4. n8n: import the workflows from `n8n-workflows/`, create a Postgres
   credential named `RehabOps Postgres`, and set outbound webhook env vars.
5. OpenClaw: connect to `https://<mcp-service>.onrender.com/sse?key=<MCP_API_KEY>`.

## Demo Story

The first demo should show this as an operations cockpit:

- Portfolio health: which houses are active, overdue, over budget, and near
  completion.
- Property drilldown: jobs, bids, invoices, budget lines, documents, and
  activity in one place.
- Contractor portal: job-site friendly bid, invoice, and photo upload.
- Email intake: contractor emails get matched to property/job records and can
  trigger n8n notifications.
- OpenClaw/MCP: ask "what is overdue?", "what is pending approval?", or "add a
  note to the 43rd Street house" and have it call deterministic tools.

## Local Dev

Use `pnpm` via Corepack if it is not on PATH:

```bash
corepack pnpm --version
```

Dashboard:

```bash
cd dashboard
cp .env.local.example .env.local
corepack pnpm install
corepack pnpm dev
```

Email server:

```bash
cd email-server
cp .env.example .env
corepack pnpm install
corepack pnpm dev
```

MCP server:

```bash
cd mcp-server
cp .env.example .env
corepack pnpm install
corepack pnpm dev
```
