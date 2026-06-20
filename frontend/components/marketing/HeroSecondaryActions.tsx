"use client";

import Link from "next/link";
import { ArrowRight, FileUp, PlayCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { HERO_CTAS } from "@/lib/copy/marketing";
import { cn } from "@/lib/utils";

interface HeroSecondaryActionsProps {
  className?: string;
}

export function HeroSecondaryActions({ className }: HeroSecondaryActionsProps) {
  function handleForm16Click() {
    trackEvent("landing_cta_click", { cta: "upload_form16", has_name: false });
  }

  function handleHowItWorksClick() {
    trackEvent("landing_cta_click", { cta: "how_it_works" });
  }

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <Link
        href={HERO_CTAS.uploadForm16.href}
        onClick={handleForm16Click}
        className="group flex h-[88px] min-h-[88px] flex-col justify-center rounded-2xl border border-primary/30 bg-primary px-3.5 py-3 text-left shadow-md transition-all hover:bg-primary/90 sm:px-4"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-primary-foreground sm:text-[15px]">
          <FileUp className="size-4 shrink-0" aria-hidden />
          <span className="leading-tight">{HERO_CTAS.uploadForm16.label}</span>
          <ArrowRight
            className="ml-auto size-4 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
        <span className="mt-1 hidden text-[11px] leading-snug text-primary-foreground/85 sm:block">
          Drop PDF — we parse and prep your return
        </span>
      </Link>

      <Link
        href={HERO_CTAS.howItWorks.href}
        onClick={handleHowItWorksClick}
        className="group flex h-[88px] min-h-[88px] flex-col justify-center rounded-2xl border-2 border-slate-200 bg-white px-3.5 py-3 text-left shadow-sm transition-all hover:border-blue-400 hover:bg-blue-100/80 sm:px-4"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-[15px]">
          <PlayCircle className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="leading-tight">{HERO_CTAS.howItWorks.label}</span>
          <ArrowRight
            className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
        <span className="mt-1 hidden text-[11px] leading-snug text-muted-foreground sm:block">
          3 simple steps to file on the gov portal
        </span>
      </Link>
    </div>
  );
}
