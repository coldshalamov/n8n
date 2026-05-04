'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { FieldGroup, FieldRow } from '@/components/ui/Field';
import { requestBids } from '@/lib/actions/jobs';
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

export function RequestBidsButton({
  propertyId,
  contractors,
}: {
  propertyId: string;
  contractors: Pick<Contractor, 'id' | 'company_name' | 'trade' | 'rating'>[];
}) {
  const [open, setOpen] = useState(false);
  const [trade, setTrade] = useState<string>('general');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const filtered = trade === 'all' ? contractors : contractors.filter((c) => c.trade === trade);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = (formData: FormData) => {
    if (selected.size === 0) {
      toast.error('Pick at least one contractor');
      return;
    }
    start(async () => {
      const result = await requestBids({
        property_id: propertyId,
        title: String(formData.get('title') ?? '').trim(),
        trade,
        description: String(formData.get('description') ?? '').trim() || null,
        estimated_cost:
          Number(formData.get('estimated_cost')) > 0
            ? Number(formData.get('estimated_cost'))
            : null,
        due_date: String(formData.get('due_date') ?? '') || null,
        contractor_ids: [...selected],
      });
      if (result.ok) {
        toast.success(result.message ?? 'Bids requested');
        setSelected(new Set());
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        icon={<Send className="size-3.5" />}
        size="sm"
        onClick={() => setOpen(true)}
      >
        Request bids
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="Request bids"
        description="Fans out via n8n → HighLevel SMS/email to every selected contractor."
      >
        <form action={submit} className="space-y-5">
          <FieldGroup title="Scope">
            <Input name="title" label="Job title" required placeholder="Replace kitchen cabinets" />
            <FieldRow>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">
                  Trade
                </span>
                <select
                  className="h-10 w-full rounded-lg bg-surface-2 px-3 text-sm text-ink ring-1 ring-line outline-none focus:ring-accent/50"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                >
                  <option value="all">All trades</option>
                  {TRADES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                name="estimated_cost"
                label="Budget target"
                prefix="$"
                type="number"
                min={0}
              />
            </FieldRow>
            <FieldRow>
              <Input name="due_date" label="Bids due by" type="date" />
              <Select name="" label="Selected" disabled>
                <option>{selected.size} contractor{selected.size === 1 ? '' : 's'}</option>
              </Select>
            </FieldRow>
            <Textarea
              name="description"
              label="Scope of work"
              rows={3}
              placeholder="Specifics: materials, timeline, what's included."
            />
          </FieldGroup>

          <FieldGroup title="Contractors">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line bg-surface-2/40 p-3 text-sm text-ink-faint">
                No contractors for this trade. Add one or pick &ldquo;All trades&rdquo;.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filtered.map((c) => {
                  const on = selected.has(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => toggle(c.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          on
                            ? 'border-accent/60 bg-accent/10'
                            : 'border-line bg-surface-2 hover:border-accent/30'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">
                            {c.company_name}
                          </span>
                          <span className="block truncate text-xs text-ink-faint">
                            {c.trade ?? '—'} · {c.rating ?? 3}/5
                          </span>
                        </span>
                        <span
                          className={`grid size-5 place-items-center rounded-md text-bg ${
                            on ? 'bg-accent' : 'bg-surface-3 ring-1 ring-line'
                          }`}
                        >
                          {on && <span className="text-xs">✓</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </FieldGroup>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={pending}
              icon={<Send className="size-4" />}
            >
              Send to {selected.size || '—'} contractor{selected.size === 1 ? '' : 's'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
