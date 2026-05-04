'use client';

import { useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { approveBid, rejectBid } from '@/lib/actions/bids';
import { Button } from '@/components/ui/Button';

export function BidActions({ bidId, status }: { bidId: string; status: string }) {
  const [pending, start] = useTransition();

  if (status !== 'pending') return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="primary"
        icon={<Check className="size-3.5" />}
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await approveBid(bidId);
            if (r.ok) toast.success(r.message ?? 'Bid approved');
            else toast.error(r.error);
          })
        }
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<X className="size-3.5" />}
        onClick={() =>
          start(async () => {
            const r = await rejectBid(bidId);
            if (r.ok) toast.success(r.message ?? 'Bid rejected');
            else toast.error(r.error);
          })
        }
      >
        Reject
      </Button>
    </div>
  );
}
