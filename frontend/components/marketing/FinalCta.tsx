import Link from "next/link";
import { CompactSection } from "@/components/layout/CompactSection";
import { FINAL_CTA, HERO_CTAS } from "@/lib/copy/marketing";
import { CONTENT_MAX } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <CompactSection
      variant="ctaBand"
      className="border-b border-border/40 bg-primary/5"
    >
      <div
        className={cn(
          "mx-auto flex w-full min-w-0 flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4",
          CONTENT_MAX
        )}
      >
        <div className="text-center sm:text-left">
          <h2 className="text-sm font-semibold text-foreground sm:text-base">
            {FINAL_CTA.headline}
          </h2>
          <p className="mt-0.5 max-w-xl text-xs text-muted-foreground line-clamp-1 sm:text-sm">
            {FINAL_CTA.subhead}
          </p>
        </div>
        <Link
          href={HERO_CTAS.startFiling.href}
          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {FINAL_CTA.primary}
        </Link>
      </div>
    </CompactSection>
  );
}
