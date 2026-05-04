'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { FieldRow } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { createJob, updateJob } from '@/lib/actions/jobs';
import type { Contractor, Job, JobStatus, Property } from '@/lib/db.types';

const STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'bid_requested', label: 'Bid requested' },
  { value: 'bid_received', label: 'Bid received' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'complete', label: 'Complete' },
  { value: 'paid', label: 'Paid' },
];

const TRADES = [
  'general',
  'electrical',
  'plumbing',
  'roofing',
  'hvac',
  'paint',
  'flooring',
  'cabinets',
  'landscape',
  'demo',
  'inspection',
  'other',
];

export function JobForm({
  job,
  defaultPropertyId,
  properties,
  contractors,
  onSuccess,
}: {
  job?: Job | null;
  defaultPropertyId?: string;
  properties: Pick<Property, 'id' | 'address'>[];
  contractors: Pick<Contractor, 'id' | 'company_name' | 'trade'>[];
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const submit = (formData: FormData) => {
    startTransition(async () => {
      const result = job ? await updateJob(job.id, formData) : await createJob(formData);
      if (result.ok) {
        toast.success(result.message ?? 'Saved');
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form action={submit} className="space-y-6">
      <Input
        name="title"
        label="Job title"
        placeholder="Tear out kitchen cabinets"
        required
        defaultValue={job?.title ?? ''}
      />
      <FieldRow>
        <Select
          name="property_id"
          label="Property"
          defaultValue={job?.property_id ?? defaultPropertyId ?? ''}
        >
          <option value="">— None —</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </Select>
        <Select
          name="contractor_id"
          label="Contractor"
          defaultValue={job?.contractor_id ?? ''}
        >
          <option value="">— Unassigned —</option>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name} {c.trade ? `· ${c.trade}` : ''}
            </option>
          ))}
        </Select>
      </FieldRow>
      <FieldRow>
        <Select name="trade" label="Trade" defaultValue={job?.trade ?? 'general'}>
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </Select>
        <Select name="status" label="Status" defaultValue={job?.status ?? 'pending'}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </FieldRow>
      <FieldRow>
        <Input
          name="estimated_cost"
          label="Estimated cost"
          prefix="$"
          type="number"
          min={0}
          defaultValue={job?.estimated_cost ?? ''}
        />
        <Input
          name="actual_cost"
          label="Actual cost"
          prefix="$"
          type="number"
          min={0}
          defaultValue={job?.actual_cost ?? ''}
        />
      </FieldRow>
      <FieldRow>
        <Input
          name="start_date"
          label="Start date"
          type="date"
          defaultValue={job?.start_date ?? ''}
        />
        <Input
          name="due_date"
          label="Due date"
          type="date"
          defaultValue={job?.due_date ?? ''}
        />
      </FieldRow>
      <Textarea
        name="description"
        label="Scope"
        rows={3}
        placeholder="Detailed scope — included, excluded, materials, who supplies what."
        defaultValue={job?.description ?? ''}
      />
      <Textarea
        name="notes"
        label="Notes"
        rows={2}
        defaultValue={job?.notes ?? ''}
      />

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" variant="primary" loading={pending}>
          {job ? 'Save changes' : 'Create job'}
        </Button>
      </div>
    </form>
  );
}
