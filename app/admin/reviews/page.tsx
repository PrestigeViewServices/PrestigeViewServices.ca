import { Download, MessageSquare, Mail, Star, ExternalLink } from "lucide-react";
import { requireRole, isClerkConfigured } from "@/lib/auth";
import { canReachAdmin } from "@/lib/roles";
import { siteConfig } from "@/lib/site";
import { generateReviewQrPng } from "@/lib/qrcode";
import { CopyButton } from "@/components/admin/copy-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

// TODO: wire to automated send (Twilio SMS / Resend email + Aurora hook)
// once we've decided which channel fits the workflow best. For Phase 1,
// templates are copy-only — AG sends them by hand from his phone or email
// client. That's deliberate: lets us iterate on copy without engineering.

const SMS_TEMPLATE = (url: string) =>
  `Hey {first name}, thanks for letting Prestige View Services take care of your property. If you've got 30 seconds, a quick Google review would mean the world: ${url}`;

const EMAIL_SUBJECT = "Loved your PVS service? A quick favour";
const EMAIL_TEMPLATE = (url: string) =>
  `Hi {first name},

Thanks again for choosing Prestige View Services. We hope everything looked great.

If you'd be willing, a short Google review helps your neighbours find us and means a lot to our crew:

${url}

It takes about 30 seconds, and we read every one.

Cheers,
The PVS team`;

export default async function ReviewsAdminPage() {
  if (!isClerkConfigured()) return null;
  const session = await requireRole(["ultimate_admin", "super_admin", "admin"]);
  if (!canReachAdmin(session.role)) return null;

  const url = siteConfig.googleReviewUrl;
  const qrDataUrl = await generateReviewQrPng(url);

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow text-primary">Reviews</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Collect Google reviews
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Everything points at one Google review URL —{" "}
          <code className="text-foreground/90 break-all">{url}</code>. Update
          it in <code>lib/site.ts</code> if Google ever regenerates the link.
        </p>
      </header>

      {/* QR card --------------------------------------------------------- */}
      <section className="surface-card p-6 sm:p-8">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR code linking to the PVS Google review form"
                width={260}
                height={260}
                className="block w-full h-auto"
              />
            </div>
            <a
              href={qrDataUrl}
              download="pvs-google-review-qr.png"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.5)] hover:brightness-110 transition-all w-full justify-center"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </a>
          </div>
          <div>
            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              Print-ready QR code
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              1024 × 1024 PNG. Big enough for door hangers, business cards,
              truck decals, and invoice corners — and it stays scannable
              even if part of it gets scuffed.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="text-foreground/90">
                Use it on the bottom of every printed invoice
              </li>
              <li className="text-foreground/90">
                Add it to the back of business cards
              </li>
              <li className="text-foreground/90">
                Hand out a door hanger after every property visit
              </li>
              <li className="text-foreground/90">
                Decal it on the truck so happy customers can scan on the spot
              </li>
            </ul>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-blue-300"
            >
              Preview the review page
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Templates ------------------------------------------------------- */}
      <section className="space-y-5">
        <header>
          <h2 className="text-xl font-bold tracking-tight">
            Send review requests
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy a template, replace <code>{"{first name}"}</code>, paste it
            into the customer's preferred channel. No auto-send in Phase 1 —
            it's intentional, so we can tune copy without a deploy.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <TemplateCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="SMS template"
            body={SMS_TEMPLATE(url)}
          />
          <TemplateCard
            icon={<Mail className="h-5 w-5" />}
            title="Email template"
            subject={EMAIL_SUBJECT}
            body={EMAIL_TEMPLATE(url)}
          />
        </div>
      </section>
    </div>
  );
}

function TemplateCard({
  icon,
  title,
  subject,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  subject?: string;
  body: string;
}) {
  return (
    <div className="surface-card p-6 flex flex-col">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {subject && (
        <div className="mt-4 rounded-xl border border-surface-border bg-input/40 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Subject
          </p>
          <p className="mt-1 text-sm font-medium">{subject}</p>
        </div>
      )}
      <pre className="mt-4 rounded-xl border border-surface-border bg-input/40 p-4 text-sm text-foreground/90 whitespace-pre-wrap font-sans flex-1">
        {body}
      </pre>
      <div className="mt-4 flex gap-2">
        {subject && (
          <CopyButton
            variant="outline"
            size="sm"
            text={subject}
            label="Copy subject"
            copiedLabel="Copied"
          />
        )}
        <CopyButton text={body} label="Copy message" copiedLabel="Copied" />
      </div>
    </div>
  );
}
