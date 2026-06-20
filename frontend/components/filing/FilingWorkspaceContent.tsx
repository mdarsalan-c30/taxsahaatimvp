import type { ReactNode } from "react";
import { FILING_WORKSPACE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

/**
 * Full-width inner wrapper for filing workspace pages.
 * Avoids marketing-style max-width caps inside the main workspace card.
 */
export function FilingWorkspaceContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(FILING_WORKSPACE.content, className)}>{children}</div>
  );
}
