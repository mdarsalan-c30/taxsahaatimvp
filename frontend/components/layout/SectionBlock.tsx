import { cn } from "@/lib/utils";
import { SECTION_PADDING, TYPOGRAPHY_SCALE } from "@/lib/design/layout";

interface SectionBlockProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  density?: "default" | "compact";
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function SectionBlock({
  title,
  subtitle,
  children,
  density = "default",
  className,
  headerClassName,
  contentClassName,
}: SectionBlockProps) {
  const isCompact = density === "compact";

  return (
    <section
      className={cn(
        "section-shell",
        isCompact ? "py-10 sm:py-12" : SECTION_PADDING,
        className
      )}
    >
      <header className={cn(isCompact ? "space-y-2" : "space-y-3", headerClassName)}>
        <h2 className={cn("font-semibold text-foreground", TYPOGRAPHY_SCALE.headline)}>{title}</h2>
        {subtitle ? (
          <p
            className={cn(
              "max-w-3xl text-muted-foreground",
              isCompact ? TYPOGRAPHY_SCALE.caption : TYPOGRAPHY_SCALE.body
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </header>
      <div className={cn(isCompact ? "mt-4" : "mt-8", contentClassName)}>{children}</div>
    </section>
  );
}
