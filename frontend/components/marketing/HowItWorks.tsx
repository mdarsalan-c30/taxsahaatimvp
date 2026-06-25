import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { HOW_IT_WORKS } from "@/lib/content/homepage";
import { FileSearch, Cpu, LineChart, Globe } from "lucide-react";

export function HowItWorks() {
  const icons = [
    <FileSearch key="1" className="size-6 text-[#0e5f63]" />,
    <Cpu key="2" className="size-6 text-[#0e5f63]" />,
    <LineChart key="3" className="size-6 text-[#0e5f63]" />,
    <Globe key="4" className="size-6 text-[#0e5f63]" />,
  ];

  return (
    <section id="how-it-works" className="section-pad-lg px-4 sm:px-6 lg:px-8 bg-[#FAFAFB]">
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Section header */}
        <ScrollReveal className="text-center mb-16">
          <span className="eyebrow-label">{HOW_IT_WORKS.eyebrow}</span>
          <h2 className="font-manrope mt-3.5 text-[clamp(28px,3vw,42px)] font-bold tracking-[-0.02em] text-[#0B1220] leading-[1.15]">
            {HOW_IT_WORKS.headline}
          </h2>
          <p className="mt-4 text-[16px] text-[#6B7280] leading-relaxed max-w-[600px] mx-auto">
            No new account to manage your filing — we prep, you submit on incometax.gov.in yourself.
          </p>
        </ScrollReveal>

        {/* Step cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <ScrollReveal key={step.step} delay={(i as 0 | 1 | 2 | 3)}>
              <div className="group relative h-full rounded-[16px] border border-[#E6E8EC] bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(11,18,32,.15)] overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#bfe9e0]/40 transition-transform duration-500 group-hover:scale-150" />
                
                {/* Icon wrapper */}
                <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#E8F3F1] shadow-sm">
                  {icons[i]}
                </div>

                <div className="relative z-10">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0e5f63] text-[12px] font-bold text-white">
                      {step.step}
                    </span>
                    <h3 className="font-manrope text-[18px] font-extrabold tracking-[-0.01em] text-[#0B1220]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-[14.5px] text-[#6B7280] leading-[1.6]">
                    {step.detail}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
