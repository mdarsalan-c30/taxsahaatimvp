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
  "mb-2 text-lg font-semibold text-foreground";

export const landingCardBodyClass =
  "flex-1 text-sm text-muted-foreground line-clamp-3";
