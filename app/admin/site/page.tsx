import Link from "next/link";
import {
  Image as ImageIcon,
  FileEdit,
  Settings,
  ArrowRight,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { requireRole, isClerkConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

// =============================================================================
// Site Modifications hub
// =============================================================================
// Photos is live (PHASE 1). Page/content editing (CMS) remains Phase 2.
//
// TODO: integrate a headless CMS (Sanity or Payload) for page/content editing
//       in a later phase. Do NOT build a live page editor here.
// =============================================================================

export default async function SiteModificationsPage() {
  if (!isClerkConfigured()) return null;
  // Top-level Site Modifications is ultimate_admin only. Photos has its own
  // subroute gated to super_admin + ultimate_admin.
  await requireRole("ultimate_admin");

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <p className="eyebrow text-primary mb-0">Ultimate Admin</p>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Site Modifications
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Manage what the public site shows. Photos are live now; copy and
          marketing config still ship from <code className="text-foreground/90">/lib/content</code>{" "}
          until a headless CMS lands.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <Tile
          href="/admin/site/photos"
          icon={<ImageIcon className="h-5 w-5" />}
          title="Photos"
          body="Upload + remove photos in the home page gallery. Updates appear on the live site immediately."
          status="live"
        />
        <Tile
          icon={<FileEdit className="h-5 w-5" />}
          title="Page content"
          body="Edit hero copy, division pitches, service descriptions, review highlights."
          status="phase-2"
        />
        <Tile
          icon={<Settings className="h-5 w-5" />}
          title="Marketing config"
          body="Toggle offers and promo modals, schedule seasonal content, manage media assets."
          status="phase-2"
        />
      </div>

      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-300 mt-0.5 shrink-0" />
        <div className="text-sm text-yellow-100/90">
          <p className="font-semibold">CMS is Phase 2</p>
          <p className="mt-1 text-yellow-200/80">
            Live page editing requires drafts, preview, and version history.
            Until that's wired (Sanity or Payload), copy edits still happen
            in <code className="text-foreground/90">/lib/content/*.ts</code> via git.
          </p>
        </div>
      </div>
    </div>
  );
}

function Tile({
  href,
  icon,
  title,
  body,
  status,
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  status: "live" | "phase-2";
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
        <span
          className={
            status === "live"
              ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
              : "rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-200"
          }
        >
          {status === "live" ? "Live" : "Phase 2"}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
      {href && (
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          Open {title.toLowerCase()}
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="surface-card surface-card-hover p-6 block">
        {inner}
      </Link>
    );
  }
  return <div className="surface-card p-6 opacity-90">{inner}</div>;
}
