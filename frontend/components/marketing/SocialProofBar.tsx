import { TrustBar } from "@/components/marketing/TrustBar";
import { HERO_TRUST_DISCLAIMER } from "@/lib/copy/marketing";
import { cn } from "@/lib/utils";

interface SocialProofBarProps {
  variant?: "light" | "dark";
  trustVariant?: "light" | "dark" | "compact" | "hero";
  showBetaBadge?: boolean;
  showCheckoutNote?: boolean;
  className?: string;
}

export function SocialProofBar({
  variant = "light",
  trustVariant,
  showBetaBadge = true,
  showCheckoutNote = true,
  className,
}: SocialProofBarProps) {
  const isHero = trustVariant === "hero";

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <TrustBar
        variant={trustVariant ?? variant}
        showBetaBadge={showBetaBadge}
      />
      {isHero ? (
        <p className="text-tier-legal text-center text-muted-foreground lg:text-left">
          ✨ {HERO_TRUST_DISCLAIMER}
        </p>
      ) : showCheckoutNote ? (
        <p className="text-tier-legal text-center lg:text-left">
          Secure checkout via Razorpay. We never store card or UPI details.
        </p>
      ) : null}
    </div>
  );
}
