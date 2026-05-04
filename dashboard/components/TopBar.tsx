'use client';

import { Search } from 'lucide-react';
import { fireOpenPalette } from '@/components/CommandPalette';
import { NotificationBell } from '@/components/NotificationBell';
import type { ActivityLog } from '@/lib/db.types';

/**
 * Sits at the top of the main column on desktop. Provides the cmd-K trigger,
 * the notification bell, and a clear visual edge between sidebar and content.
 */
export function TopBar({ activity }: { activity: ActivityLog[] }) {
  return (
    <div className="hidden items-center justify-between gap-3 border-b border-line/60 bg-bg/40 px-4 py-2 backdrop-blur md:flex sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => fireOpenPalette()}
        className="flex h-8 w-72 items-center gap-2 rounded-lg bg-surface-2 px-3 text-xs text-ink-faint ring-1 ring-line transition-colors hover:bg-surface-3 hover:text-ink-dim"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search · run a command</span>
        <kbd className="rounded bg-bg/60 px-1.5 py-0.5 text-[10px] ring-1 ring-line">⌘K</kbd>
      </button>
      <div className="flex items-center gap-1.5">
        <NotificationBell initial={activity} />
      </div>
    </div>
  );
}
