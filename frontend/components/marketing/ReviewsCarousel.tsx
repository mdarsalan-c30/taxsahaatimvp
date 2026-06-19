"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TESTIMONIALS, TESTIMONIAL_DISCLOSURE } from "@/lib/content/testimonials";
import { TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3",
            i < rating ? "fill-amber-400 text-amber-400" : "text-muted"
          )}
        />
      ))}
    </div>
  );
}

function CompactReviewCard({
  testimonial,
  active,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  active?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex h-36 w-72 shrink-0 snap-start flex-col rounded-lg border bg-card p-3 shadow-sm sm:w-72",
        active ? "border-primary/40 ring-1 ring-primary/20" : "border-border/80"
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={testimonial.name} />
        <div className="min-w-0 flex-1">
          <StarRow rating={testimonial.rating} />
          <p className="mt-1.5 line-clamp-3 text-sm leading-snug text-foreground">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
        </div>
      </div>
      <div className="mt-auto pt-2.5">
        <p className="truncate text-xs font-semibold">{testimonial.name}</p>
        <p className="truncate text-tier-feature">
          {testimonial.role}, {testimonial.city}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {testimonial.plan && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-tier-feature font-medium text-primary">
              {testimonial.plan}
            </span>
          )}
          {testimonial.outcomeTag && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-tier-feature font-medium text-emerald-700">
              {testimonial.outcomeTag}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ReviewsCarousel() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement | undefined;
    if (!card) return;
    // Scroll only the carousel's own horizontal track. Using scrollIntoView here
    // would scroll the whole page (the section sits below the fold), yanking the
    // viewport down on mount and on each auto-advance.
    const delta =
      card.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollBy({ left: delta, behavior: "smooth" });
  }, [index]);

  return (
    <section id="trust" className="section-compact-tight overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-tier-feature font-semibold uppercase tracking-widest text-primary">
              Reviews
            </p>
            <h2 className={`mt-0.5 font-heading font-bold tracking-tight ${TYPOGRAPHY_SCALE.headline}`}>
              What beta filers are saying
            </h2>
          </div>
          <p className="text-tier-feature sm:max-w-xs sm:text-right">
            {TESTIMONIAL_DISCLOSURE}
            <CheckCircle2 className="ml-1 inline size-3 text-primary" aria-hidden />
          </p>
        </div>

        <div
          ref={scrollRef}
          className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-5 [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((t, i) => (
            <CompactReviewCard key={t.id} testimonial={t} active={i === index} />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Show review ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 min-w-[8px] rounded-full transition-all",
                  i === index ? "w-5 bg-primary" : "w-2 bg-muted-foreground/25"
                )}
              />
            ))}
          </div>
          <Link href="/reviews" className={`font-semibold text-primary hover:underline ${TYPOGRAPHY_SCALE.caption}`}>
            Read all reviews →
          </Link>
        </div>
      </div>
    </section>
  );
}
