import { CircleCheck, CircleDollarSign, FileSignature, MessagesSquare, Send, Activity } from 'lucide-react';
import type { ActivityLog } from '@/lib/db.types';
import { relativeDate } from '@/lib/format';

const ICONS: Record<string, typeof Activity> = {
  job_completed: CircleCheck,
  invoice_submitted: CircleDollarSign,
  invoice_approved: CircleDollarSign,
  bid_submitted: FileSignature,
  status_changed: Activity,
  note_added: MessagesSquare,
  email_received: Send,
};

const TONES: Record<string, string> = {
  job_completed: 'text-ok',
  invoice_submitted: 'text-warn',
  invoice_approved: 'text-ok',
  bid_submitted: 'text-info',
  status_changed: 'text-accent-soft',
  note_added: 'text-ink-dim',
  email_received: 'text-info',
};

function describe(a: ActivityLog): string {
  const d = a.details ?? {};
  switch (a.action) {
    case 'job_completed':
      return `Completed ${(d as { job?: string }).job ?? 'a job'}`;
    case 'invoice_submitted': {
      const amt = (d as { amount?: number }).amount;
      return `Submitted invoice${amt ? ` for $${amt.toLocaleString()}` : ''}`;
    }
    case 'bid_submitted': {
      const amt = (d as { amount?: number }).amount;
      return `Submitted bid${amt ? ` for $${amt.toLocaleString()}` : ''}`;
    }
    case 'status_changed': {
      const to = (d as { to?: string }).to;
      return `Status changed${to ? ` to ${to.replace(/_/g, ' ')}` : ''}`;
    }
    case 'note_added':
      return (d as { note?: string }).note ?? 'Added a note';
    case 'email_received':
      return `Email received${(d as { subject?: string }).subject ? `: ${(d as { subject?: string }).subject}` : ''}`;
    default:
      return a.action.replace(/_/g, ' ');
  }
}

export function ActivityFeed({ items }: { items: ActivityLog[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-2/40 p-4 text-sm text-ink-faint">
        No activity yet.
      </div>
    );
  }
  return (
    <ol className="relative space-y-4 before:absolute before:left-3.5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-line">
      {items.map((a) => {
        const Icon = ICONS[a.action] ?? Activity;
        const tone = TONES[a.action] ?? 'text-ink-dim';
        return (
          <li key={a.id} className="relative flex gap-3">
            <div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 ring-1 ring-line ${tone}`}>
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="line-clamp-2 text-sm leading-snug text-ink">
                {describe(a)}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
                <span>{a.actor ?? 'system'}</span>
                <span>·</span>
                <span>{relativeDate(a.created_at)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
