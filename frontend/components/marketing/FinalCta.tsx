"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { FINAL_CTA, HERO_CTAS } from "@/lib/copy/marketing";

export function FinalCta() {
  return (
    <section className="section-pad-lg px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <ScrollReveal>
          <div
            className="relative overflow-hidden rounded-[24px] px-12 py-16 text-center max-[600px]:px-8 max-[600px]:py-10"
            style={{ background: "linear-gradient(135deg, #0F2C72, #1D4ED8)" }}
          >
            {/* Aqua orb */}
            <div
              className="hero-orb opacity-25"
              style={{ width: 380, height: 380, background: "radial-gradient(circle, #06C6D4, transparent 70%)", top: -140, right: -100 }}
              aria-hidden
            />
            <div className="relative z-10">
              <h2 className="font-manrope text-[clamp(24px,3.2vw,34px)] font-bold tracking-[-0.02em] text-white mb-3.5">
                {FINAL_CTA.headline}
              </h2>
              <p style={{ color: "#C7D4F5", fontSize: 16, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>
                {FINAL_CTA.subhead}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={HERO_CTAS.startFiling.href}
                  className="btn-pill-primary transition-all hover:!bg-[#EEF3FF]"
                  style={{ background: "#fff", color: "#1D4ED8", boxShadow: "none" }}
                >
                  {FINAL_CTA.primary}
                </Link>
                <Link
                  href="/file/onboarding/eligibility?step=about-you"
                  className="btn-pill-secondary transition-all hover:!bg-[rgba(255,255,255,0.12)] hover:!border-white"
                  style={{ background: "transparent", borderColor: "rgba(255,255,255,0.35)", color: "#fff" }}
                >
                  {FINAL_CTA.secondary}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
