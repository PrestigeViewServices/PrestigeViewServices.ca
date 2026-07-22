"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/**
 * Inline notes editor for an Application row. Read-only by default; click
 * "Edit" to enter edit mode. Save calls the passed-in server action.
 *
 * Notes are factual only, don't treat this as a free-form chat channel.
 */
export function NotesEditor({
  rowId,
  initialNotes,
  action,
}: {
  rowId: string;
  initialNotes: string | null;
  action: (id: string, notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await action(rowId, draft);
        setNotes(draft);
        setEditing(false);
      } catch {
        // surface a tiny error inline next iteration; quiet failure for now.
      }
    });
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Internal notes
        </p>
        {notes ? (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">
            {notes}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No notes.</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDraft(notes);
            setEditing(true);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Internal notes
      </p>
      <Textarea
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Factual notes only, reference checks, scheduling constraints, etc."
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={isPending}>
          <Check className="h-3.5 w-3.5" />
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(notes);
            setEditing(false);
          }}
          disabled={isPending}
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
