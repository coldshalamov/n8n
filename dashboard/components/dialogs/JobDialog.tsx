'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { JobForm } from '@/components/forms/JobForm';
import type { Contractor, Job, Property } from '@/lib/db.types';

type CommonProps = {
  properties: Pick<Property, 'id' | 'address'>[];
  contractors: Pick<Contractor, 'id' | 'company_name' | 'trade'>[];
};

export function NewJobButton({
  defaultPropertyId,
  label = 'New job',
  size = 'md',
  ...common
}: CommonProps & {
  defaultPropertyId?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="primary"
        size={size}
        icon={<Plus className="size-4" />}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="New job"
        description="Spec the work. Assign a contractor or leave open and request bids."
      >
        <JobForm
          {...common}
          defaultPropertyId={defaultPropertyId}
          onSuccess={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}

export function EditJobButton({
  job,
  size = 'sm',
  ...common
}: CommonProps & { job: Job; size?: 'sm' | 'md' | 'lg' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size={size}
        icon={<Pencil className="size-3.5" />}
        onClick={() => setOpen(true)}
      >
        Edit
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="Edit job"
        description={job.title}
      >
        <JobForm {...common} job={job} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
