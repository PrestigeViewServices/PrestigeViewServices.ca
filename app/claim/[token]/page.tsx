import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getDb } from "@/lib/db";
import { CLUB_NAME } from "@/lib/loyalty";
import { ClaimForm } from "@/components/account/claim-form";

export const dynamic = "force-dynamic";

type Params = { token: string };

/**
 * Invite-claim page for pre-provisioned (Jobber-imported) accounts:
 * /claim/<inviteToken>. Lives OUTSIDE the gated /account tree so
 * signed-out customers can reach it; the customer sets a password and
 * lands in their portal with history + points already attached.
 */
export default async function ClaimPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const db = getDb();
  if (!db) notFound();

  const member = await db.member.findUnique({
    where: { inviteToken: params.token },
    select: { id: true, firstName: true, email: true, passwordHash: true },
  });
  if (!member || member.passwordHash !== "") notFound();

  return (
    <section className="container-max flex min-h-[70vh] flex-col items-center justify-center py-12">
      <div className="mb-8 max-w-md text-center">
        <p className="eyebrow justify-center text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {CLUB_NAME}
        </p>
        <h1 className="heading-section mt-2">
          Welcome, {member.firstName}!
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your PVS account is ready, service history, points, and perks are
          already waiting. Set a password to claim it.
        </p>
      </div>
      <ClaimForm token={params.token} email={member.email} />
    </section>
  );
}
