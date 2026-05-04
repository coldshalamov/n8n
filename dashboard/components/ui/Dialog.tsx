'use client';

import * as RDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import clsx from 'clsx';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
};

const SIZE_CLASS: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <RDialog.Content
          className={clsx(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface text-ink shadow-elevated data-[state=open]:animate-scale-in',
            SIZE_CLASS[size],
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line/70 px-6 pt-5 pb-4">
            <div className="min-w-0">
              <RDialog.Title className="text-base font-semibold tracking-tight">
                {title}
              </RDialog.Title>
              {description && (
                <RDialog.Description className="mt-1 text-xs text-ink-dim">
                  {description}
                </RDialog.Description>
              )}
            </div>
            <RDialog.Close
              aria-label="Close"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-4" />
            </RDialog.Close>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-line/70 bg-surface-2/40 px-6 py-3">
              {footer}
            </div>
          )}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;
