export const SECTION_PADDING = "py-16 sm:py-20 lg:py-24";
export const CONTENT_MAX = "max-w-6xl";
export const GRID_GAP = "gap-6 sm:gap-8 lg:gap-10";

export const LEGAL_PROSE_MAX = "max-w-3xl";

export const TYPOGRAPHY_SCALE = {
  display: "text-[length:var(--text-display)] leading-[1.1] tracking-[-0.02em]",
  headline: "text-[length:var(--text-headline)] leading-[1.2] tracking-[-0.015em]",
  body: "text-[length:var(--text-body)] leading-[1.75] tracking-[0.003em]",
  caption: "text-[length:var(--text-caption)] leading-[1.5] tracking-[0.002em]",
  micro: "text-[length:var(--text-micro)] leading-[1.4] tracking-[0.01em]",
} as const;

/** Filing workspace — wider content beside nav + Genie (kept after layout rollback). */
export const FILING_WORKSPACE = {
  grid: "filing-workspace-grid",
  content: "filing-workspace-content",
  importLayout: "filing-import-layout",
  cardGrid: "filing-workspace-card-grid",
} as const;
