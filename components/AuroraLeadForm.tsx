"use client";

import { useEffect, useRef } from "react";

const AURORA_ORIGIN = "https://aurorasuite.ca";
const AURORA_SRC = `${AURORA_ORIGIN}/lead-form/114?signature=c4498657b1ef01bfdc9b5533b8570c45125c92fd8273b7d0ec1cc3555cbbb835`;

/**
 * Aurora Suite lead form, the single source of truth for lead capture
 * across the entire site. The iframe self-reports its rendered height via
 * window.postMessage; we resize on each message so the iframe is never
 * internally scrollable.
 *
 * The wrapper exposes id="quote-form" so any in-page CTA can deep-link to it
 * with href="#quote-form" and the browser will scroll into view.
 *
 * Notes:
 * - Aurora's URL is HMAC-signed. Do NOT append extra query params.
 * - The original public snippet listened to messages from any origin. We
 *   restrict to https://aurorasuite.ca so a malicious iframe elsewhere on
 *   the page can't spoof AS_FORM_HEIGHT and resize this iframe.
 */
export function AuroraLeadForm({ id = "quote-form" }: { id?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== AURORA_ORIGIN) return;
      const data = event.data;
      if (!data || data.type !== "AS_FORM_HEIGHT") return;
      if (typeof data.height !== "number") return;
      const iframe = iframeRef.current;
      if (!iframe) return;
      iframe.style.height = `${Math.max(500, data.height)}px`;
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div
      id={id}
      className="relative mx-auto w-full max-w-[750px] min-h-[500px] scroll-mt-24"
    >
      <iframe
        ref={iframeRef}
        src={AURORA_SRC}
        title="Request a Quote, Prestige View Services"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="clipboard-write; autoplay; encrypted-media"
        className="block w-full border-0 bg-transparent rounded-xl max-md:rounded-[10px] max-md:px-4 transition-[height] duration-300 ease-in-out"
        style={{ height: 600 }}
      />
    </div>
  );
}
