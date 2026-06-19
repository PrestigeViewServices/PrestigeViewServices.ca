"use client";

import Image from "next/image";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

/**
 * Scroll-reveal showcase — a 3D card that rotates flat and scales up as the
 * visitor scrolls, revealing a real PVS job photo. Uses the
 * <ContainerScroll /> primitive in components/ui.
 *
 * Swap `src` for any photo in /public/images/gallery to feature different work.
 * Use a landscape image (the card is wide) for the best framing.
 */
export function ScrollRevealShowcase() {
  return (
    <ContainerScroll
      titleComponent={
        <>
          <p className="eyebrow text-primary mb-3 justify-center">
            See the difference
          </p>
          <h2 className="heading-section text-balance">
            Work we&apos;re proud to{" "}
            <span className="text-gradient">put our name on</span>
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-base sm:text-lg text-muted-foreground text-balance">
            Real homes across Petawawa, Pembroke &amp; the Ottawa Valley —
            cleaned, cleared, and cared for by the PVS crew.
          </p>
        </>
      }
    >
      <Image
        src="/images/gallery/window-cleaning/modern-dark-frame-01.jpg"
        alt="Modern Ottawa Valley home with dark-framed windows cleaned streak-free by Prestige View Services"
        width={1600}
        height={1200}
        sizes="(min-width: 1024px) 64rem, 100vw"
        className="mx-auto h-full w-full rounded-2xl object-cover object-center"
        draggable={false}
      />
    </ContainerScroll>
  );
}
