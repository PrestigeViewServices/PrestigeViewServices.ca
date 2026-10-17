import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCrewSession } from "@/lib/crew-app";
import { recordNotification } from "@/lib/admin-notifications";
import { isCloudinaryConfigured, uploadCrewPhoto } from "@/lib/cloudinary";

export const runtime = "nodejs";

const KINDS = ["DAMAGE", "EQUIPMENT", "SAFETY", "CUSTOMER", "OTHER"] as const;
type Kind = (typeof KINDS)[number];
const MAX_BYTES = 4 * 1024 * 1024;

/** POST /api/crew/issues — multipart: kind, note, stopId?, photos[] */
export async function POST(req: Request) {
  const session = await getCrewSession();
  if (!session) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "db" }, { status: 503 });

  const form = await req.formData();
  const kind = String(form.get("kind") ?? "OTHER").toUpperCase() as Kind;
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  const stopId = String(form.get("stopId") ?? "") || null;
  if (!KINDS.includes(kind)) return NextResponse.json({ error: "Pick a type." }, { status: 400 });
  if (note.length < 3) return NextResponse.json({ error: "Write one line about what happened." }, { status: 400 });

  const files = form
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0 && f.size <= MAX_BYTES)
    .slice(0, 4);
  const urls: string[] = [];
  if (files.length && isCloudinaryConfigured()) {
    for (const f of files) {
      const up = await uploadCrewPhoto(Buffer.from(await f.arrayBuffer()), "issues");
      urls.push(up.url);
    }
  }

  const issue = await db.fieldIssue.create({
    data: {
      crewId: session.crewId,
      memberId: session.memberId,
      stopId,
      kind,
      note,
      photoUrls: urls,
    },
  });
  await recordNotification({
    kind: "field-issue",
    title: `${kind.charAt(0) + kind.slice(1).toLowerCase()} issue from ${session.crewName}`,
    body: `${session.memberName}: ${note}`,
    href: "/admin/game-plan/issues",
  });
  return NextResponse.json({ ok: true, id: issue.id });
}
