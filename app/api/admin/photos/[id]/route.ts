import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { canManagePhotos } from "@/lib/roles";
import { getDb } from "@/lib/db";
import { deletePhotoByPublicId } from "@/lib/cloudinary";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/photos/[id]
 *   Soft-delete by default: sets active=false. The Cloudinary asset is kept
 *   so we can restore. Pass ?purge=1 to hard-delete from Cloudinary + DB
 *   (still ultimate_admin/super_admin only).
 *
 * PATCH /api/admin/photos/[id]
 *   JSON body { active: true } restores a soft-deleted photo.
 *   JSON body { sortOrder: number } reorders the photo.
 */

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireRole(["ultimate_admin", "super_admin"]);
  if (!canManagePhotos(session.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const purge = url.searchParams.get("purge") === "1";

  const photo = await db.galleryImage.findUnique({ where: { id: params.id } });
  if (!photo) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  if (purge) {
    if (photo.publicId) await deletePhotoByPublicId(photo.publicId);
    await db.galleryImage.delete({ where: { id: photo.id } });
  } else {
    await db.galleryImage.update({
      where: { id: photo.id },
      data: { active: false },
    });
  }

  return NextResponse.json({ ok: true, purged: purge });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireRole(["ultimate_admin", "super_admin"]);
  if (!canManagePhotos(session.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  let body: { active?: unknown; sortOrder?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const data: { active?: boolean; sortOrder?: number } = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder)) {
    data.sortOrder = body.sortOrder;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Nothing to update" },
      { status: 400 }
    );
  }

  try {
    const updated = await db.galleryImage.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ ok: true, photo: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}
