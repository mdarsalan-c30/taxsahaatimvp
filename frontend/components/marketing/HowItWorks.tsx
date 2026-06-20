import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { HOW_IT_WORKS } from "@/lib/content/homepage";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="section-compact border-b border-border/40 bg-muted/20 px-4 sm:px-6 lg:px-8"
    >
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <ScrollReveal className="text-center">
          <p className={cn("font-semibold uppercase tracking-[0.14em] text-primary", TYPOGRAPHY_SCALE.caption)}>
            {HOW_IT_WORKS.eyebrow}
          </p>
          <h2 className={cn("mt-2 font-semibold text-foreground", TYPOGRAPHY_SCALE.headline)}>
            {HOW_IT_WORKS.headline}
          </h2>
        </ScrollReveal>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <ScrollReveal key={step.step} delay={1}>
              <li className="card-premium h-full p-5">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {step.step}
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.detail}</p>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
