'use client';

import * as Popover from '@radix-ui/react-popover';
import { useTransition } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { changePropertyStatus } from '@/lib/actions/properties';
import type { PropertyStatus } from '@/lib/db.types';
import { propertyStatusLabel } from '@/lib/format';
import { PropertyStatusBadge } from './StatusBadge';

const ORDER: PropertyStatus[] = [
  'acquired',
  'permitting',
  'in_progress',
  'punch_list',
  'listing',
  'sold',
];

export function PropertyStatusMenu({
  propertyId,
  status,
}: {
  propertyId: string;
  status: PropertyStatus;
}) {
  const [pending, start] = useTransition();

  const change = (next: PropertyStatus) =>
    start(async () => {
      const r = await changePropertyStatus(propertyId, next);
      if (r.ok) toast.success(r.message ?? 'Status updated');
      else toast.error(r.error);
    });

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full ring-1 ring-line bg-surface-2 px-2.5 py-1 transition-colors hover:bg-surface-3"
          aria-label="Change status"
          disabled={pending}
        >
          <PropertyStatusBadge status={status} />
          {pending ? (
            <Loader2 className="size-3.5 animate-spin text-ink-faint" />
          ) : (
            <ChevronDown className="size-3.5 text-ink-faint" />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-elevated data-[state=open]:animate-fade-in"
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
              <span>{propertyStatusLabel(s)}</span>
              {s === status && <Check className="size-4" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
