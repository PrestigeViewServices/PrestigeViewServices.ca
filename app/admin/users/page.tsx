import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  ROLE_LABELS,
  ULTIMATE_ADMIN_ASSIGNABLE_ROLES,
  isUltimateAdmin,
  parseRole,
  type Role,
} from "@/lib/roles";
import { NotConfigured } from "@/components/admin/not-configured";
import { RoleSelect } from "@/components/admin/role-select";

export const dynamic = "force-dynamic";

const PRISMA_ROLE: Record<
  Role,
  | "ULTIMATE_ADMIN"
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "EMPLOYEE"
  | "REP"
  | "CUSTOMER"
> = {
  ultimate_admin: "ULTIMATE_ADMIN",
  super_admin: "SUPER_ADMIN",
  admin: "ADMIN",
  manager: "MANAGER",
  employee: "EMPLOYEE",
  rep: "REP",
  customer: "CUSTOMER",
};

const FROM_PRISMA: Record<string, Role> = {
  ULTIMATE_ADMIN: "ultimate_admin",
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
  REP: "rep",
  CUSTOMER: "customer",
};

export default async function UsersPage() {
  // Page-level access: both admin tiers can VIEW.
  // Middleware already enforces ultimate_admin-only on /admin/users for WRITES;
  // we double-check here so admins land on a read-only view if they bypass.
  const session = await requireRole(["ultimate_admin", "admin"]);
  const canEdit = isUltimateAdmin(session.role);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Users sync from Clerk into Postgres via the webhook. Set DATABASE_URL to view them here."
        envVars={["DATABASE_URL", "CLERK_WEBHOOK_SECRET"]}
        missing={[
          ...missingDbEnvVars(),
          ...(process.env.CLERK_WEBHOOK_SECRET ? [] : ["CLERK_WEBHOOK_SECRET"]),
        ]}
      />
    );
  }
  const db = getDb()!;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-1.5 text-muted-foreground">
            {users.length} total ·{" "}
            {canEdit
              ? "you can change roles"
              : "read-only, ask an ultimate admin to change roles"}
          </p>
        </div>
      </header>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-input/40 text-muted-foreground">
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Signup</Th>
                <Th>Role</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No users yet. Sign in once to create the first record.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const role = FROM_PRISMA[u.role] ?? "customer";
                return (
                  <tr key={u.id}>
                    <Td>
                      <div className="font-medium">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                          ", "}
                      </div>
                    </Td>
                    <Td>
                      <span className="text-foreground/90 break-all">
                        {u.email}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-muted-foreground capitalize">
                        {u.signupMethod.toLowerCase()}
                      </span>
                    </Td>
                    <Td>
                      <RoleSelect
                        userId={u.id}
                        current={role}
                        action={updateUserRole}
                        disabled={!canEdit}
                      />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Ultimate admin can assign any role including ultimate_admin. Admins
        cannot promote users, assignable roles are{" "}
        {ULTIMATE_ADMIN_ASSIGNABLE_ROLES.filter((r) => r !== "ultimate_admin")
          .map((r) => ROLE_LABELS[r])
          .join(", ")}{" "}
        only.
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}

// --- server action ---------------------------------------------------------

async function updateUserRole(userId: string, next: Role) {
  "use server";
  // ultimate_admin only, and we re-check on the server in case anyone
  // calls this outside the UI.
  await requireRole("ultimate_admin");

  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const valid = parseRole(next);
  if (!valid) throw new Error("Invalid role");

  // Update the DB mirror.
  await db.user.update({
    where: { id: userId },
    data: { role: PRISMA_ROLE[valid] },
  });

  // Sync to Clerk so the next request reflects the new role in session claims.
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: valid },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Clerk role sync failed", err);
    // DB is the source of truth for next render; Clerk will catch up on
    // the next webhook or manual sync.
  }

  revalidatePath("/admin/users");
}
