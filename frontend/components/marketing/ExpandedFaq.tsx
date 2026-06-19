"use client";

import Link from "next/link";
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

const VISIBLE_FAQS = LANDING_FAQS.slice(0, 6);
const FAQ_MID = Math.ceil(VISIBLE_FAQS.length / 2);

function FaqColumn({ items, offset }: { items: typeof VISIBLE_FAQS; offset: number }) {
  return (
    <Accordion defaultValue={[]} multiple className="w-full">
      {items.map((faq, i) => (
        <AccordionItem key={faq.question} value={`faq-${offset + i}`}>
          <AccordionTrigger className="text-left text-sm font-medium">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function ExpandedFaq() {
  const leftFaqs = VISIBLE_FAQS.slice(0, FAQ_MID);
  const rightFaqs = VISIBLE_FAQS.slice(FAQ_MID);

  return (
    <section className="section-compact-tight border-b border-border/40 px-4 sm:px-6 lg:px-8">
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
        <ScrollReveal className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6" delay={2}>
          <FaqColumn items={leftFaqs} offset={0} />
          <FaqColumn items={rightFaqs} offset={FAQ_MID} />
        </ScrollReveal>
        <p className="mt-4 text-center">
          <Link href="/help" className="text-sm font-semibold text-primary hover:underline">
            View all help articles →
          </Link>
        </p>
      </div>
    </section>
  );
}
