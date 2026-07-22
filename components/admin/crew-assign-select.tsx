"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Assigns a job to a crew via a server action. Optimistic; reverts on error.
 * Empty `current` (unassigned) shows the placeholder.
 */
export function CrewAssignSelect({
  jobId,
  current,
  crews,
  action,
}: {
  jobId: string;
  current: string | null;
  crews: { id: string; name: string }[];
  action: (jobId: string, crewId: string) => Promise<void>;
}) {
  const [value, setValue] = useState(current ?? "");
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      try {
        await action(jobId, next);
      } catch {
        setValue(prev);
      }
    });
  }

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-9 w-44 text-sm">
        <SelectValue placeholder="Assign crew…" />
      </SelectTrigger>
      <SelectContent>
        {crews.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
