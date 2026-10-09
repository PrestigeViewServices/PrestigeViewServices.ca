import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Real job photo that sits beside an Aurora quote form. The form is tall,
 * so pages pair it with a photo and short supporting copy in the side
 * column; this keeps that column visually weighted instead of empty.
 */
export function QuotePhoto({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "relative aspect-[4/3] overflow-hidden rounded-3xl border border-surface-border",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover"
      />
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-4 pt-10 text-sm font-medium text-white">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
