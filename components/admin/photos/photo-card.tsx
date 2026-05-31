"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Photo = {
  id: string;
  url: string;
  alt: string;
  section: string;
  caption: string | null;
  active: boolean;
  createdAt: string;
};

/** Tile + remove/restore controls. Calls the photo API directly. */
export function PhotoCard({ photo }: { photo: Photo }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const active = optimistic ?? photo.active;

  function softDelete() {
    if (!confirm("Hide this photo from the public site?")) return;
    start(async () => {
      const res = await fetch(`/api/admin/photos/${photo.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOptimistic(false);
        router.refresh();
      }
    });
  }

  function restore() {
    start(async () => {
      const res = await fetch(`/api/admin/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      if (res.ok) {
        setOptimistic(true);
        router.refresh();
      }
    });
  }

  return (
    <figure
      className={`surface-card overflow-hidden flex flex-col ${
        active ? "" : "opacity-60"
      }`}
    >
      <div className="relative aspect-[3/2] bg-input/40">
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover"
        />
        {!active && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <span className="rounded-full bg-surface px-3 py-1 text-xs uppercase tracking-wider">
              Hidden
            </span>
          </div>
        )}
      </div>
      <figcaption className="p-4 flex-1 flex flex-col gap-2 text-sm">
        <p className="font-medium text-foreground/90 line-clamp-2">
          {photo.alt}
        </p>
        {photo.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            “{photo.caption}”
          </p>
        )}
        <p className="mt-auto text-xs uppercase tracking-wider text-muted-foreground/80">
          Section: {photo.section}
        </p>
        <div className="pt-2">
          {active ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={softDelete}
              disabled={pending}
              className="w-full"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={restore}
              disabled={pending}
              className="w-full"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </Button>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
