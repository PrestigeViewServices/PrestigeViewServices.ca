import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { awardAuto, getCrewSession } from "@/lib/crew-app";
import { isCloudinaryConfigured, uploadCrewPhoto } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/crew/stops/:id/done — multipart:
 *   photos   one or more images (the "after" shot is required)
 *   note     optional crew note
 *   action   "done" (default) | "skip" | "reopen"
 *
 * Marks the stop, stores photos on Cloudinary, and auto-awards the
 * "stop_photo" rule to the member who tapped Done. Reopen clears the
 * status but keeps photos and points (admin removes points if needed).
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getCrewSession();
  if (!session) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "db" }, { status: 503 });
  const { id } = await ctx.params;

  const stop = await db.gamePlanStop.findUnique({
    where: { id },
    include: { plan: { select: { crewId: true, published: true } } },
  });
  if (!stop || stop.plan.crewId !== session.crewId || !stop.plan.published) {
    return NextResponse.json({ error: "Stop not found." }, { status: 404 });
  }

  const form = await req.formData();
  const action = String(form.get("action") ?? "done");
  const note = String(form.get("note") ?? "").slice(0, 500).trim() || null;

  if (action === "reopen") {
    await db.gamePlanStop.update({
      where: { id },
      data: { status: "PENDING", doneAt: null, doneById: null },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "skip") {
    if (!note) {
      return NextResponse.json(
        { error: "Say why you skipped it (gate locked, customer away...)." },
        { status: 400 }
      );
    }
    await db.gamePlanStop.update({
      where: { id },
      data: {
        status: "SKIPPED",
        doneAt: new Date(),
        doneById: session.memberId,
        crewNote: note,
      },
    });
    return NextResponse.json({ ok: true });
  }

  const files = form
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const alreadyHas = stop.photoUrls.length > 0;
  if (!files.length && !alreadyHas) {
    return NextResponse.json(
      { error: "Add at least one after photo to mark this stop done." },
      { status: 400 }
    );
  }
  if (files.length && !isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Photo storage isn't set up. Tell the office." },
      { status: 503 }
    );
  }
  for (const f of files) {
    if (!ALLOWED.includes(f.type)) {
      return NextResponse.json({ error: "Photos must be JPG, PNG or WebP." }, { status: 400 });
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json({ error: "One photo is too big. Try again." }, { status: 400 });
    }
  }

  const urls: string[] = [];
  for (const f of files.slice(0, 6)) {
    const buf = Buffer.from(await f.arrayBuffer());
    const up = await uploadCrewPhoto(buf, `stops/${stop.id}`);
    urls.push(up.url);
  }

  const firstCompletion = stop.status !== "DONE";
  await db.gamePlanStop.update({
    where: { id },
    data: {
      status: "DONE",
      doneAt: new Date(),
      doneById: session.memberId,
      photoUrls: { push: urls },
      crewNote: note ?? stop.crewNote,
    },
  });

  if (firstCompletion && (urls.length || alreadyHas)) {
    await awardAuto("stop_photo", session.memberId, {
      stopId: stop.id,
      note: stop.address,
    });
  }

  return NextResponse.json({ ok: true, photos: urls.length });
}
