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
 * Calls a server action to update a row's status (Application or
 * SupportRequest). Optimistically shows the new value; reverts on error.
 */
export function StatusSelect({
  rowId,
  current,
  options,
  action,
}: {
  rowId: string;
  current: string;
  options: { value: string; label: string }[];
  /** Server action that updates the row. Throws on failure. */
  action: (id: string, status: string) => Promise<void>;
}) {
  const [value, setValue] = useState(current);
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      try {
        await action(rowId, next);
      } catch {
        setValue(prev);
      }
    });
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-9 w-44 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
