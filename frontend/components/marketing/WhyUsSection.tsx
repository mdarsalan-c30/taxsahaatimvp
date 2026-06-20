import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { WHY_US } from "@/lib/copy/competitorInspired";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function WhyUsSection() {
  return (
    <section className="section-compact border-b border-border/40 bg-muted/10 px-4 sm:px-6 lg:px-8">
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <ScrollReveal className="text-center">
          <p className={cn("font-semibold uppercase tracking-[0.14em] text-primary", TYPOGRAPHY_SCALE.caption)}>
            {WHY_US.eyebrow}
          </p>
          <h2 className={cn("mt-2 font-semibold text-foreground", TYPOGRAPHY_SCALE.headline)}>
            {WHY_US.headline}
          </h2>
          <p className={cn("mx-auto mt-2 max-w-2xl text-muted-foreground", TYPOGRAPHY_SCALE.body)}>
            {WHY_US.subhead}
          </p>
        </ScrollReveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {WHY_US.pillars.map((pillar, i) => (
            <ScrollReveal key={pillar.id} delay={(1 + i) as 0 | 1 | 2 | 3 | 4}>
              <article className="card-premium h-full p-5">
                <h3 className="font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{pillar.detail}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={2} className="mt-6 text-center">
          <Link
            href="/file/import/documents?source=form16"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Start with Form 16 upload
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
