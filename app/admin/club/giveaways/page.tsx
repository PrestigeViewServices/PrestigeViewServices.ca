import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Dice5, PartyPopper, Plus, Trophy } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  generateSkillQuestion,
  runDraw,
  winnerDisplay,
} from "@/lib/giveaways";
import { sendClubEmail } from "@/lib/send-club-email";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin"] as const;

const inputCls =
  "h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-500/15 text-slate-200 border-slate-500/25",
  OPEN: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  CLOSED: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  DRAWN: "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

/**
 * Giveaway management: create → open → close → draw → record skill test.
 * The draw snapshots every entry as a row before crypto-random selection,
 * so the pool is auditable after the fact.
 *
 * ⚠️ LEGAL: have /giveaway-rules reviewed before the FIRST public draw.
 */
export default async function GiveawayAdminPage() {
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return null;

  const giveaways = await db.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { entries: true } } },
  });

  const withWinners = await Promise.all(
    giveaways.map(async (g) => ({
      ...g,
      winnerLabel:
        g.winnerEntryId != null
          ? await winnerDisplay(db, g.winnerEntryId)
          : null,
      winnerEntry:
        g.winnerEntryId != null
          ? await db.giveawayEntry.findUnique({
              where: { id: g.winnerEntryId },
              include: { member: true },
            })
          : null,
    }))
  );

  const skill = generateSkillQuestion();

  return (
    <div className="space-y-8">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Club home
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Giveaways</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Quarterly draws. Members enter automatically by tier (+1 per
          referral that quarter); the public no-purchase form feeds the same
          pool. Have the{" "}
          <Link href="/giveaway-rules" className="text-primary hover:underline">
            official rules
          </Link>{" "}
          reviewed by a lawyer before the first draw.
        </p>
      </header>

      {/* ---- Create ---- */}
      <form action={createGiveaway} className="surface-card p-5">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">New giveaway</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="gw-title">
              Title
            </label>
            <input id="gw-title" name="title" required maxLength={100} placeholder="Fall Gutter Cleaning Giveaway" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="gw-prize">
              Prize
            </label>
            <input id="gw-prize" name="prize" required maxLength={140} placeholder="Free fall gutter cleaning (up to $250 value)" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="gw-opens">
              Entries open
            </label>
            <input id="gw-opens" name="opensAt" type="date" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="gw-closes">
              Entries close
            </label>
            <input id="gw-closes" name="closesAt" type="date" required className={inputCls} />
          </div>
        </div>
        <Button type="submit" size="sm" className="mt-4">
          Create draft
        </Button>
      </form>

      {/* ---- List ---- */}
      <div className="space-y-4">
        {withWinners.length === 0 && (
          <p className="surface-card p-6 text-sm text-muted-foreground">
            No giveaways yet, create the first draft above.
          </p>
        )}
        {withWinners.map((g) => (
          <section key={g.id} className="surface-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{g.title}</h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[g.status]}`}>
                    {g.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {g.prize} ·{" "}
                  {g.opensAt ? g.opensAt.toLocaleDateString("en-CA") : "?"} →{" "}
                  {g.closesAt ? g.closesAt.toLocaleDateString("en-CA") : "?"} ·{" "}
                  {g._count.entries} stored entr
                  {g._count.entries === 1 ? "y" : "ies"}
                  {g.status !== "DRAWN" && " (member entries snapshot at draw time)"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.status === "DRAFT" && (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="status" value="OPEN" />
                    <Button type="submit" size="sm">
                      Open entries
                    </Button>
                  </form>
                )}
                {g.status === "OPEN" && (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="status" value="CLOSED" />
                    <Button type="submit" size="sm" variant="outline">
                      Close entries
                    </Button>
                  </form>
                )}
                {g.status === "CLOSED" && (
                  <form action={drawWinner}>
                    <input type="hidden" name="id" value={g.id} />
                    <Button type="submit" size="sm">
                      <Dice5 className="h-4 w-4" />
                      Run the draw
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {g.status === "DRAWN" && (
              <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Trophy className="h-4 w-4 text-emerald-300" />
                  Selected: {g.winnerLabel ?? "entry " + g.winnerEntryId}
                  {g.winnerEntry?.member?.email && (
                    <span className="font-normal text-muted-foreground">
                      · {g.winnerEntry.member.email}
                    </span>
                  )}
                  {g.winnerEntry?.entrantEmail && (
                    <span className="font-normal text-muted-foreground">
                      · {g.winnerEntry.entrantEmail} (free entry)
                    </span>
                  )}
                </p>
                {g.skillTestResult ? (
                  <p className="mt-2 text-xs text-emerald-200">
                    Skill test recorded: {g.skillTestResult} — winner
                    confirmed.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Before confirming, ask the skill-testing question
                      (suggested:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {skill.question}
                      </span>{" "}
                      answer {skill.answer}) and record the result:
                    </p>
                    <form action={recordSkillTest} className="mt-2 flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={g.id} />
                      <input
                        name="result"
                        required
                        maxLength={200}
                        placeholder='e.g. "(6×7)+12−3 answered 51, correct"'
                        className={`${inputCls} max-w-md flex-1`}
                      />
                      <Button type="submit" size="sm" variant="outline">
                        <PartyPopper className="h-4 w-4" />
                        Confirm winner
                      </Button>
                    </form>
                  </>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

async function createGiveaway(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  const prize = String(formData.get("prize") ?? "").trim().slice(0, 140);
  const opensAt = new Date(String(formData.get("opensAt") ?? ""));
  const closesAt = new Date(String(formData.get("closesAt") ?? ""));
  if (!title || !prize || isNaN(opensAt.getTime()) || isNaN(closesAt.getTime())) {
    throw new Error("All fields required");
  }
  await db.giveaway.create({
    data: { title, prize, opensAt, closesAt, status: "DRAFT" },
  });
  revalidatePath("/admin/club/giveaways");
}

async function setStatus(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["OPEN", "CLOSED"].includes(status)) return;
  await db.giveaway.update({
    where: { id },
    data: { status: status as "OPEN" | "CLOSED" },
  });
  revalidatePath("/admin/club/giveaways");
  revalidatePath("/account/giveaways");
  revalidatePath("/giveaway-entry");
}

async function drawWinner(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const result = await runDraw(db, id);
  if (result.ok && result.winnerEntryId) {
    // Heads-up to the office so the winner gets contacted for the skill test.
    const giveaway = await db.giveaway.findUnique({ where: { id } });
    const label = await winnerDisplay(db, result.winnerEntryId);
    await sendClubEmail({
      to: process.env.CLUB_NOTIFY_EMAIL || siteConfig.email,
      subject: `Giveaway drawn: ${giveaway?.title} — ${label}`,
      text: [
        `The draw for "${giveaway?.title}" selected: ${label}`,
        `Total entries: ${result.totalEntries}`,
        ``,
        `Next: contact the entrant, ask the skill-testing question, and record the result in the admin panel to confirm the win.`,
        `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/admin/club/giveaways`,
      ].join("\n"),
    });
  }
  revalidatePath("/admin/club/giveaways");
  revalidatePath("/account/giveaways");
}

async function recordSkillTest(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const id = String(formData.get("id") ?? "");
  const result = String(formData.get("result") ?? "").trim().slice(0, 200);
  if (!id || !result) return;
  await db.giveaway.update({
    where: { id },
    data: { skillTestResult: result },
  });
  revalidatePath("/admin/club/giveaways");
  revalidatePath("/account/giveaways");
}
