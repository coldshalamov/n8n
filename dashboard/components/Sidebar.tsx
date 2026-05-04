'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Bot,
  Boxes,
  ExternalLink,
  Hammer,
  HardHat,
  Home,
  LogOut,
  Search,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import { logout } from '@/app/login/actions';
import { externalUrl } from '@/lib/format';
import { fireOpenPalette } from '@/components/CommandPalette';

const NAV = [
  {
    href: '/',
    label: 'Properties',
    icon: Home,
    match: (p: string) => p === '/' || p.startsWith('/properties'),
  },
  {
    href: '/jobs',
    label: 'Jobs',
    icon: Hammer,
    match: (p: string) => p.startsWith('/jobs'),
  },
  {
    href: '/contractors',
    label: 'Contractors',
    icon: HardHat,
    match: (p: string) => p.startsWith('/contractors'),
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: TrendingUp,
    match: (p: string) => p.startsWith('/reports'),
  },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const path = usePathname();
  const n8nUrl = externalUrl(process.env.NEXT_PUBLIC_N8N_URL);

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-line bg-bg/60 backdrop-blur">
      <div className="flex h-16 items-center px-5 border-b border-line">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-glow shadow-glow">
            <span className="size-3 rounded-sm bg-bg/80" />
          </span>
          <span className="font-semibold tracking-tight">
            Rehab<span className="text-accent-soft">Ops</span>
          </span>
        </Link>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => fireOpenPalette()}
          className="flex w-full items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-dim ring-1 ring-line transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search · run a command</span>
          <kbd className="rounded bg-bg/60 px-1.5 py-0.5 text-[10px] ring-1 ring-line">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(path);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-surface text-ink ring-1 ring-line'
                  : 'text-ink-dim hover:text-ink hover:bg-surface/60',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
        {n8nUrl && (
          <Link
            href="/n8n"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-surface/60 hover:text-ink"
          >
            <Workflow className="size-4" />
            n8n Builder
            <ExternalLink className="ml-auto size-3 text-ink-faint" />
          </Link>
        )}
      </nav>

      <div className="mx-3 mb-3 space-y-2 rounded-xl bg-surface p-3 text-xs text-ink-faint ring-1 ring-line">
        <div className="flex items-center justify-between text-ink-dim">
          <span className="inline-flex items-center gap-1.5">
            <Boxes className="size-3.5 text-accent-soft" />
            Automation
          </span>
          <span className="rounded-full bg-ok/10 px-2 py-0.5 text-ok ring-1 ring-ok/20">
            live
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-2">
          <span className="inline-flex items-center gap-1.5">
            <Bot className="size-3.5 text-info" />
            Webhooks
          </span>
          <span className="text-ink-dim">n8n bridge</span>
        </div>
      </div>

      <div className="border-t border-line p-3 space-y-2">
        <div className="px-2 text-xs text-ink-faint truncate" title={userEmail ?? ''}>
          {userEmail}
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-dim hover:text-ink hover:bg-surface/60 transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
