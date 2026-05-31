import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLogin } from "./admin-login";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const COOKIE = "pvs_admin";

export default function AdminPage() {
  const authed = cookies().get(COOKIE)?.value === "ok";

  if (!authed) {
    return (
      <section className="container-max py-20 max-w-md">
        <h1 className="heading-section text-center">Admin</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {/* TODO: replace with real auth (NextAuth, Clerk, etc.) before launch. */}
          v1 — single shared password gate.
        </p>
        <div className="mt-8">
          <AdminLogin />
        </div>
      </section>
    );
  }

  return (
    <section className="container-max py-16">
      <h1 className="heading-section">Admin Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder. Replace with a real dashboard (quotes, customers, schedule).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="surface-card p-6">
          <h2 className="font-semibold">Quote requests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Currently logged to the server console. Wire to a database once email is live.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="font-semibold">Content</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Edit services, offers, and reviews in{" "}
            <code className="text-foreground/90">/lib/content/</code>.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="font-semibold">Site settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Phone, email, and site URL live in <code>/lib/site.ts</code> + env vars.
          </p>
        </div>
      </div>

      <form action={signOut} className="mt-10">
        <Button type="submit" variant="outline" asChild={false}>
          Sign out
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground">
        <Link href="/" className="underline">
          Back to site
        </Link>
      </p>
    </section>
  );
}

async function signOut() {
  "use server";
  cookies().delete(COOKIE);
  redirect("/admin");
}
