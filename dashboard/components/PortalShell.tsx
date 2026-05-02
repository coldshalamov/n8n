'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/login/actions';

export function PortalShell({
  contractorName,
  children,
}: {
  contractorName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-bg/85 backdrop-blur px-4 sm:px-6">
        <Link href="/portal" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-glow shadow-glow">
            <span className="size-2.5 rounded-sm bg-bg/80" />
          </span>
          <span className="font-semibold tracking-tight text-sm">
            Rehab<span className="text-accent-soft">Ops</span>
            <span className="text-ink-faint font-normal"> · contractor</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-ink-dim">{contractorName}</span>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-lg text-ink-dim hover:text-ink hover:bg-surface"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
