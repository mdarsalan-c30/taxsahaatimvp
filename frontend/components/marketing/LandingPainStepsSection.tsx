import { AlertCircle } from "lucide-react";
import {
  LandingCard,
  landingCardBodyClass,
  landingCardTitleClass,
} from "@/components/marketing/LandingCard";
import { COMPANION_HOW_IT_WORKS } from "@/lib/copy/companion";
import { PAIN_POINTS } from "@/lib/content/homepage";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function LandingPainStepsSection() {
  return (
    <section
      id="how-it-works"
      className="section-compact-tight border-b border-border/40 px-4 sm:px-6 lg:px-8"
    >
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8 lg:min-h-[min(50vh,28rem)]">
          <div className="flex min-h-0 flex-col">
            <p
              className={cn(
                "font-semibold uppercase tracking-[0.14em] text-primary",
                TYPOGRAPHY_SCALE.caption
              )}
            >
              Common filing pain points
            </p>
            <div className="mt-3 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              {PAIN_POINTS.items.map((item) => (
                <LandingCard key={item.title} className="gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <h3 className={landingCardTitleClass}>{item.title}</h3>
                      <p className={landingCardBodyClass}>{item.detail}</p>
                    </div>
                  </div>
                </LandingCard>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <p
              className={cn(
                "font-semibold uppercase tracking-[0.14em] text-primary",
                TYPOGRAPHY_SCALE.caption
              )}
            >
              How LastMinute works
            </p>
            <ol className="mt-3 flex flex-1 flex-col gap-3">
              {COMPANION_HOW_IT_WORKS.map((item) => (
                <li key={item.step} className="flex flex-1">
                  <LandingCard className="w-full flex-row items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {item.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className={landingCardTitleClass}>{item.title}</h3>
                      <p className={landingCardBodyClass}>{item.detail}</p>
                    </div>
                  </LandingCard>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
