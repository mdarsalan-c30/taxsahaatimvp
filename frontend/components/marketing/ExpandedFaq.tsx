"use client";

import { useState } from "react";
import { FaqJsonLd } from "@/components/marketing/FaqJsonLd";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { EXPANDED_FAQ } from "@/lib/content/homepage";
import { LANDING_FAQS } from "@/lib/content/faqs";
import { cn } from "@/lib/utils";

export function ExpandedFaq({ maxItems }: { maxItems?: number } = {}) {
  const faqs = maxItems === undefined ? LANDING_FAQS : LANDING_FAQS.slice(0, maxItems);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="section-pad-lg px-4 sm:px-6 lg:px-8">
      <FaqJsonLd faqs={faqs} />
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Header */}
        <ScrollReveal className="text-center mb-12">
          <span className="eyebrow-label">{EXPANDED_FAQ.eyebrow}</span>
          <h2 className="font-manrope mt-3.5 text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em] text-[#0B1220] leading-[1.15]">
            {EXPANDED_FAQ.headline}
          </h2>
        </ScrollReveal>

        {/* Accordion */}
        <ScrollReveal delay={2}>
          <div className="mx-auto max-w-[720px]">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={faq.question}
                  className="border-b border-[#E6E8EC]"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-5 px-1 text-left text-[15.5px] font-semibold text-[#0B1220] hover:text-[#0e5f63] transition-colors"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                      className={cn("flex-shrink-0 ml-4 transition-transform duration-300", isOpen ? "rotate-45" : "")}
                    >
                      <path d="M8 3v10M3 8h10" stroke="#0B1220" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-350"
                    style={{ maxHeight: isOpen ? 400 : 0 }}
                  >
                    <p className="px-1 pb-5 text-[14.5px] text-[#6B7280] leading-[1.65] max-w-[640px]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
