import { cn } from "@/lib/utils";

type CompactSectionVariant = "tight" | "footer" | "ctaBand";

interface CompactSectionProps {
  variant?: CompactSectionVariant;
  className?: string;
  children: React.ReactNode;
}

const VARIANT_CLASS: Record<CompactSectionVariant, string> = {
  tight: "py-10 sm:py-12",
  footer: "py-6 sm:py-8",
  ctaBand: "py-6 sm:py-8",
};

export function CompactSection({
  variant = "tight",
  className,
  children,
}: CompactSectionProps) {
  return (
    <section className={cn("section-shell", VARIANT_CLASS[variant], className)}>
      {children}
    </section>
  );
}
