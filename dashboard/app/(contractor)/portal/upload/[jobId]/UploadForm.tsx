'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, FileCheck2, FileX2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Item = {
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

function detectType(file: File) {
  if (IMAGE_TYPES.includes(file.type)) return 'photo';
  if (/lien/i.test(file.name) || /waiver/i.test(file.name)) return 'lien_waiver';
  if (/permit/i.test(file.name)) return 'permit';
  if (/invoice/i.test(file.name)) return 'invoice';
  if (/contract/i.test(file.name)) return 'contract';
  return 'other';
}

export function UploadForm({
  jobId,
  propertyId,
  contractorId,
  contractorName,
}: {
  jobId: string;
  propertyId: string | null;
  contractorId: string;
  contractorName: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();

  function add(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map((f) => ({ file: f, status: 'queued' as const }));
    setItems((prev) => [...prev, ...next]);
  }

  async function uploadAll() {
    const queued = items
      .map((it, i) => ({ ...it, idx: i }))
      .filter((it) => it.status === 'queued');
    let uploadedCount = 0;

    for (const { idx, file } of queued) {
      setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status: 'uploading' } : it)));
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${jobId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(path);

        const { error: insertError } = await supabase.from('documents').insert({
          property_id: propertyId,
          job_id: jobId,
          contractor_id: contractorId,
          type: detectType(file),
          filename: file.name,
          url: publicUrl,
          uploaded_by: contractorName,
        });
        if (insertError) throw insertError;
        uploadedCount += 1;

        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, status: 'done' } : it)),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setItems((prev) =>
          prev.map((it, i) =>
            i === idx ? { ...it, status: 'error', error: msg } : it,
          ),
        );
      }
    }

    // Log the activity (one entry covering the batch)
    if (uploadedCount > 0) {
      await supabase.from('activity_log').insert({
        job_id: jobId,
        actor: contractorName,
        action: 'photos_uploaded',
        details: { count: uploadedCount },
      });
    }

    startTransition(() => router.refresh());
  }

  const allDone = items.length > 0 && items.every((i) => i.status === 'done');

  return (
    <div className="space-y-4 rounded-2xl bg-surface ring-1 ring-line p-5 lg:p-6 shadow-card">
      <label className="block">
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => add(e.target.files)}
          className="sr-only"
        />
        <div className="cursor-pointer rounded-xl border-2 border-dashed border-line p-8 text-center hover:border-accent/40 hover:bg-surface-2/50 transition">
          <Camera className="mx-auto size-8 text-ink-faint" />
          <div className="mt-3 text-sm font-medium text-ink">
            Tap to choose photos or PDFs
          </div>
          <div className="mt-1 text-xs text-ink-faint">
            JPEG, PNG, HEIC, PDF — multiple selections OK
          </div>
        </div>
      </label>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={`${it.file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg bg-surface-2 ring-1 ring-line px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{it.file.name}</div>
                <div className="text-xs text-ink-faint">
                  {(it.file.size / 1024).toFixed(0)} KB
                  {it.status === 'error' && it.error && ` · ${it.error}`}
                </div>
              </div>
              <StatusIcon status={it.status} />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={uploadAll}
        disabled={items.length === 0 || items.every((i) => i.status === 'done') || isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-accent to-accent-soft px-4 py-2.5 text-sm font-medium text-bg shadow-glow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="size-4" />
        {allDone ? 'All uploaded' : 'Upload all'}
      </button>
    </div>
  );
}

function StatusIcon({ status }: { status: Item['status'] }) {
  if (status === 'done') return <FileCheck2 className="size-4 text-ok" />;
  if (status === 'error') return <FileX2 className="size-4 text-bad" />;
  if (status === 'uploading')
    return (
      <span className="size-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    );
  return <span className="text-xs text-ink-faint">queued</span>;
}
