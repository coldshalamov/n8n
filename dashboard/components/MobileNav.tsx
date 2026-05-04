'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Hammer,
  HardHat,
  Home,
  LogOut,
  Menu,
  Search,
  TrendingUp,
  Workflow,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { logout } from '@/app/login/actions';
import { externalUrl } from '@/lib/format';
import { fireOpenPalette } from '@/components/CommandPalette';
import { NotificationBell } from '@/components/NotificationBell';
import type { ActivityLog } from '@/lib/db.types';

const NAV = [
  { href: '/', label: 'Properties', icon: Home, match: (p: string) => p === '/' || p.startsWith('/properties') },
  { href: '/jobs', label: 'Jobs', icon: Hammer, match: (p: string) => p.startsWith('/jobs') },
  { href: '/contractors', label: 'Contractors', icon: HardHat, match: (p: string) => p.startsWith('/contractors') },
  { href: '/reports', label: 'Reports', icon: TrendingUp, match: (p: string) => p.startsWith('/reports') },
];

export function MobileNav({ activity = [] }: { activity?: ActivityLog[] }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const n8nUrl = externalUrl(process.env.NEXT_PUBLIC_N8N_URL);

  return (
    <header className="md:hidden sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-lg text-ink-dim hover:bg-surface-2 hover:text-ink"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-glow">
            <span className="size-2.5 rounded-sm bg-bg/80" />
          </span>
          <span className="font-semibold tracking-tight text-sm">
            Rehab<span className="text-accent-soft">Ops</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fireOpenPalette()}
            aria-label="Search and command palette"
            className="grid size-9 place-items-center rounded-lg text-ink-dim hover:bg-surface-2 hover:text-ink"
          >
            <Search className="size-4" />
          </button>
          <NotificationBell initial={activity} />
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-72 border-r border-line bg-surface p-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-glow shadow-glow">
                  <span className="size-3 rounded-sm bg-bg/80" />
                </span>
                <span className="font-semibold tracking-tight">
                  Rehab<span className="text-accent-soft">Ops</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="grid size-8 place-items-center rounded-lg text-ink-dim hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-3 space-y-0.5">
              {NAV.map(({ href, label, icon: Icon, match }) => {
                const active = match(path);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-surface-2 text-ink ring-1 ring-line'
                        : 'text-ink-dim hover:text-ink hover:bg-surface-2/60',
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
              {n8nUrl && (
                <a
                  href={n8nUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-dim hover:bg-surface-2/60 hover:text-ink"
                >
                  <Workflow className="size-4" />
                  n8n Builder
                </a>
              )}
            </nav>
            <div className="absolute inset-x-4 bottom-4 border-t border-line pt-3">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-dim hover:bg-surface-2/60 hover:text-ink"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
