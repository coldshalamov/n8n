'use client';

import { useTransition } from 'react';
import { Check, AlertTriangle, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { setInvoiceStatus } from '@/lib/actions/invoices';
import type { InvoiceStatus } from '@/lib/db.types';

export function InvoiceActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: InvoiceStatus;
}) {
  const [pending, start] = useTransition();

  const set = (next: InvoiceStatus) =>
    start(async () => {
      const r = await setInvoiceStatus(invoiceId, next);
      if (r.ok) toast.success(r.message ?? `Invoice ${next}`);
      else toast.error(r.error);
    });

  if (status === 'paid')
    return <span className="text-xs text-ok">Paid · settled</span>;

  return (
    <div className="flex items-center gap-1.5">
      {status === 'pending' && (
        <button
          type="button"
          onClick={() => set('approved')}
          disabled={pending}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-info/10 px-2 text-xs text-info ring-1 ring-info/30 hover:bg-info/15"
        >
          <Check className="size-3" />
          Approve
        </button>
      )}
      {status !== 'disputed' && (
        <button
          type="button"
          onClick={() => set('disputed')}
          disabled={pending}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-bad/10 px-2 text-xs text-bad ring-1 ring-bad/30 hover:bg-bad/15"
        >
          <AlertTriangle className="size-3" />
          Dispute
        </button>
      )}
      {status !== 'pending' && (
        <button
          type="button"
          onClick={() => set('paid')}
          disabled={pending}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-ok/10 px-2 text-xs text-ok ring-1 ring-ok/30 hover:bg-ok/15"
        >
          <Banknote className="size-3" />
          Mark paid
        </button>
      )}
    </div>
  );
}
