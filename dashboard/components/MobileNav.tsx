'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { HardHat, Home, LogOut, Workflow } from 'lucide-react';
import { logout } from '@/app/login/actions';
import { externalUrl } from '@/lib/format';

const NAV = [
  { href: '/', label: 'Properties', icon: Home, match: (p: string) => p === '/' || p.startsWith('/properties') },
  { href: '/contractors', label: 'Contractors', icon: HardHat, match: (p: string) => p.startsWith('/contractors') },
];

export function MobileNav() {
  const path = usePathname();
  const n8nUrl = externalUrl(process.env.NEXT_PUBLIC_N8N_URL);
  return (
    <header className="md:hidden sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-bg/85 backdrop-blur px-4">
      <Link href="/" className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-glow">
          <span className="size-2.5 rounded-sm bg-bg/80" />
        </span>
        <span className="font-semibold tracking-tight text-sm">
          Rehab<span className="text-accent-soft">Ops</span>
        </span>
      </Link>
      <nav className="flex items-center gap-1">
        {NAV.map(({ href, icon: Icon, label, match }) => {
          const active = match(path);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={clsx(
                'grid size-9 place-items-center rounded-lg transition-colors',
                active ? 'bg-surface text-ink ring-1 ring-line' : 'text-ink-dim hover:text-ink',
              )}
            >
              <Icon className="size-4" />
            </Link>
          );
        })}
        {n8nUrl && (
          <a
            href={n8nUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open n8n builder"
            className="grid size-9 place-items-center rounded-lg text-accent-soft hover:text-accent"
          >
            <Workflow className="size-4" />
          </a>
        )}
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-lg text-ink-dim hover:text-ink"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </nav>
    </header>
  );
}
