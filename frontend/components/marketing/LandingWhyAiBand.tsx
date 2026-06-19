import Link from "next/link";
import {
  LandingCard,
  landingCardBodyClass,
  landingCardTitleClass,
} from "@/components/marketing/LandingCard";
import { AI_CA_CHECKS } from "@/lib/content/homepage";
import { WHY_US } from "@/lib/copy/competitorInspired";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function LandingWhyAiBand() {
  return (
    <section className="section-compact-tight border-b border-border/40 px-4 sm:px-6 lg:px-8">
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <div className="text-center">
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.14em] text-primary",
              TYPOGRAPHY_SCALE.caption
            )}
          >
            {WHY_US.eyebrow}
          </p>
          <h2 className={cn("mt-2 font-semibold text-foreground", TYPOGRAPHY_SCALE.headline)}>
            {WHY_US.headline}
          </h2>
          <p className={cn("mx-auto mt-2 max-w-2xl text-muted-foreground", TYPOGRAPHY_SCALE.body)}>
            {WHY_US.subhead}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {WHY_US.pillars.map((pillar) => (
            <LandingCard key={pillar.id}>
              <h3 className={landingCardTitleClass}>{pillar.title}</h3>
              <p className={landingCardBodyClass}>{pillar.detail}</p>
            </LandingCard>
          ))}
        </div>

        <div className="mt-8">
          <p
            className={cn(
              "text-center font-semibold uppercase tracking-[0.14em] text-primary",
              TYPOGRAPHY_SCALE.caption
            )}
          >
            {AI_CA_CHECKS.eyebrow}
          </p>
          <h3 className="mt-2 text-center text-lg font-semibold text-foreground">
            {AI_CA_CHECKS.headline}
          </h3>
          <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {AI_CA_CHECKS.checks.map((check) => (
              <li key={check}>
                <LandingCard className="flex-row items-start gap-2.5 py-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span className="text-xs text-foreground md:text-sm">{check}</span>
                </LandingCard>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/file/import/documents?source=form16"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Start with Form 16 upload
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
}
