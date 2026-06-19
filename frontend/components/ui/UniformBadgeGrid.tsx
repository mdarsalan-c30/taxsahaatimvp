import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type UniformBadgeItem = {
  label: string;
  icon?: LucideIcon;
  iconNode?: ReactNode;
};

interface UniformBadgeGridProps {
  items: readonly UniformBadgeItem[];
  variant?: "light" | "dark";
  layout?: "default" | "hero";
  className?: string;
}

export function UniformBadgeGrid({
  items,
  variant = "light",
  layout = "default",
  className,
}: UniformBadgeGridProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "uniform-badge-grid w-full",
        layout === "hero" && "uniform-badge-grid-hero",
        isDark ? "uniform-badge-grid-dark" : "uniform-badge-grid-light",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <span
            key={item.label}
            className={cn(
              "uniform-badge-cell",
              isDark ? "uniform-badge-cell-dark" : "uniform-badge-cell-light"
            )}
          >
            {item.iconNode ? (
              <span className="uniform-badge-icon" aria-hidden>
                {item.iconNode}
              </span>
            ) : Icon ? (
              <Icon
                className={cn(
                  "uniform-badge-icon-svg",
                  isDark ? "text-blue-300" : "text-primary"
                )}
                aria-hidden
              />
            ) : null}
            <span className="uniform-badge-label">{item.label}</span>
          </span>
        );
      })}
    </div>
  );
}
