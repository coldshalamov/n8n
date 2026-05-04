'use client';

import * as Popover from '@radix-ui/react-popover';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ActivityFeed } from './ActivityFeed';
import type { ActivityLog } from '@/lib/db.types';

const SEEN_KEY = 'rehabops:lastSeenActivity';

/**
 * Live notification bell. Subscribes to activity_log via Supabase Realtime so
 * new events stream in without a page refresh, with an unread dot indicator.
 */
export function NotificationBell({ initial }: { initial: ActivityLog[] }) {
  const [items, setItems] = useState<ActivityLog[]>(initial);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SEEN_KEY);
  });

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const channelName = `activity_log_stream_${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
          setItems((prev) => [payload.new as ActivityLog, ...prev].slice(0, 30));
        },
      )
      .subscribe();
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, []);

  const newest = items[0]?.created_at ?? null;
  const hasUnread = newest != null && (lastSeen == null || newest > lastSeen);

  const onOpen = (next: boolean) => {
    setOpen(next);
    if (!next && newest) {
      setLastSeen(newest);
      try {
        window.localStorage.setItem(SEEN_KEY, newest);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={onOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid size-9 place-items-center rounded-lg text-ink-dim hover:bg-surface-2 hover:text-ink"
        >
          <Bell className="size-4" />
          {hasUnread && (
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-96 rounded-2xl border border-line bg-surface p-4 shadow-elevated data-[state=open]:animate-fade-in"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider text-ink-dim">
              Activity
            </h3>
            <span className="text-xs text-ink-faint">{items.length} recent</span>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2">
            <ActivityFeed items={items} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
