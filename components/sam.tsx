import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Sam, the PVS mascot (a beaver in full crew uniform), as a reusable
 * component system. Server-safe, no client JS.
 *
 * Poses map to the art in /public/images:
 *  - "hero"     mascot-sam.png          excited, hands to ears
 *  - "mower"    mascot-sam-mower.png    riding the zero-turn
 *  - "window"   mascot-sam-window.png   water-fed pole + hose
 *  - "gutter"   mascot-sam-gutter.png   toque + ladder + gutter scoop
 *  - "pressure" mascot-sam-pressure.png pressure wand mid-blast
 */

export type SamPose = "hero" | "mower" | "window" | "gutter" | "pressure";

const POSE_SRC: Record<SamPose, string> = {
  hero: "/images/mascot-sam.png",
  mower: "/images/mascot-sam-mower.png",
  window: "/images/mascot-sam-window.png",
  gutter: "/images/mascot-sam-gutter.png",
  pressure: "/images/mascot-sam-pressure.png",
};

export function SamImage({
  pose = "hero",
  size = 160,
  className,
  priority = false,
}: {
  pose?: SamPose;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={POSE_SRC[pose]}
      alt="Sam, the PVS mascot beaver in crew uniform"
      width={size}
      height={size}
      priority={priority}
      className={cn("select-none", className)}
    />
  );
}

/**
 * Speech-bubble tip from Sam. Drop anywhere content could use a wink of
 * personality: guides, planner, FAQ, seasonal pages.
 */
export function SamTip({
  pose = "hero",
  eyebrow = "Sam's Pro Tip",
  children,
  className,
}: {
  pose?: SamPose;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex items-end gap-2 sm:gap-4",
        className
      )}
    >
      <SamImage pose={pose} size={112} className="w-20 sm:w-28 shrink-0 drop-shadow-lg" />
      <div className="relative mb-3 flex-1 rounded-3xl rounded-bl-md border border-yellow-400/30 bg-yellow-400/10 p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-yellow-500">
          {eyebrow}
        </p>
        <div className="mt-1.5 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>
      </div>
    </aside>
  );
}
