import { cn } from "@/lib/utils";
import { GRID_GAP } from "@/lib/design/layout";

type CompactGridCols = 2 | 3 | 4;

interface CompactGridProps {
  cols: CompactGridCols;
  className?: string;
  children: React.ReactNode;
}

const COLS_CLASS: Record<CompactGridCols, string> = {
  2: "grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch",
  3: "grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch",
  4: "grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 items-start",
};

export function CompactGrid({ cols, className, children }: CompactGridProps) {
  return <div className={cn(COLS_CLASS[cols], GRID_GAP, className)}>{children}</div>;
}
