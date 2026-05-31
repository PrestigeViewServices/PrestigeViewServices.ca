import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { requireRole, isClerkConfigured } from "@/lib/auth";
import { canManagePhotos } from "@/lib/roles";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import {
  isCloudinaryConfigured,
  missingCloudinaryEnvVars,
} from "@/lib/cloudinary";
import { NotConfigured } from "@/components/admin/not-configured";
import { PhotoUploader } from "@/components/admin/photos/photo-uploader";
import { PhotoCard } from "@/components/admin/photos/photo-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site Photos",
  robots: { index: false, follow: false },
};

export default async function PhotosPage() {
  if (!isClerkConfigured()) return null;
  const session = await requireRole(["ultimate_admin", "super_admin"]);
  if (!canManagePhotos(session.role)) return null;

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Photo records live in Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }

  const db = getDb()!;
  const [active, hidden] = await Promise.all([
    db.galleryImage.findMany({
      where: { active: true },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    db.galleryImage.findMany({
      where: { active: false },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  const cloudinaryReady = isCloudinaryConfigured();

  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/admin/site"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Site Modifications
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Site Photos</h1>
        <p className="mt-1.5 text-muted-foreground">
          Add and remove gallery photos shown on the public site. Uploads go
          to Cloudinary; records live in Postgres so the change goes live
          immediately.
        </p>
      </header>

      {!cloudinaryReady && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-300 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-100/90">
            <p className="font-semibold">Cloudinary isn't configured yet</p>
            <p className="mt-1 text-yellow-200/80">
              Set the following env vars and restart the dev server:{" "}
              <code className="font-mono text-foreground/90">
                {missingCloudinaryEnvVars().join(", ")}
              </code>
              . Sign up at{" "}
              <a
                href="https://cloudinary.com"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                cloudinary.com
              </a>{" "}
              — the free tier is plenty for Phase 1.
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <PhotoUploader />

        <div className="space-y-5">
          <h2 className="text-lg font-semibold">
            Live photos{" "}
            <span className="text-muted-foreground font-normal">
              ({active.length})
            </span>
          </h2>
          {active.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted-foreground">
              No photos uploaded yet. The public site shows a placeholder
              tile until you add some.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((p) => (
                <PhotoCard
                  key={p.id}
                  photo={{
                    id: p.id,
                    url: p.url,
                    alt: p.alt,
                    section: p.section,
                    caption: p.caption,
                    active: p.active,
                    createdAt: p.createdAt.toISOString(),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {hidden.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">
            Recently hidden{" "}
            <span className="text-muted-foreground font-normal">
              ({hidden.length})
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hidden.map((p) => (
              <PhotoCard
                key={p.id}
                photo={{
                  id: p.id,
                  url: p.url,
                  alt: p.alt,
                  section: p.section,
                  caption: p.caption,
                  active: p.active,
                  createdAt: p.createdAt.toISOString(),
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
