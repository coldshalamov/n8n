'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, RefreshCw, Workflow, Zap } from 'lucide-react';

type N8nStatus = {
  ok: boolean;
  status: 'ready' | 'starting' | 'missing_config';
  statusCode?: number;
  error?: string;
  url: string | null;
};

const POLL_MS = 5_000;

export function N8nLauncher() {
  const [status, setStatus] = useState<N8nStatus | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function check() {
      setAttempts((value) => value + 1);
      try {
        const response = await fetch('/api/n8n/status', { cache: 'no-store' });
        const next = (await response.json()) as N8nStatus;
        if (cancelled) return;
        setStatus(next);
        if (next.ok && next.url) {
          window.location.assign(next.url);
          return;
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({
            ok: false,
            status: 'starting',
            error: error instanceof Error ? error.message : 'Unable to reach n8n',
            url: null,
          });
        }
      }

      if (!cancelled) timeout = setTimeout(check, POLL_MS);
    }

    void check();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const isReady = Boolean(status?.ok && status.url);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-2xl items-center justify-center">
      <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent-soft ring-1 ring-accent/25">
            {isReady ? (
              <Workflow className="size-5" />
            ) : (
              <Loader2 className="size-5 animate-spin" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-ink-faint">
              Automation engine
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {isReady ? 'n8n is ready.' : 'Starting n8n...'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-dim">
              Render free services sleep when idle. This page wakes the n8n
              instance, checks its health endpoint, and sends you to the workflow
              canvas as soon as it can accept traffic.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-xl bg-bg/55 p-4 ring-1 ring-line sm:grid-cols-3">
          <StatusMetric label="State" value={status?.status ?? 'checking'} />
          <StatusMetric
            label="HTTP"
            value={status?.statusCode ? String(status.statusCode) : '-'}
          />
          <StatusMetric label="Checks" value={String(attempts)} />
        </div>

        {status?.error && (
          <p className="mt-4 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn ring-1 ring-warn/30">
            {status.error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3.5 py-2 text-sm font-medium text-ink-dim ring-1 ring-line transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <RefreshCw className="size-4" />
            Check again
          </button>
          {status?.url && (
            <a
              href={status.url}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-bg shadow-glow transition hover:brightness-110"
            >
              Open anyway
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-xl bg-info/10 p-3 text-xs leading-5 text-info ring-1 ring-info/25">
          <Zap className="mt-0.5 size-3.5 shrink-0" />
          <p>
            For reliable always-on behavior, n8n still needs a persistent
            Postgres database and a non-sleeping host. This launcher is a demo
            guardrail, not a substitute for that.
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
