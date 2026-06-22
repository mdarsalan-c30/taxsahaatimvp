"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TESTIMONIALS, TESTIMONIAL_DISCLOSURE } from "@/lib/content/testimonials";
import { ASSESSMENT_YEAR } from "@/lib/constants";
import { cn } from "@/lib/utils";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="text-[#74A81F] text-[13px] tracking-[1px] mb-3">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
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
        "flex h-full flex-col rounded-[16px] border bg-white p-5 transition-all duration-300",
        active ? "border-[#1D4ED8]/50 shadow-[0_8px_24px_-8px_rgba(29,78,216,0.2)]" : "border-[#E6E8EC]"
      )}
    >
      <StarRow rating={testimonial.rating} />
      <p className="text-[13.5px] text-[#2B3344] leading-[1.55] mb-4 flex-1 min-h-[78px]">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="mb-2.5">
        <p className="text-[13px] font-semibold text-[#0B1220]">{testimonial.name}</p>
        <p className="text-[12px] text-[#6B7280]">{testimonial.role}, {testimonial.city}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {testimonial.plan && (
          <span className="rounded-[6px] bg-[#EEF3FF] px-2 py-0.5 text-[10.5px] font-semibold text-[#1D4ED8]">
            {testimonial.plan}
          </span>
        )}
        {testimonial.outcomeTag && (
          <span className="rounded-[6px] bg-[#EEF3FF] px-2 py-0.5 text-[10.5px] font-semibold text-[#1D4ED8]">
            {testimonial.outcomeTag}
          </span>
        )}
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
    const delta = card.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollBy({ left: delta, behavior: "smooth" });
  }, [index]);

  return (
    <section id="trust" className="section-pad-lg px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        {/* Header row */}
        <div className="flex items-flex-end justify-between mb-9 flex-wrap gap-3.5">
          <div>
            <span className="eyebrow-label">Reviews</span>
            <h2 className="font-manrope mt-2.5 text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.02em] text-[#0B1220]">
              What beta filers are saying
            </h2>
          </div>
          <p className="text-[12.5px] text-[#9CA3AF] text-right self-end max-sm:text-left">
            {TESTIMONIAL_DISCLOSURE} · {ASSESSMENT_YEAR}
          </p>
        </div>

        {/* Desktop 4-col grid (lg+), mobile scroll */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4.5">
          {TESTIMONIALS.slice(0, 4).map((t, i) => (
            <ReviewCard key={t.id} testimonial={t} active={i === index} />
          ))}
        </div>

        {/* Mobile horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((t, i) => (
            <div key={t.id} className="w-[min(100%,17rem)] shrink-0 snap-start">
              <ReviewCard testimonial={t} active={i === index} />
            </div>
          ))}
        </div>

        {/* Dots + read all */}
        <div className="mt-5 flex items-center justify-between gap-3 lg:hidden">
          <div className="flex gap-1.5">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Show review ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 min-w-[8px] rounded-full transition-all",
                  i === index ? "w-5 bg-[#1D4ED8]" : "w-2 bg-[#6B7280]/25"
                )}
              />
            ))}
          </div>
          <Link href="/reviews" className="text-[12.5px] font-semibold text-[#1D4ED8] hover:underline">
            Read all reviews →
          </Link>
        </div>

        <div className="mt-5 hidden justify-end lg:flex">
          <Link href="/reviews" className="text-[12.5px] font-semibold text-[#1D4ED8] hover:underline">
            Read all reviews →
          </Link>
        </div>
      </div>
    </section>
  );
}
