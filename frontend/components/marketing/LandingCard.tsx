import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LandingCardProps {
  children: ReactNode;
  className?: string;
}

export function LandingCard({ children, className }: LandingCardProps) {
  return (
    <div className={cn("landing-card flex flex-col", className)}>{children}</div>
  );
}

export const landingCardTitleClass =
  "text-sm font-semibold text-foreground md:text-base";

export const landingCardBodyClass =
  "mt-1 flex-1 text-xs text-muted-foreground line-clamp-2 md:text-sm md:line-clamp-3";
