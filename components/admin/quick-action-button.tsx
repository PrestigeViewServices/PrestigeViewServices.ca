"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * One-tap server-action button for list rows (e.g. "Mark contacted").
 * Shows a spinner while pending and a checkmark once done; the page's
 * revalidate then refreshes the row's real state.
 */
export function QuickActionButton({
  rowId,
  action,
  label,
  doneLabel = "Done",
}: {
  rowId: string;
  /** Server action invoked with the row id. Throws on failure. */
  action: (id: string) => Promise<void>;
  label: string;
  doneLabel?: string;
}) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending || done}
      onClick={() =>
        startTransition(async () => {
          try {
            await action(rowId);
            setDone(true);
          } catch {
            // Revalidation shows the truth either way.
          }
        })
      }
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : done ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : null}
      {done ? doneLabel : label}
    </Button>
  );
}
