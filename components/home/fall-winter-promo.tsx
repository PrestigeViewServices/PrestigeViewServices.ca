import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SamImage } from "@/components/sam";

/**
 * The seasonal push on the home page: one card for fall work, one for the
 * snow pass, and Sam presenting the pair. Both route to the /fall-winter
 * hub or straight to the conversion page.
 */
export function FallWinterPromo() {
  return (
    <section className="container-max py-16">
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface/50 p-6 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4 lg:w-2/5">
            <SamImage
              pose="gutter"
              size={160}
              className="w-28 shrink-0 drop-shadow-xl sm:w-36"
            />
            <div>
              <p className="eyebrow text-amber-400">
                <Leaf className="h-3.5 w-3.5" />
                The season is now
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Fall cleanup now, snow pass for later
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Book both together and your property is handled until spring.
                One local crew, one call.
              </p>
              <Button asChild className="mt-4">
                <Link href="/fall-winter">
                  See fall &amp; winter services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <Link
              href="/services/fall-cleanup"
              className="group overflow-hidden rounded-2xl border border-surface-border"
            >
              <div className="relative aspect-[3/2]">
                <Image
                  src="/images/gallery/landscaping/trimmed-hedge-cleared-yard-ottawa-valley.webp"
                  alt="Ottawa Valley yard cleared and trimmed after a PVS fall cleanup"
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Leaf className="h-4 w-4 text-amber-300" />
                    Fall cleanups &amp; gutters
                  </p>
                  <p className="text-xs text-white/80">
                    Leaves, beds, gutters, final cut
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href="/winter-packages"
              className="group overflow-hidden rounded-2xl border border-surface-border"
            >
              <div className="relative aspect-[3/2]">
                <Image
                  src="/images/gallery/snow-removal/tractor-cleared-driveway-bluebird-day.webp"
                  alt="Driveway cleared edge to edge by a PVS tractor after a snowfall"
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Snowflake className="h-4 w-4 text-cyan-300" />
                    Seasonal snow passes
                  </p>
                  <p className="text-xs text-white/80">
                    Every storm, monthly payments
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
