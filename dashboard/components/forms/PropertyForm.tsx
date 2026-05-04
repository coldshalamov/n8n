'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { FieldGroup, FieldRow } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import {
  createProperty,
  updateProperty,
  uploadHeroImage,
} from '@/lib/actions/properties';
import type { Property, PropertyStatus } from '@/lib/db.types';
import { ImageUp } from 'lucide-react';

const STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'acquired', label: 'Acquired' },
  { value: 'permitting', label: 'Permitting' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'punch_list', label: 'Punch list' },
  { value: 'listing', label: 'Listing' },
  { value: 'sold', label: 'Sold' },
];

type Props = {
  property?: Property | null;
  onSuccess?: () => void;
};

export function PropertyForm({ property, onSuccess }: Props) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [heroPreview, setHeroPreview] = useState<string | null>(
    property?.hero_image_url ?? null,
  );

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const action = property ? updateProperty(property.id, formData) : createProperty(formData);
      const result = await action;
      if (result.ok) {
        toast.success(result.message ?? 'Saved');
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleHeroUpload = async (file: File | null) => {
    if (!file || !property) return;
    setUploading(true);
    const fd = new FormData();
    fd.set('file', file);
    const r = await uploadHeroImage(property.id, file);
    setUploading(false);
    if (r.ok) {
      toast.success('Photo uploaded');
      // optimistic preview from local URL
      setHeroPreview(URL.createObjectURL(file));
    } else {
      toast.error(r.error);
    }
  };

  return (
    <form action={submit} className="space-y-6">
      <FieldGroup title="Property">
        <Input
          name="address"
          label="Street address"
          placeholder="123 Coral Way"
          defaultValue={property?.address ?? ''}
          required
        />
        <FieldRow>
          <Input name="city" label="City" defaultValue={property?.city ?? 'Miami'} />
          <FieldRow>
            <Input name="state" label="State" defaultValue={property?.state ?? 'FL'} maxLength={2} />
            <Input name="zip" label="ZIP" defaultValue={property?.zip ?? ''} />
          </FieldRow>
        </FieldRow>

        <FieldRow>
          <Select
            name="status"
            label="Stage"
            defaultValue={property?.status ?? 'acquired'}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Input
            name="bedrooms"
            label="Bedrooms"
            type="number"
            defaultValue={property?.bedrooms ?? ''}
            min={0}
          />
        </FieldRow>
        <FieldRow>
          <Input
            name="bathrooms"
            label="Bathrooms"
            type="number"
            step="0.5"
            defaultValue={property?.bathrooms ?? ''}
            min={0}
          />
          <Input
            name="square_feet"
            label="Square feet"
            type="number"
            defaultValue={property?.square_feet ?? ''}
            min={0}
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup title="Money">
        <FieldRow>
          <Input
            name="purchase_price"
            label="Purchase price"
            prefix="$"
            type="number"
            defaultValue={property?.purchase_price ?? ''}
            min={0}
          />
          <Input
            name="target_sale_price"
            label="Target sale"
            prefix="$"
            type="number"
            defaultValue={property?.target_sale_price ?? ''}
            min={0}
          />
        </FieldRow>
        <FieldRow>
          <Input
            name="actual_sale_price"
            label="Actual sale"
            prefix="$"
            type="number"
            defaultValue={property?.actual_sale_price ?? ''}
            hint="Fill in when the property closes"
            min={0}
          />
          <Input
            name="total_budget"
            label="Total rehab budget"
            prefix="$"
            type="number"
            defaultValue={property?.total_budget ?? ''}
            hint="Auto-rolls when budget items added"
            min={0}
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup title="Hero photo">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-line">
            {heroPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroPreview}
                alt="hero"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-ink-faint">
                <ImageUp className="size-5" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Input
              name="hero_image_url"
              label="Hero image URL"
              placeholder="https://…"
              defaultValue={property?.hero_image_url ?? ''}
              hint="Or upload below — drops a public URL into this field"
            />
            {property && (
              <label className="mt-2 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-surface-2 px-3 text-xs font-medium text-ink-dim ring-1 ring-line transition-colors hover:bg-surface-3 hover:text-ink">
                <ImageUp className="size-4" />
                {uploading ? 'Uploading…' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleHeroUpload(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Notes">
        <Textarea
          name="notes"
          label="Internal notes"
          rows={4}
          placeholder="Anything the team should know — site access, lender constraints, scope considerations…"
          defaultValue={property?.notes ?? ''}
        />
      </FieldGroup>

      <div className="flex items-center justify-end gap-2">
        <Button variant="primary" type="submit" loading={pending}>
          {property ? 'Save changes' : 'Create property'}
        </Button>
      </div>
    </form>
  );
}
