'use client';

import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { MessageSquarePlus } from 'lucide-react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { addNote } from '@/lib/actions/budget';

export function NoteComposer({ propertyId }: { propertyId: string }) {
  const [text, setText] = useState('');
  const [pending, start] = useTransition();

  return (
    <form
      action={() =>
        start(async () => {
          const r = await addNote(propertyId, text);
          if (r.ok) {
            toast.success(r.message ?? 'Note added');
            setText('');
          } else {
            toast.error(r.error);
          }
        })
      }
      className="space-y-2"
    >
      <Textarea
        name="note"
        rows={2}
        placeholder="Drop a note — anything relevant for the team."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          icon={<MessageSquarePlus className="size-3.5" />}
          disabled={!text.trim() || pending}
          loading={pending}
        >
          Post note
        </Button>
      </div>
    </form>
  );
}
