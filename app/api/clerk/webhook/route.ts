import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { isUltimateAdminEmail } from "@/lib/roles";

export const runtime = "nodejs";

/**
 * Clerk → Postgres user sync.
 *
 * Subscribe this endpoint in the Clerk dashboard:
 *   user.created, user.updated, user.deleted
 *
 * It mirrors the user into our `User` table and — on creation — sets
 * publicMetadata.role to "ultimate_admin" if the email is on the
 * ULTIMATE_ADMIN_EMAILS allowlist (env-only, never UI-assignable).
 * Default new-user role is "customer".
 *
 * Auth is via Svix signature (CLERK_WEBHOOK_SECRET). Reject anything that
 * fails verification.
 */

type ClerkEmail = { email_address: string; verification?: { status?: string } };
type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_numbers?: { phone_number: string }[];
  external_accounts?: { provider?: string }[];
  public_metadata?: { role?: string };
};

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "DB not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const hdrs = await headers();
  const svixId = hdrs.get("svix-id");
  const svixTimestamp = hdrs.get("svix-timestamp");
  const svixSignature = hdrs.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { ok: false, error: "Missing Svix headers" },
      { status: 400 }
    );
  }

  let evt: { type: string; data: ClerkUserData };
  try {
    evt = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: ClerkUserData };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Clerk webhook verification failed", err);
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated":
      await upsertUser(db, evt.data, evt.type === "user.created");
      break;
    case "user.deleted":
      if (evt.data.id) {
        await db.user.deleteMany({ where: { id: evt.data.id } });
      }
      break;
    default:
      // ignore unrelated events
      break;
  }

  return NextResponse.json({ ok: true });
}

async function upsertUser(
  db: NonNullable<ReturnType<typeof getDb>>,
  data: ClerkUserData,
  isNew: boolean
) {
  const primaryEmail =
    data.email_addresses?.find((e) => e.email_address && e.verification?.status === "verified")
      ?.email_address ?? data.email_addresses?.[0]?.email_address;

  if (!data.id || !primaryEmail) return;

  const phone = data.phone_numbers?.[0]?.phone_number ?? null;
  const provider = data.external_accounts?.[0]?.provider ?? null;
  const signupMethod = mapSignupMethod(provider, phone);

  // Determine role.
  // - If this is a new user and they're on the allowlist → ultimate_admin.
  // - Otherwise: preserve existing role if present; default new users to customer.
  let role:
    | "ULTIMATE_ADMIN"
    | "SUPER_ADMIN"
    | "ADMIN"
    | "EMPLOYEE"
    | "CUSTOMER" = "CUSTOMER";
  const existing = await db.user.findUnique({ where: { id: data.id } });
  if (existing) {
    role = existing.role;
  }
  if (isNew && isUltimateAdminEmail(primaryEmail)) {
    role = "ULTIMATE_ADMIN";
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(data.id, {
        publicMetadata: { role: "ultimate_admin" },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Clerk ultimate_admin assign failed", err);
    }
  }

  await db.user.upsert({
    where: { id: data.id },
    update: {
      email: primaryEmail,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      phone,
      role,
      signupMethod,
    },
    create: {
      id: data.id,
      email: primaryEmail,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      phone,
      role,
      signupMethod,
    },
  });
}

function mapSignupMethod(
  provider: string | null,
  phone: string | null
): "GOOGLE" | "APPLE" | "EMAIL" | "PHONE" | "OTHER" {
  if (provider === "oauth_google") return "GOOGLE";
  if (provider === "oauth_apple") return "APPLE";
  if (phone) return "PHONE";
  return "EMAIL";
}
