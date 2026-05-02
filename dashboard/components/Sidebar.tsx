'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Home, HardHat, LogOut } from 'lucide-react';
import { logout } from '@/app/login/actions';

const NAV = [
  { href: '/', label: 'Properties', icon: Home, match: (p: string) => p === '/' || p.startsWith('/properties') },
  { href: '/contractors', label: 'Contractors', icon: HardHat, match: (p: string) => p.startsWith('/contractors') },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const path = usePathname();

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
      </nav>

      <div className="mx-3 mb-3 rounded-xl bg-surface p-3 text-xs text-ink-faint ring-1 ring-line">
        <div className="flex items-center justify-between text-ink-dim">
          <span>n8n pulse</span>
          <span className="rounded-full bg-ok/10 px-2 py-0.5 text-ok ring-1 ring-ok/20">
            live
          </span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-line">
          <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-accent to-ok" />
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
