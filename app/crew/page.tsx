import { getCrewSession, isCrewAuthConfigured } from "@/lib/crew-app";
import { isDbReady } from "@/lib/db";
import { CrewLogin } from "@/components/crew/crew-login";
import { CrewHome } from "@/components/crew/crew-home";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  if (!isDbReady() || !isCrewAuthConfigured()) {
    return (
      <div className="pt-16 text-center">
        <h1 className="text-xl font-bold">Crew app isn&apos;t set up yet</h1>
        <p className="mt-2 text-sm text-slate-400">
          The office needs to finish setup (database and admin password) before crews can sign in.
        </p>
      </div>
    );
  }
  const session = await getCrewSession();
  if (!session) return <CrewLogin />;
  return <CrewHome />;
}
