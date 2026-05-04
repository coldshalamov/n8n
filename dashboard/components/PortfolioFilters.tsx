'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import clsx from 'clsx';
import { propertyStatusLabel } from '@/lib/format';
import type { PropertyStatus } from '@/lib/db.types';

const STATUSES: PropertyStatus[] = [
  'acquired',
  'permitting',
  'in_progress',
  'punch_list',
  'listing',
  'sold',
];

export function PortfolioFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const [draft, setDraft] = useState(q);
  const [, start] = useTransition();

  useEffect(() => setDraft(q), [q]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    start(() => router.replace(`/?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setParam('status', null)}
          className={clsx(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            !status
              ? 'bg-surface text-ink ring-1 ring-line'
              : 'text-ink-dim hover:text-ink',
          )}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setParam('status', s === status ? null : s)}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              status === s
                ? 'bg-surface text-ink ring-1 ring-line'
                : 'text-ink-dim hover:text-ink',
            )}
          >
            {propertyStatusLabel(s)}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('q', draft || null);
            if (e.key === 'Escape') {
              setDraft('');
              setParam('q', null);
            }
          }}
          placeholder="Search address, city…"
          className="h-8 w-48 rounded-lg bg-surface-2 pl-8 pr-7 text-xs text-ink ring-1 ring-line focus:outline-none focus:ring-accent/40"
        />
        {draft && (
          <button
            type="button"
            onClick={() => {
              setDraft('');
              setParam('q', null);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-ink-faint hover:bg-surface-3 hover:text-ink"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
