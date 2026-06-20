"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ArrowRight, FileUp } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { buildDocumentsFastPathUrl } from "@/lib/filing/routes";

interface HeroNameFormProps {
  /** Hide duplicate Form 16 CTA when header already shows Upload Form 16 */
  showForm16Cta?: boolean;
  /** Hide micro-disclaimer when the parent renders trust copy below */
  showDisclaimer?: boolean;
  className?: string;
}

export function HeroNameForm({
  showForm16Cta = true,
  showDisclaimer = true,
  className,
}: HeroNameFormProps) {
  const [name, setName] = useState("");
  const router = useRouter();
  const form16Href = buildDocumentsFastPathUrl(name);

  const trimmed = name.trim();
  const ctaLabel = trimmed
    ? `Start my free estimate, ${trimmed}`
    : "Start my free estimate";
  const mobileCtaLabel = trimmed ? `Start estimate, ${trimmed}` : "Start free estimate";

  function handleStartReturn(e: React.FormEvent) {
    e.preventDefault();
    trackEvent("landing_cta_click", { cta: "start_my_return", has_name: !!name.trim() });
    const trimmed = name.trim();
    const params = new URLSearchParams({ step: "about-you" });
    if (trimmed) params.set("name", trimmed);
    router.push(`/file/onboarding/eligibility?${params.toString()}`);
  }

  function handleForm16Click() {
    trackEvent("landing_cta_click", { cta: "upload_form16", has_name: !!name.trim() });
  }

  return (
    <div className={cn("mx-auto w-full min-w-0 max-w-lg space-y-2", className)}>
      {showForm16Cta && (
        <Link
          href={form16Href}
          onClick={handleForm16Click}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 min-h-11 w-full gap-2 rounded-xl bg-primary px-6 text-base font-semibold shadow-md hover:bg-primary/90"
          )}
        >
          <FileUp className="size-4" />
          Upload Form 16
          <ArrowRight className="size-4" />
        </Link>
      )}

      <form onSubmit={handleStartReturn}>
        <div className="card-premium flex min-w-0 flex-col gap-2 p-2 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="What should we call you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 text-base shadow-none focus-visible:ring-0"
            aria-label="Your name"
          />
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="h-11 w-full shrink-0 gap-2 whitespace-normal rounded-xl px-4 text-sm font-semibold leading-snug sm:w-auto sm:whitespace-nowrap sm:px-5 sm:text-base"
          >
            <span className="sm:hidden">{mobileCtaLabel}</span>
            <span className="hidden sm:inline">{ctaLabel}</span>
            <ArrowRight className="size-4 shrink-0" />
          </Button>
        </div>
      </form>

      {showDisclaimer && (
        <p className="text-center text-[11px] text-muted-foreground lg:text-left">
          ✨ Free tax estimate. No credit card required. Usually takes under 15 minutes.
        </p>
      )}
    </div>
  );
}
