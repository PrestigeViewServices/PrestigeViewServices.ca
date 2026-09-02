import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Leaf, Snowflake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SamImage, SamTip, type SamPose } from "@/components/sam";

export const metadata: Metadata = {
  title: "Meet Sam, the Prestige View Services Mascot",
  description:
    "Sam is the hardest-working beaver in the Ottawa Valley: mowing, window cleaning, gutters, pressure washing, and snow. Meet the face of Prestige View Services.",
  alternates: { canonical: "/meet-sam" },
};

/**
 * Brand page for Sam. Light on sell, heavy on personality — its job is to
 * make PVS memorable and shareable, and to route visitors to the service
 * that matches each pose.
 */

const poses: {
  pose: SamPose;
  title: string;
  caption: string;
  href: string;
  cta: string;
}[] = [
  {
    pose: "mower",
    title: "Mowing season Sam",
    caption:
      "On the stand-on mower laying stripes across Petawawa. Sam believes a lawn should look like a ballpark.",
    href: "/services/lawn-mowing",
    cta: "Lawn mowing",
  },
  {
    pose: "window",
    title: "Streak-free Sam",
    caption:
      "Water-fed pole in paw. If Sam can see his reflection, the job is done. If he can't, he starts over.",
    href: "/services/window-cleaning",
    cta: "Window cleaning",
  },
  {
    pose: "gutter",
    title: "Gutter patrol Sam",
    caption:
      "Toque on, ladder up. Sam clears the leaves and muck before they turn into January ice dams.",
    href: "/services/gutter-cleaning",
    cta: "Gutter cleaning",
  },
  {
    pose: "pressure",
    title: "Full-blast Sam",
    caption:
      "Driveways, decks, and siding. Sam's pressure wand has one setting he really likes and it shows.",
    href: "/services/pressure-washing",
    cta: "Pressure washing",
  },
];

export default function MeetSamPage() {
  return (
    <>
      <section className="container-max pb-4 pt-14 text-center sm:pt-20">
        <SamImage
          pose="hero"
          size={220}
          priority
          className="mx-auto drop-shadow-2xl"
        />
        <p className="eyebrow mt-6 justify-center text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          The face of PVS
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Meet Sam
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Sam is a beaver, which makes him the most qualified property care
          professional in the Ottawa Valley: born to work outside, obsessed
          with a tidy site, and completely unbothered by cold water. He shows
          up on our trucks, our flyers, and every corner of this website.
        </p>
      </section>

      <section className="container-max py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {poses.map((p) => (
            <div
              key={p.pose}
              className="surface-card flex items-center gap-5 p-6"
            >
              <SamImage
                pose={p.pose}
                size={140}
                className="w-28 shrink-0 drop-shadow-lg sm:w-36"
              />
              <div>
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {p.caption}
                </p>
                <Link
                  href={p.href}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {p.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-max py-8">
        <SamTip pose="hero" eyebrow="Sam's #1 rule">
          The best time to book fall cleanup was last week. The second-best
          time is right now, before the routes fill up and the snow starts
          flying.
        </SamTip>
      </section>

      <section className="container-max py-14 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Put Sam&apos;s crew on your property
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          The humans do the actual work, and they are very good at it. Free
          quotes in one business day.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/fall-winter">
              <Leaf className="h-4 w-4" />
              Fall &amp; winter services
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/winter-packages">
              <Snowflake className="h-4 w-4" />
              Snow passes
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
