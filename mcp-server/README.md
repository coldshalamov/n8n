# MCP Server for OpenClaw

Exposes the rehab-ops database to OpenClaw (or any MCP-capable agent) via
Server-Sent Events. The owner can text OpenClaw "what's overdue?" and the
agent will hit `get_overdue_jobs` here.

## Tools exposed

| Tool                   | Type   | Description                                  |
|------------------------|--------|----------------------------------------------|
| `get_properties`       | read   | List all properties + budget summary          |
| `get_property`         | read   | One property by UUID or address fragment      |
| `get_property_jobs`    | read   | Jobs on a property                            |
| `get_property_budget`  | read   | Budget breakdown by category                  |
| `get_contractor`       | read   | Contractor by UUID or name fragment + jobs    |
| `get_overdue_jobs`     | read   | All jobs past their due_date                  |
| `get_pending_invoices` | read   | Invoices awaiting approval                    |
| `get_recent_activity`  | read   | Recent activity log entries                   |
| `update_job_status`    | write  | Change a job status                           |
| `approve_invoice`      | write  | Mark an invoice approved                      |
| `add_note`             | write  | Append a note to a property                   |
| `get_daily_summary`    | read   | One-shot health summary                       |

## Endpoints

| Method | Path                              | Purpose                          |
|--------|-----------------------------------|----------------------------------|
| GET    | `/health`                         | health + list of tools           |
| GET    | `/sse?key=…`                      | open MCP SSE session             |
| POST   | `/messages?sessionId=…`           | client → server messages         |

## Local dev

```bash
cp .env.example .env
# Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MCP_API_KEY (any long random string)
pnpm install
pnpm dev   # http://localhost:8081
```

Smoke test:

```bash
curl http://localhost:8081/health
```

## Connect from OpenClaw

OpenClaw needs an MCP server URL. Use:

```
https://<your-render-service>.onrender.com/sse?key=<MCP_API_KEY>
```

Add it as an MCP server in OpenClaw's config. Once connected, the agent will
auto-discover the tools. Then ask things like:

- "What's the status on the 43rd Street house?"
- "Any overdue jobs?"
- "Approve invoice INV-2026-0042."
- "Add a note to Brickell saying inspection passed."

## Auth

The `MCP_API_KEY` env var is a shared secret. The server checks it when the
SSE session is opened via:
1. `?key=…` query param (simplest, works in URL)
2. `x-api-key` header
3. `Authorization: Bearer …` header

The follow-up `/messages` requests are accepted only for session IDs that came
from an authenticated `/sse` connection. Without `MCP_API_KEY` set, the
endpoints are open — only do that for local testing.

## Deploy on Render

This folder includes a `Dockerfile`. Either:

- Use Render's Docker build (point service at this folder), or
- Use the repo-root `render.yaml` Blueprint.

Required env vars on Render:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MCP_API_KEY`
- `PORT` — the Blueprint pins this to `10000`; local dev defaults to `8081`

Render health checks use `GET /health`.
