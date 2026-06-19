"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export interface PersonaCarouselItem {
  id: string;
  title: string;
  blurb: string;
  href: string;
  cta: string;
}

/**
 * Accessible horizontal carousel of persona cards. Uses native scroll-snap for
 * touch, with prev/next buttons (keyboard + pointer) and an aria-live status so
 * screen-reader users know how many situations are listed.
 */
export function PersonaCarousel({
  items,
  label,
}: {
  items: readonly PersonaCarouselItem[];
  label: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= maxScroll - 1);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const step = firstCard ? firstCard.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByCard(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollByCard(-1);
      }
    },
    [scrollByCard]
  );

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className="relative mt-4"
    >
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          disabled={atStart}
          aria-label="Previous situations"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-white text-foreground shadow-sm transition hover:bg-muted/50 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          disabled={atEnd}
          aria-label="Next situations"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-white text-foreground shadow-sm transition hover:bg-muted/50 disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <ul
        ref={trackRef}
        onKeyDown={onKeyDown}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}`}
            className="w-[min(100%,18rem)] shrink-0 snap-start"
          >
            <Link
              href={item.href}
              className="card-premium flex h-full flex-col p-5 transition hover:border-primary/30"
            >
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{item.blurb}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {item.cta}
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="sr-only" aria-live="polite">
        {items.length} filing situations available. Use the previous and next buttons or arrow keys to browse.
      </p>
    </div>
  );
}
