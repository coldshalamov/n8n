'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { PropertyForm } from '@/components/forms/PropertyForm';
import type { Property } from '@/lib/db.types';

export function NewPropertyButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="primary"
        size={size}
        icon={<Plus className="size-4" />}
        onClick={() => setOpen(true)}
      >
        New property
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="New property"
        description="Add a property to the operating portfolio. You can flesh out budget items and jobs after."
      >
        <PropertyForm onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

export function EditPropertyButton({
  property,
  size = 'sm',
  variant = 'secondary',
}: {
  property: Property;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
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
        title="Edit property"
        description={property.address}
      >
        <PropertyForm property={property} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
