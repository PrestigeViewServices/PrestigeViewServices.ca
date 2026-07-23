"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Send } from "lucide-react";

/**
 * Share row for the referral link: copy, SMS, Messenger. Mobile-first —
 * sms: and fb-messenger: deep links work on phones, which is where most
 * members will share from.
 */
export function ShareButtons({
  url,
  message,
}: {
  url: string;
  message: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${message} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — select-and-copy fallback is the visible input.
    }
  }

  const encoded = encodeURIComponent(`${message} ${url}`);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-300" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy link
          </>
        )}
      </button>
      <a
        href={`sms:?&body=${encoded}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
      >
        <MessageCircle className="h-4 w-4" />
        Text a friend
      </a>
      <a
        href={`fb-messenger://share?link=${encodeURIComponent(url)}`}
        onClick={(e) => {
          // Desktop fallback: Messenger deep link only works on mobile.
          if (!/android|iphone|ipad/i.test(navigator.userAgent)) {
            e.preventDefault();
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
              "_blank",
              "noopener"
            );
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
      >
        <Send className="h-4 w-4" />
        Messenger
      </a>
    </div>
  );
}
