"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TESTIMONIALS, TESTIMONIAL_DISCLOSURE } from "@/lib/content/testimonials";
import { SECTION_PADDING, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
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
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
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
            "size-4",
            i < rating ? "fill-amber-400 text-amber-400" : "text-muted"
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  testimonial,
  active,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  active?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex min-h-[260px] w-[min(100%,calc(100vw-2.5rem))] shrink-0 snap-start flex-col rounded-2xl border bg-card p-5 shadow-sm sm:w-[min(100%,340px)]",
        active ? "border-primary/40 ring-2 ring-primary/15" : "border-border/80"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Avatar name={testimonial.name} />
        <StarRow rating={testimonial.rating} />
      </div>

      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      <footer className="mt-5 border-t border-border/60 pt-4">
        <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {testimonial.role}, {testimonial.city}
        </p>
        {(testimonial.plan || testimonial.outcomeTag) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {testimonial.plan && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {testimonial.plan}
              </span>
            )}
            {testimonial.outcomeTag && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {testimonial.outcomeTag}
              </span>
            )}
          </div>
        )}
      </footer>
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
    const delta =
      card.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollBy({ left: delta, behavior: "smooth" });
  }, [index]);

  return (
    <section id="trust" className={cn("overflow-hidden px-4 sm:px-6 lg:px-8", SECTION_PADDING)}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Reviews
            </p>
            <h2
              className={`mt-1 font-heading font-bold tracking-tight text-foreground ${TYPOGRAPHY_SCALE.headline}`}
            >
              What filers are saying this tax season
            </h2>
            <p className={`mt-2 max-w-xl text-muted-foreground ${TYPOGRAPHY_SCALE.caption}`}>
              Real outcomes from salaried professionals, freelancers, and founders filing
              before the deadline.
            </p>
          </div>
          <p className={`text-muted-foreground sm:max-w-xs sm:text-right ${TYPOGRAPHY_SCALE.caption}`}>
            {TESTIMONIAL_DISCLOSURE}
            <CheckCircle2 className="ml-1 inline size-3.5 text-primary" aria-hidden />
          </p>
        </div>

        <div
          ref={scrollRef}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((t, i) => (
            <ReviewCard key={t.id} testimonial={t} active={i === index} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Show review ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2.5 min-w-[10px] rounded-full transition-all",
                  i === index ? "w-6 bg-primary" : "w-2.5 bg-muted-foreground/25"
                )}
              />
            ))}
          </div>
          <Link
            href="/reviews"
            className={`font-semibold text-primary hover:underline ${TYPOGRAPHY_SCALE.body}`}
          >
            Read all reviews →
          </Link>
        </div>
      </div>
    </section>
  );
}
