import clsx from 'clsx';
import {
  jobStatusLabel,
  propertyStatusLabel,
} from '@/lib/format';
import type { JobStatus, PropertyStatus } from '@/lib/db.types';

const PROPERTY_STYLES: Record<PropertyStatus, string> = {
  acquired:    'bg-info/15      text-info       ring-info/30',
  permitting:  'bg-warn/15      text-warn       ring-warn/30',
  in_progress: 'bg-accent/15    text-accent-soft ring-accent/30',
  punch_list:  'bg-purple-500/15 text-purple-300 ring-purple-500/30',
  listing:     'bg-cyan-500/15  text-cyan-300   ring-cyan-500/30',
  sold:        'bg-ok/15        text-ok         ring-ok/30',
};

const JOB_STYLES: Record<JobStatus, string> = {
  pending:       'bg-ink-faint/15 text-ink-dim    ring-ink-faint/20',
  bid_requested: 'bg-info/15      text-info       ring-info/30',
  bid_received:  'bg-info/15      text-info       ring-info/30',
  approved:      'bg-purple-500/15 text-purple-300 ring-purple-500/30',
  in_progress:   'bg-accent/15    text-accent-soft ring-accent/30',
  inspection:    'bg-warn/15      text-warn       ring-warn/30',
  complete:      'bg-ok/15        text-ok         ring-ok/30',
  paid:          'bg-ok/15        text-ok         ring-ok/30',
};

export function PropertyStatusBadge({
  status,
  size = 'sm',
}: {
  status: PropertyStatus;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full ring-1 font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        PROPERTY_STYLES[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {propertyStatusLabel(status)}
    </span>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1',
        JOB_STYLES[status],
      )}
    >
      {jobStatusLabel(status)}
    </span>
  );
}
