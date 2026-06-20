import { AlertCircle } from "lucide-react";
import {
  LandingCard,
  landingCardBodyClass,
  landingCardTitleClass,
} from "@/components/marketing/LandingCard";
import { PAIN_POINTS } from "@/lib/content/homepage";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function LandingPainStepsSection() {
  return (
    <section className="section-compact-tight border-b border-border/40 px-4 sm:px-6 lg:px-8">
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <p
          className={cn(
            "font-semibold uppercase tracking-[0.14em] text-primary",
            TYPOGRAPHY_SCALE.caption
          )}
        >
          Common filing pain points
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PAIN_POINTS.items.map((item) => (
            <LandingCard
              key={item.title}
              className="gap-2 transition-shadow hover:shadow-md"
            >
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
    </section>
  );
}
