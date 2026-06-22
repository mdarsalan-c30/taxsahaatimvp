import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { HOW_IT_WORKS } from "@/lib/content/homepage";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-pad-lg px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Section header */}
        <ScrollReveal className="text-center mb-14">
          <span className="eyebrow-label">{HOW_IT_WORKS.eyebrow}</span>
          <h2 className="font-manrope mt-3.5 text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em] text-[#0B1220] leading-[1.15]">
            {HOW_IT_WORKS.headline}
          </h2>
          <p className="mt-3.5 text-[16px] text-[#6B7280] leading-relaxed max-w-[600px] mx-auto">
            No new account to manage your filing — we prep, you submit on incometax.gov.in yourself.
          </p>
        </ScrollReveal>

        {/* Step cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <ScrollReveal key={step.step} delay={(i as 0 | 1 | 2)}>
              <div className="group rounded-[16px] border border-[#E6E8EC] bg-white p-8 transition-all duration-350 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(11,18,32,.15)]">
                {/* Number badge */}
                <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1D4ED8] font-manrope text-[15px] font-bold text-white">
                  {step.step}
                </div>
                <h3 className="font-manrope text-[18px] font-bold tracking-[-0.01em] text-[#0B1220] mb-2.5">
                  {step.title}
                </h3>
                <p className="text-[14.5px] text-[#6B7280] leading-[1.55]">
                  {step.detail}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
