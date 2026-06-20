"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaqJsonLd } from "@/components/marketing/FaqJsonLd";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { EXPANDED_FAQ } from "@/lib/content/homepage";
import { LANDING_FAQS } from "@/lib/content/faqs";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function ExpandedFaq() {
  return (
    <section className="section-compact border-b border-border/40 px-4 sm:px-6 lg:px-8">
      <FaqJsonLd faqs={LANDING_FAQS} />
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <ScrollReveal className="text-center">
          <p className={cn("font-semibold uppercase tracking-[0.14em] text-primary", TYPOGRAPHY_SCALE.caption)}>
            {EXPANDED_FAQ.eyebrow}
          </p>
          <h2 className={cn("mt-2 font-semibold text-foreground", TYPOGRAPHY_SCALE.headline)}>
            {EXPANDED_FAQ.headline}
          </h2>
        </ScrollReveal>
        <ScrollReveal className="mx-auto mt-8 max-w-2xl" delay={2}>
          <Accordion defaultValue={[]} multiple className="w-full">
            {LANDING_FAQS.map((faq, i) => (
              <AccordionItem key={faq.question} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
