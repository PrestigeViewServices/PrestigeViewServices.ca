"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/content/faq";

export type FaqGroup = {
  title: string;
  items: FaqItem[];
};

export function FaqExplorer({ groups }: { groups: FaqGroup[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  const total = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try "gutters", "snow", "how do I pay"...'
          aria-label="Search frequently asked questions"
          className="h-12 w-full rounded-full border border-surface-border bg-surface/50 pl-11 pr-5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {query.trim()
          ? `${total} answer${total === 1 ? "" : "s"} match "${query.trim()}"`
          : `${total} answers, straight from the crew`}
      </p>

      {filtered.length === 0 && (
        <div className="surface-card mt-8 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing matches that yet. Call us at {""}
            <a
              href="tel:+16133345858"
              className="font-medium text-primary hover:underline"
            >
              (613) 334-5858
            </a>{" "}
            and a human will answer it instead.
          </p>
        </div>
      )}

      {filtered.map((g) => (
        <section key={g.title} className="mt-10">
          <h2 className="text-lg font-semibold">{g.title}</h2>
          <Accordion type="single" collapsible className="mt-2 w-full">
            {g.items.map((it, i) => (
              <AccordionItem key={`${g.title}-${i}`} value={`${g.title}-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {it.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {it.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
}
