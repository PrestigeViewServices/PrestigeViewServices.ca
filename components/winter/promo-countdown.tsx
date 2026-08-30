"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to a promo deadline. Renders nothing once the clock runs
 * out. SSR renders the server-computed remainder so there is no empty flash;
 * the client then ticks it forward once a minute (seconds only inside the
 * final hour, where they start to matter).
 */
export function PromoCountdown({
  endsAt,
  className = "",
}: {
  endsAt: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  const end = new Date(endsAt).getTime();
  const msLeft = Number.isNaN(end) ? 0 : end - now;

  useEffect(() => {
    if (msLeft <= 0) return;
    const interval = msLeft < 60 * 60 * 1000 ? 1000 : 60 * 1000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [msLeft]);

  if (msLeft <= 0) return null;

  const days = Math.floor(msLeft / 86_400_000);
  const hours = Math.floor((msLeft % 86_400_000) / 3_600_000);
  const mins = Math.floor((msLeft % 3_600_000) / 60_000);
  const secs = Math.floor((msLeft % 60_000) / 1000);

  const parts =
    days > 0
      ? [`${days}d`, `${hours}h`, `${mins}m`]
      : hours > 0
        ? [`${hours}h`, `${mins}m`]
        : [`${mins}m`, `${secs}s`];

  return (
    <span className={`tabular-nums ${className}`}>
      Ends in {parts.join(" ")}
    </span>
  );
}
