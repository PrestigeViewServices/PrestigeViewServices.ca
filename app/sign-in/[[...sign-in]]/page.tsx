import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured, missingClerkEnvVars } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <section className="container-max py-16">
        <NotConfigured
          service="Clerk"
          reason="Sign-in is powered by Clerk. Open SETUP.md for click-by-click setup."
          envVars={["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"]}
          missing={missingClerkEnvVars()}
          docHref="https://clerk.com/docs/quickstarts/nextjs"
        />
      </section>
    );
  }
  return (
    <section className="container-max py-16 flex justify-center">
      <SignIn appearance={{ baseTheme: undefined }} />
    </section>
  );
}
