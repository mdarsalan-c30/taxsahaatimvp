import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { FINAL_CTA, HERO_CTAS } from "@/lib/copy/marketing";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section className="section-compact border-b border-border/40 bg-primary/5 px-4 sm:px-6 lg:px-8">
      <div className={cn("mx-auto w-full min-w-0 text-center", CONTENT_MAX)}>
        <ScrollReveal>
          <h2 className={cn("font-semibold text-foreground", TYPOGRAPHY_SCALE.headline)}>
            {FINAL_CTA.headline}
          </h2>
          <p className={cn("mx-auto mt-3 max-w-xl text-muted-foreground", TYPOGRAPHY_SCALE.body)}>
            {FINAL_CTA.subhead}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={HERO_CTAS.startFiling.href}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {FINAL_CTA.primary}
            </Link>
            <Link
              href="/file/onboarding/eligibility?step=about-you"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/50"
            >
              {FINAL_CTA.secondary}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
