'use client';

import * as Popover from '@radix-ui/react-popover';
import { useTransition } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { changeJobStatus } from '@/lib/actions/jobs';
import type { JobStatus } from '@/lib/db.types';
import { jobStatusLabel } from '@/lib/format';
import { JobStatusBadge } from './StatusBadge';

const ORDER: JobStatus[] = [
  'pending',
  'bid_requested',
  'bid_received',
  'approved',
  'in_progress',
  'inspection',
  'complete',
  'paid',
];

export function JobStatusMenu({
  jobId,
  status,
}: {
  jobId: string;
  status: JobStatus;
}) {
  const [pending, start] = useTransition();

  const change = (next: JobStatus) =>
    start(async () => {
      const r = await changeJobStatus(jobId, next);
      if (r.ok) toast.success(r.message ?? 'Status updated');
      else toast.error(r.error);
    });

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full"
          aria-label="Change job status"
          disabled={pending}
        >
          <JobStatusBadge status={status} />
          {pending ? (
            <Loader2 className="size-3 animate-spin text-ink-faint" />
          ) : (
            <ChevronDown className="size-3 text-ink-faint" />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-elevated data-[state=open]:animate-fade-in"
        >
          {ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => change(s)}
              className={clsx(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-surface-2',
                s === status ? 'text-accent-soft' : 'text-ink-dim',
              )}
            >
              <span>{jobStatusLabel(s)}</span>
              {s === status && <Check className="size-4" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
