"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  Download,
  Mail,
  MessageCircle,
  QrCode,
  Send,
  Share2,
} from "lucide-react";

/**
 * The member's whole sharing toolkit in one card: the link, the code, the
 * one-tap share targets, and a printable QR.
 *
 * Mobile-first on purpose — most members open the portal on a phone from a
 * Facebook or Instagram link, and share from there. `navigator.share` gets
 * them into their own contacts app in one tap; everything else is a
 * deep link with a desktop fallback.
 */
export function ReferralShare({
  url,
  code,
  message,
  qrDataUrl,
}: {
  url: string;
  code: string;
  message: string;
  qrDataUrl: string | null;
}) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [showQr, setShowQr] = useState(false);

  async function copy(what: "link" | "code") {
    const text = what === "link" ? `${message} ${url}` : code;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked — the link is on screen to select by hand.
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Prestige View Services",
          text: message,
          url,
        });
        return;
      } catch {
        // Cancelled or unsupported — fall through to copy.
      }
    }
    copy("link");
  }

  const encoded = encodeURIComponent(`${message} ${url}`);
  const canNativeShare =
    typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <div className="space-y-4">
      {/* ---- The link ---- */}
      <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Your referral link
        </p>
        <p className="mt-1 break-all font-mono text-sm">{url}</p>
      </div>

      {/* ---- The code, for people who'd rather say it out loud ---- */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border bg-surface/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Or just give them your code
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold tracking-wider">
            {code}
          </p>
        </div>
        <button
          type="button"
          onClick={() => copy("code")}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
        >
          {copied === "code" ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-300" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy code
            </>
          )}
        </button>
      </div>

      {/* ---- Share targets ---- */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02]"
        >
          {canNativeShare ? (
            <>
              <Share2 className="h-4 w-4" />
              Share
            </>
          ) : copied === "link" ? (
            <>
              <Check className="h-4 w-4" />
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
          Text
        </a>

        <a
          href={`mailto:?subject=${encodeURIComponent(
            "You should try Prestige View Services"
          )}&body=${encoded}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
        >
          <Mail className="h-4 w-4" />
          Email
        </a>

        <a
          href={`fb-messenger://share?link=${encodeURIComponent(url)}`}
          onClick={(e) => {
            // Messenger's deep link is mobile-only.
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

        {qrDataUrl && (
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            aria-expanded={showQr}
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
          >
            <QrCode className="h-4 w-4" />
            {showQr ? "Hide QR" : "QR code"}
          </button>
        )}
      </div>

      {/* ---- Printable QR, for door hangers and the back of a truck ---- */}
      {qrDataUrl && showQr && (
        <div className="flex flex-wrap items-center gap-5 rounded-xl border border-surface-border bg-surface/60 p-5">
          <Image
            src={qrDataUrl}
            alt={`QR code linking to ${url}`}
            width={160}
            height={160}
            unoptimized
            className="h-40 w-40 rounded-lg bg-white p-2"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Share it in person</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Anyone who scans this lands on your link. Handy at the rink, the
              office, or stuck on the fridge for the neighbours.
            </p>
            <a
              href={qrDataUrl}
              download={`pvs-referral-${code}.png`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
