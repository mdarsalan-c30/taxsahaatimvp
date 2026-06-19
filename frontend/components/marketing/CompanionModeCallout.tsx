import { HeroNameForm } from "@/components/marketing/HeroNameForm";
import {
  COMPANION_HOW_IT_WORKS,
  COMPANION_ITD_DISCLAIMER,
} from "@/lib/copy/companion";
import { cn } from "@/lib/utils";

type CompanionModeCalloutVariant = "steps" | "disclaimer" | "cta-only";

interface CompanionModeCalloutProps {
  variant?: CompanionModeCalloutVariant;
  className?: string;
}

export function CompanionModeCallout({
  variant = "steps",
  className,
}: CompanionModeCalloutProps) {
  if (variant === "disclaimer") {
    return (
      <p
        className={cn(
          "text-xs leading-relaxed text-muted-foreground",
          className
        )}
      >
        {COMPANION_ITD_DISCLAIMER}
      </p>
    );
  }

  if (variant === "cta-only") {
    return (
      <div className={cn("space-y-2", className)}>
        <HeroNameForm showForm16Cta={false} showDisclaimer={false} className="mx-0 max-w-none" />
        <p className="text-center text-[10px] leading-snug text-muted-foreground lg:text-left">
          {COMPANION_ITD_DISCLAIMER}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <HeroNameForm showForm16Cta={false} showDisclaimer={false} className="mx-0 max-w-none" />

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          How LastMinute works
        </p>
        <ol className="grid gap-2 sm:grid-cols-3 sm:gap-2.5">
          {COMPANION_HOW_IT_WORKS.map((item) => (
            <li
              key={item.step}
              className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-white/80 px-3 py-2.5 shadow-sm backdrop-blur-sm sm:gap-3 sm:px-3.5 sm:py-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary sm:size-7 sm:text-sm">
                {item.step}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight tracking-tight text-foreground">
                  {item.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-center text-[10px] leading-snug text-muted-foreground lg:text-left">
        {COMPANION_ITD_DISCLAIMER}
      </p>
    </div>
  );
}
