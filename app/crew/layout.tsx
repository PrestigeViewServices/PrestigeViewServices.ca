import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "PVS Game Plan",
  description: "Prestige View Services crew app",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "PVS Game Plan",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#090D18",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Crew app shell. Phone-first, one column, no marketing chrome (hidden by
 * components/site-chrome.tsx). Crews add it to their home screen; the
 * apple-web-app meta makes it open full-screen like an installed app.
 */
export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#090D18] text-slate-100"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto w-full max-w-[560px] px-4 pb-16">{children}</div>
    </div>
  );
}
