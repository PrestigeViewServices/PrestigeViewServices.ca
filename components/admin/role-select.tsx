"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ROLE_LABELS,
  ULTIMATE_ADMIN_ASSIGNABLE_ROLES,
  type Role,
} from "@/lib/roles";

/**
 * Role change dropdown. Only rendered for ultimate_admin (page gates this).
 * Calls a server action that re-checks the caller's role before writing.
 */
export function RoleSelect({
  userId,
  current,
  action,
  disabled,
}: {
  userId: string;
  current: Role;
  action: (id: string, next: Role) => Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<Role>(current);
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    const prev = value;
    const r = next as Role;
    setValue(r);
    startTransition(async () => {
      try {
        await action(userId, r);
      } catch {
        setValue(prev);
      }
    });
  }

  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center rounded-full border border-surface-border bg-input/60 px-3 text-sm text-muted-foreground">
        {ROLE_LABELS[current]}
      </span>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-9 w-44 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ULTIMATE_ADMIN_ASSIGNABLE_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
