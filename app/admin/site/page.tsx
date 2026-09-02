import Link from "next/link";
import {
  Image as ImageIcon,
  FileEdit,
  SlidersHorizontal,
  ArrowRight,
  MessageSquareQuote,
} from "lucide-react";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Site Modifications hub — everything the owner can change on the public
 * site without touching code: page content, photos, reviews assets, and the
 * Prestige Club numbers that drive the site-wide offers.
 */
export default async function SiteModificationsPage() {
  await requireRole(["ultimate_admin", "super_admin", "admin"]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Site Modifications</h1>
        <p className="mt-1.5 max-w-2xl text-muted-foreground">
          Change what the public site shows (copy, offers, photos) and it
          goes live immediately. Every editable section has a reset back to
          the original, so nothing can be broken for good.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <Tile
          href="/admin/site/content"
          icon={<FileEdit className="h-5 w-5" />}
          title="Page content"
          body="Homepage hero headline, the season banner strip, and the seasonal offer cards + promo popup. Edit and publish in one click."
        />
        <Tile
          href="/admin/site/photos"
          icon={<ImageIcon className="h-5 w-5" />}
          title="Photos"
          body="Upload and remove photos in the home page gallery. Updates appear on the live site immediately."
        />
        <Tile
          href="/admin/club/settings"
          icon={<SlidersHorizontal className="h-5 w-5" />}
          title="Offers & program numbers"
          body="The 5% account discount, referral rewards, and every Prestige Club point value. These drive the banners across the site."
        />
        <Tile
          href="/admin/reviews"
          icon={<MessageSquareQuote className="h-5 w-5" />}
          title="Review tools"
          body="The Google review link and printable QR code for trucks, door hangers, and invoices."
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Service pages and city pages are SEO-tuned and ship from code, ask
        for changes there and they go out with the next deploy.
      </p>
    </div>
  );
}

function Tile({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="surface-card surface-card-hover block p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          Live
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        Open
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
