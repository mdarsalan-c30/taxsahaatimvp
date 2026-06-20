import {
  LandingCard,
  landingCardBodyClass,
  landingCardTitleClass,
} from "@/components/marketing/LandingCard";
import { COMPANION_HOW_IT_WORKS } from "@/lib/copy/companion";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

const STEP_EMOJIS = ["1️⃣", "2️⃣", "3️⃣"] as const;

export function LandingHowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="section-compact-tight border-b border-border/40 px-4 sm:px-6 lg:px-8"
    >
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <p
          className={cn(
            "text-center font-semibold uppercase tracking-[0.14em] text-primary lg:text-left",
            TYPOGRAPHY_SCALE.caption
          )}
        >
          How LastMinute works
        </p>
        <div className="mt-3 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {COMPANION_HOW_IT_WORKS.map((item, index) => (
            <LandingCard key={item.step} className="transition-shadow hover:shadow-md">
              <div className="mb-4 text-3xl" aria-hidden>
                {STEP_EMOJIS[index]}
              </div>
              <h3 className={landingCardTitleClass}>{item.title}</h3>
              <p className={landingCardBodyClass}>{item.detail}</p>
            </LandingCard>
          ))}
        </div>
      </div>
    </section>
  );
}
