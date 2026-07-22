import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { canManagePhotos } from "@/lib/roles";
import { getDb } from "@/lib/db";
import {
  isCloudinaryConfigured,
  uploadPhotoBuffer,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, Vercel serverless body cap is 4.5 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const metadataSchema = z.object({
  alt: z.string().min(2, "Alt text helps screen-readers and SEO").max(200),
  section: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Section must be lowercase letters / digits / dashes"),
  caption: z.string().max(200).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
});

/**
 * POST /api/admin/photos
 *
 * Multipart form with:
 *   file, image (jpeg/png/webp, ≤ 5 MB)
 *   alt, required alt text
 *   section, gallery section slug (e.g. "home")
 *   caption, optional caption
 *   sortOrder, optional integer, lower = earlier
 *
 * Role-gated to ultimate_admin + super_admin. Uploads to Cloudinary, then
 * persists a GalleryImage record.
 */
export async function POST(request: Request) {
  const session = await requireRole(["ultimate_admin", "super_admin"]);
  if (!canManagePhotos(session.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Cloudinary isn't configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      },
      { status: 503 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large, max ${Math.round(MAX_BYTES / 1024 / 1024)} MB` },
      { status: 413 }
    );
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Only JPEG, PNG, and WebP images are accepted" },
      { status: 415 }
    );
  }

  const parsed = metadataSchema.safeParse({
    alt: form.get("alt"),
    section: form.get("section"),
    caption: form.get("caption") ?? "",
    sortOrder: form.get("sortOrder") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }

  // Upload to Cloudinary, then persist the record.
  const buffer = Buffer.from(await file.arrayBuffer());
  let uploaded;
  try {
    uploaded = await uploadPhotoBuffer(buffer, parsed.data.section);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Cloudinary upload failed", err);
    return NextResponse.json(
      { ok: false, error: "Image host rejected the upload" },
      { status: 502 }
    );
  }

  const record = await db.galleryImage.create({
    data: {
      url: uploaded.url,
      publicId: uploaded.publicId,
      alt: parsed.data.alt,
      section: parsed.data.section,
      caption: parsed.data.caption || null,
      sortOrder: parsed.data.sortOrder ?? 0,
      uploadedById: session.userId,
    },
  });

  return NextResponse.json({ ok: true, photo: record });
}
