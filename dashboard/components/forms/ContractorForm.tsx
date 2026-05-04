'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { FieldGroup, FieldRow } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import {
  createContractor,
  updateContractor,
} from '@/lib/actions/contractors';
import type { Contractor } from '@/lib/db.types';

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

export function ContractorForm({
  contractor,
  onSuccess,
}: {
  contractor?: Contractor | null;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const result = contractor
        ? await updateContractor(contractor.id, formData)
        : await createContractor(formData);
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
      <FieldGroup title="Company">
        <Input
          name="company_name"
          label="Company name"
          required
          defaultValue={contractor?.company_name ?? ''}
        />
        <FieldRow>
          <Input
            name="contact_name"
            label="Primary contact"
            defaultValue={contractor?.contact_name ?? ''}
          />
          <Select
            name="trade"
            label="Trade"
            defaultValue={contractor?.trade ?? 'general'}
          >
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
        </FieldRow>
        <FieldRow>
          <Input
            name="email"
            label="Email"
            type="email"
            defaultValue={contractor?.email ?? ''}
          />
          <Input
            name="phone"
            label="Phone"
            type="tel"
            defaultValue={contractor?.phone ?? ''}
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup title="Compliance">
        <FieldRow>
          <Input
            name="license_number"
            label="License #"
            defaultValue={contractor?.license_number ?? ''}
          />
          <Input
            name="insurance_expiry"
            label="Insurance expires"
            type="date"
            defaultValue={contractor?.insurance_expiry ?? ''}
          />
        </FieldRow>
        <Select
          name="rating"
          label="Rating (1–5)"
          defaultValue={contractor?.rating ?? 3}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {'★'.repeat(n)}
              {'☆'.repeat(5 - n)} · {n}/5
            </option>
          ))}
        </Select>
      </FieldGroup>

      <Textarea
        name="notes"
        label="Notes"
        rows={3}
        placeholder="Trade specialties, scheduling preferences, payment terms…"
        defaultValue={contractor?.notes ?? ''}
      />

      <div className="flex items-center justify-end">
        <Button type="submit" variant="primary" loading={pending}>
          {contractor ? 'Save changes' : 'Add contractor'}
        </Button>
      </div>
    </form>
  );
}
