'use client';

import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Hammer,
  HardHat,
  HomeIcon,
  Plus,
  Search,
  Send,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import * as RDialog from '@radix-ui/react-dialog';
import { externalUrl } from '@/lib/format';

export type PaletteIndex = {
  id: string;
  label: string;
  sub: string;
};

type Props = {
  properties: (PaletteIndex & { status: string })[];
  contractors: PaletteIndex[];
};

const PALETTE_OPEN_EVENT = 'rehabops:palette';
const NEW_PROPERTY_EVENT = 'rehabops:new-property';
const NEW_CONTRACTOR_EVENT = 'rehabops:new-contractor';
const NEW_JOB_EVENT = 'rehabops:new-job';

export function fireOpenPalette() {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(PALETTE_OPEN_EVENT));
}

export function CommandPaletteRoot({ properties, contractors }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const n8nUrl = externalUrl(process.env.NEXT_PUBLIC_N8N_URL);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(PALETTE_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(PALETTE_OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };
  const fire = (event: string) => {
    setOpen(false);
    window.dispatchEvent(new Event(event));
  };

  return (
    <RDialog.Root open={open} onOpenChange={setOpen}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <RDialog.Content className="fixed left-1/2 top-[18%] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-elevated data-[state=open]:animate-fade-in">
          <RDialog.Title className="sr-only">Command palette</RDialog.Title>
          <RDialog.Description className="sr-only">
            Quick navigation and actions
          </RDialog.Description>
          <Command label="Quick actions" className="bg-transparent">
            <div className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
              <Search className="size-4 text-ink-faint" />
              <Command.Input
                autoFocus
                placeholder="Search properties, contractors, or run an action…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              />
              <kbd className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-faint ring-1 ring-line">
                ESC
              </kbd>
            </div>
            <Command.List className="max-h-[60vh] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-6 text-center text-sm text-ink-faint">
                No matches.
              </Command.Empty>

              <Command.Group heading="Create">
                <PItem onSelect={() => fire(NEW_PROPERTY_EVENT)} icon={<Plus className="size-4" />}>
                  New property
                </PItem>
                <PItem onSelect={() => fire(NEW_JOB_EVENT)} icon={<Hammer className="size-4" />}>
                  New job
                </PItem>
                <PItem
                  onSelect={() => fire(NEW_CONTRACTOR_EVENT)}
                  icon={<HardHat className="size-4" />}
                >
                  New contractor
                </PItem>
              </Command.Group>

              <Command.Group heading="Navigate">
                <PItem onSelect={() => go('/')} icon={<HomeIcon className="size-4" />}>
                  Portfolio
                </PItem>
                <PItem
                  onSelect={() => go('/contractors')}
                  icon={<HardHat className="size-4" />}
                >
                  Contractors
                </PItem>
                <PItem onSelect={() => go('/jobs')} icon={<Hammer className="size-4" />}>
                  Jobs
                </PItem>
                <PItem onSelect={() => go('/reports')} icon={<TrendingUp className="size-4" />}>
                  Reports & P&L
                </PItem>
                {n8nUrl && (
                  <PItem
                    onSelect={() => {
                      setOpen(false);
                      window.open(n8nUrl, '_blank');
                    }}
                    icon={<Workflow className="size-4" />}
                  >
                    Open n8n builder
                  </PItem>
                )}
              </Command.Group>

              {properties.length > 0 && (
                <Command.Group heading="Properties">
                  {properties.map((p) => (
                    <PItem
                      key={p.id}
                      value={`property ${p.label} ${p.sub} ${p.status}`}
                      onSelect={() => go(`/properties/${p.id}`)}
                      icon={<Building2 className="size-4" />}
                      sub={`${p.sub} · ${p.status.replace(/_/g, ' ')}`}
                    >
                      {p.label}
                    </PItem>
                  ))}
                </Command.Group>
              )}

              {contractors.length > 0 && (
                <Command.Group heading="Contractors">
                  {contractors.map((c) => (
                    <PItem
                      key={c.id}
                      value={`contractor ${c.label} ${c.sub}`}
                      onSelect={() => go(`/contractors/${c.id}`)}
                      icon={<HardHat className="size-4" />}
                      sub={c.sub}
                    >
                      {c.label}
                    </PItem>
                  ))}
                </Command.Group>
              )}
            </Command.List>
            <div className="flex items-center justify-between border-t border-line/70 px-4 py-2 text-[11px] text-ink-faint">
              <span>
                <kbd className="rounded bg-surface-2 px-1.5 py-0.5 ring-1 ring-line">↑↓</kbd>{' '}
                navigate ·{' '}
                <kbd className="rounded bg-surface-2 px-1.5 py-0.5 ring-1 ring-line">↵</kbd>{' '}
                select
              </span>
              <span>
                <kbd className="rounded bg-surface-2 px-1.5 py-0.5 ring-1 ring-line">⌘K</kbd>{' '}
                toggle
              </span>
            </div>
          </Command>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

function PItem({
  children,
  onSelect,
  icon,
  sub,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  icon?: React.ReactNode;
  sub?: string;
  value?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      value={value}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-dim aria-selected:bg-surface-2 aria-selected:text-ink"
    >
      <span className="text-ink-faint">{icon ?? <Send className="size-4" />}</span>
      <span className="flex-1 truncate">{children}</span>
      {sub && <span className="truncate text-xs text-ink-faint">{sub}</span>}
    </Command.Item>
  );
}
