"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/lib/payments/plans";
import { getDisplayPricing, formatPlanPriceLabel } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

export interface PlanCardProps {
  plan: Plan;
  variant?: "marketing" | "checkout";
  selected?: boolean;
  /** Engine-driven highlight — "Recommended for you" */
  engineRecommended?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  href?: string;
  ctaLabel?: string;
  className?: string;
}

export function PlanCard({
  plan,
  variant = "marketing",
  selected = false,
  engineRecommended = false,
  disabled = false,
  onSelect,
  href,
  ctaLabel,
  className,
}: PlanCardProps) {
  const showPopular = plan.recommended && !engineRecommended && !plan.comingSoon;
  const isCheckout = variant === "checkout";
  const isComingSoon = plan.comingSoon === true;
  const comingSoonFeatureSet = new Set(plan.comingSoonFeatures ?? []);
  const displayPricing = getDisplayPricing(plan.id);

  const formatFeature = (feature: string) => {
    if (comingSoonFeatureSet.has(feature)) {
      return `${feature} (Launching soon)`;
    }
    return feature;
  };

  const cardClassName = cn(
    isCheckout
      ? "flex h-full flex-col rounded-xl border p-4 text-left transition-colors sm:p-5"
      : "landing-card flex h-full flex-col transition-shadow hover:shadow-md",
    isCheckout &&
      (selected
        ? "border-blue-500 ring-1 ring-blue-200 bg-blue-50/30"
        : "border-slate-200 hover:border-slate-300"),
    !isCheckout && plan.recommended && "card-glow ring-2 ring-primary/20",
    isCheckout && engineRecommended && !selected && "border-blue-300 ring-1 ring-blue-100",
    disabled && isCheckout && "cursor-not-allowed opacity-60",
    isComingSoon && isCheckout && "cursor-not-allowed opacity-70",
    className
  );

  const badge = engineRecommended ? (
    <span className="mb-2 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      Recommended for you
    </span>
  ) : isComingSoon ? (
    isCheckout ? (
      <span className="mb-2 inline-block rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        Coming soon
      </span>
    ) : (
      <Badge variant="secondary" className="bg-amber-100 text-amber-900">
        Coming soon
      </Badge>
    )
  ) : showPopular ? (
    isCheckout ? (
      <span className="mb-2 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        Popular
      </span>
    ) : (
      <Badge className="bg-primary text-primary-foreground">Popular</Badge>
    )
  ) : null;

  const content = (
    <>
      <div
        className={cn(
          "flex items-center",
          isCheckout ? "flex-col items-start" : "flex-col items-start"
        )}
      >
        {isCheckout ? (
          <>
            {badge}
            <strong className="text-slate-900">{plan.name}</strong>
          </>
        ) : (
          <>
            <div className="min-h-[1.75rem]">{badge}</div>
            <h3 className="text-lg font-bold">{plan.name}</h3>
          </>
        )}
      </div>

      {!isCheckout && (
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      )}

      <div
        className={cn(
          "font-bold tabular-nums text-slate-900",
          isCheckout ? "mt-1 text-2xl" : "mt-3 text-3xl font-extrabold tracking-tight"
        )}
      >
        {displayPricing.showOffer && displayPricing.original !== undefined ? (
          <span className="flex flex-wrap items-baseline gap-2">
            <span>{formatPlanPriceLabel(displayPricing.current)}</span>
            <span className="text-lg font-semibold text-muted-foreground line-through">
              {formatPlanPriceLabel(displayPricing.original)}
            </span>
          </span>
        ) : (
          formatPlanPriceLabel(displayPricing.current)
        )}
      </div>

      <ul
        className={cn(
          isCheckout
            ? "mt-2 flex-1 text-sm text-slate-600"
            : "mt-3 flex-1 space-y-2"
        )}
      >
        {plan.features.map((feature) => (
          <li
            key={feature}
            className={cn(
              isCheckout
                ? "flex items-start gap-2"
                : "flex items-start gap-2 text-sm text-muted-foreground"
            )}
          >
            <Check
              className={cn(
                "shrink-0 text-emerald-600",
                isCheckout ? "mt-0.5 size-3.5" : "mt-0.5 size-4"
              )}
            />
            {formatFeature(feature)}
          </li>
        ))}
      </ul>

      {!isCheckout && href && !isComingSoon && (
        <Link
          href={href}
          className={cn(
            "mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            plan.recommended
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border border-border bg-white text-foreground hover:bg-muted/50"
          )}
        >
          {ctaLabel ?? (plan.id === "free" ? "Start free" : "Choose plan")}
        </Link>
      )}

      {!isCheckout && isComingSoon && (
        <Link
          href="/reviews"
          className="mt-6 inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
        >
          Join waitlist →
        </Link>
      )}
    </>
  );

  if (isCheckout) {
    return (
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled || isComingSoon}
        className={cn(cardClassName, "w-full")}
        aria-pressed={selected}
        aria-disabled={isComingSoon}
      >
        {content}
      </button>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
