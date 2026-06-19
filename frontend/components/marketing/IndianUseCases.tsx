import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  PersonaCarousel,
  type PersonaCarouselItem,
} from "@/components/marketing/PersonaCarousel";
import { PERSONA_CAROUSEL } from "@/lib/copy/competitorInspired";
import { SCENARIO_HOOKS } from "@/lib/content/hooks";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

const PERSONA_ITEMS: PersonaCarouselItem[] = PERSONA_CAROUSEL.personas.map((p) => ({
  id: p.id,
  title: p.title,
  blurb: p.hook,
  href: p.href,
  cta: p.cta,
}));

const SCENARIO_ITEMS: PersonaCarouselItem[] = SCENARIO_HOOKS.map((h) => ({
  id: `scenario-${h.id}`,
  title: h.title,
  blurb: h.detail,
  href: h.href,
  cta: h.cta,
}));

// Persona cards + scenario hooks share several destinations (job change, senior,
// AIS). Dedupe by href so the carousel never shows the same guide twice.
const CAROUSEL_ITEMS: PersonaCarouselItem[] = (() => {
  const seen = new Set<string>();
  const merged: PersonaCarouselItem[] = [];
  for (const item of [...PERSONA_ITEMS, ...SCENARIO_ITEMS]) {
    const key = item.href.split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
})();

export function IndianUseCases() {
  return (
    <section className="section-compact-tight border-b border-border/40 px-4 sm:px-6 lg:px-8">
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <ScrollReveal className="text-center">
          <p className={cn("font-semibold uppercase tracking-[0.14em] text-primary", TYPOGRAPHY_SCALE.caption)}>
            {PERSONA_CAROUSEL.eyebrow}
          </p>
          <h2 className={cn("mt-2 font-semibold text-foreground", TYPOGRAPHY_SCALE.headline)}>
            {PERSONA_CAROUSEL.headline}
          </h2>
        </ScrollReveal>
        <PersonaCarousel items={CAROUSEL_ITEMS} label={PERSONA_CAROUSEL.headline} />
      </div>
    </section>
  );
}
