import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { WHY_US } from "@/lib/copy/competitorInspired";

const WHY_ICONS = [
  // Checkmark / mismatch
  <svg key="1" width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M2 8l3 3 9-9" stroke="#0e5f63" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  // Bar chart / regime
  <svg key="2" width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M2 12V4M6 12V7M10 12V2M14 12V9" stroke="#0e5f63" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  // Document / companion
  <svg key="3" width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#0e5f63" strokeWidth="1.6"/><path d="M5 6.5h6M5 9h4" stroke="#0e5f63" strokeWidth="1.4" strokeLinecap="round"/></svg>,
];

export function WhyUsSection() {
  return (
    <section id="why" className="section-pad-lg px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Header */}
        <ScrollReveal className="text-center mb-14">
          <span className="eyebrow-label">{WHY_US.eyebrow}</span>
          <h2 className="font-manrope mt-3.5 text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em] text-[#0B1220] leading-[1.15]">
            {WHY_US.headline}
          </h2>
          <p className="mt-3.5 text-[16px] text-[#6B7280] leading-relaxed max-w-[600px] mx-auto">
            {WHY_US.subhead}
          </p>
        </ScrollReveal>

        {/* 3 pillar cards */}
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          {WHY_US.pillars.map((pillar, i) => (
            <ScrollReveal key={pillar.id} delay={(1 + i) as 0 | 1 | 2 | 3 | 4}>
              <article className="rounded-[16px] border border-[#E6E8EC] bg-white p-7 h-full">
                {/* Icon box */}
                <div className="mb-4.5 flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#EEF3FF]">
                  {WHY_ICONS[i]}
                </div>
                <h3 className="font-manrope text-[17px] font-bold tracking-[-0.01em] text-[#0B1220] mb-2.5">
                  {pillar.title}
                </h3>
                <p className="text-[14.5px] text-[#6B7280] leading-[1.55]">
                  {pillar.detail}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Ghost CTA */}
        <ScrollReveal delay={2} className="text-center">
          <Link
            href="/file/import/documents?source=form16"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0e5f63] hover:underline group"
          >
            Start with Form 16 upload
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#0e5f63" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
