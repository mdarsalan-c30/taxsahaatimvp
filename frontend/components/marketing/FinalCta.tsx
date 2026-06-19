import Link from "next/link";
import { FINAL_CTA, HERO_CTAS } from "@/lib/copy/marketing";
import { CONTENT_MAX } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section className="border-b border-border/40 bg-primary/5 px-4 py-8 sm:px-6 lg:px-8">
      <div
        className={cn(
          "mx-auto flex w-full min-w-0 flex-col items-center justify-between gap-4 sm:flex-row",
          CONTENT_MAX
        )}
      >
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">{FINAL_CTA.headline}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{FINAL_CTA.subhead}</p>
        </div>
        <Link
          href={HERO_CTAS.startFiling.href}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {FINAL_CTA.primary}
        </Link>
      </div>
    </section>
  );
}
