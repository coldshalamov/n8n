'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ContractorForm } from '@/components/forms/ContractorForm';
import type { Contractor } from '@/lib/db.types';

export function NewContractorButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="primary"
        size={size}
        icon={<Plus className="size-4" />}
        onClick={() => setOpen(true)}
      >
        Add contractor
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="Add contractor"
        description="Bring a new trade onto the bench."
      >
        <ContractorForm onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

export function EditContractorButton({
  contractor,
  size = 'sm',
}: {
  contractor: Contractor;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
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
        title="Edit contractor"
        description={contractor.company_name}
      >
        <ContractorForm contractor={contractor} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
