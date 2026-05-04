'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { FieldRow } from '@/components/ui/Field';
import { upsertBudgetItem, deleteBudgetItem } from '@/lib/actions/budget';
import type { BudgetItem } from '@/lib/db.types';
import { money, pct } from '@/lib/format';
import { BudgetBar } from './BudgetBar';

const COMMON_CATEGORIES = [
  'demo',
  'framing',
  'plumbing',
  'electrical',
  'hvac',
  'roofing',
  'kitchen',
  'bath',
  'flooring',
  'paint',
  'cabinetry',
  'fixtures',
  'landscape',
  'permits',
  'cleanup',
  'contingency',
];

export function BudgetEditor({
  propertyId,
  items,
  totalBudget,
  totalSpent,
}: {
  propertyId: string;
  items: BudgetItem[];
  totalBudget: number;
  totalSpent: number;
}) {
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-faint">Budget</div>
          <div className="num text-base text-ink">
            {money(totalSpent)}
            <span className="text-ink-faint"> spent of </span>
            {money(totalBudget)}
            <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs">
              {pct(totalSpent, totalBudget)}%
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus className="size-3.5" />}
          onClick={() => setAdding(true)}
        >
          Add line item
        </Button>
      </div>

      <BudgetBar spent={totalSpent} budget={totalBudget} showLabels={false} />

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
          {items.map((b) => {
            const p = pct(Number(b.actual), Number(b.estimated));
            const tone =
              p >= 100 ? 'text-bad' : p >= 90 ? 'text-warn' : 'text-ink';
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setEditing(b)}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
              >
                <span className="w-28 shrink-0 truncate text-sm capitalize text-ink-dim">
                  {b.category}
                </span>
                <span className="flex-1">
                  <BudgetBar
                    spent={Number(b.actual)}
                    budget={Number(b.estimated)}
                    showLabels={false}
                    compact
                  />
                </span>
                <span className={`num w-32 text-right text-xs ${tone}`}>
                  {money(Number(b.actual))}
                  <span className="text-ink-faint"> / {money(Number(b.estimated))}</span>
                </span>
                <Pencil className="size-3.5 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-surface-2/40 p-4 text-sm text-ink-faint">
          No budget breakdown yet. Add categories to track spend per scope.
        </div>
      )}

      <Dialog
        open={adding}
        onOpenChange={setAdding}
        title="Add budget line"
        description="Will roll into total rehab budget for this property."
      >
        <BudgetItemForm
          propertyId={propertyId}
          onSuccess={() => setAdding(false)}
        />
      </Dialog>

      <Dialog
        open={editing != null}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit budget line"
        description={editing?.category}
      >
        {editing && (
          <BudgetItemForm
            propertyId={propertyId}
            item={editing}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function BudgetItemForm({
  propertyId,
  item,
  onSuccess,
}: {
  propertyId: string;
  item?: BudgetItem;
  onSuccess: () => void;
}) {
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();

  const submit = (formData: FormData) => {
    formData.set('property_id', propertyId);
    start(async () => {
      const r = await upsertBudgetItem(item?.id ?? null, formData);
      if (r.ok) {
        toast.success(r.message ?? 'Saved');
        onSuccess();
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <form action={submit} className="space-y-4">
      <Input
        name="category"
        label="Category"
        list="budget-categories"
        defaultValue={item?.category ?? ''}
        required
      />
      <datalist id="budget-categories">
        {COMMON_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <FieldRow>
        <Input
          name="estimated"
          label="Estimated"
          prefix="$"
          type="number"
          min={0}
          defaultValue={item?.estimated ?? ''}
        />
        <Input
          name="actual"
          label="Actual to date"
          prefix="$"
          type="number"
          min={0}
          defaultValue={item?.actual ?? ''}
        />
      </FieldRow>
      <Textarea name="notes" label="Notes" rows={2} defaultValue={item?.notes ?? ''} />

      <div className="flex items-center justify-between">
        {item ? (
          <Button
            type="button"
            variant="danger"
            icon={<Trash2 className="size-3.5" />}
            loading={deleting}
            onClick={() =>
              startDelete(async () => {
                const r = await deleteBudgetItem(item.id, propertyId);
                if (r.ok) {
                  toast.success(r.message ?? 'Removed');
                  onSuccess();
                } else {
                  toast.error(r.error);
                }
              })
            }
          >
            Delete
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary" loading={pending}>
          {item ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  );
}
