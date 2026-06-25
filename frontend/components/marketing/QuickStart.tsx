"use client";

import Link from "next/link";
import { IMPORT_STRIP, SCALE_PROOF } from "@/lib/copy/competitorInspired";
import { QUICK_START_CONNECTORS } from "@/lib/constants";

const CONNECTOR_STATUS: Record<string, { label: string; dotClass: string }> = {
  live:    { label: "Live",    dotClass: "bg-[#A3E635]" },
  soon:    { label: "Soon",    dotClass: "bg-[#F5B945]" },
  roadmap: { label: "Roadmap", dotClass: "bg-[#9CA3AF]" },
};

// Aqua SVG icons for each doc card
const DOC_ICONS: Record<string, React.ReactNode> = {
  form16: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 1.5h6l2.5 2.5v9a1 1 0 01-1 1h-7.5a1 1 0 01-1-1V2.5a1 1 0 011-1z" stroke="#bfe9e0" strokeWidth="1.3"/>
      <path d="M5.5 7h5M5.5 9.5h5" stroke="#bfe9e0" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  ais: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 13.5V6.5l5.5-4 5.5 4v7" stroke="#bfe9e0" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 13.5v-4h3v4" stroke="#bfe9e0" strokeWidth="1.2"/>
    </svg>
  ),
  groww: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 13.5h12M3 13.5V7l4-3 4 3v6.5" stroke="#bfe9e0" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 6l1.5 1.5L10 5" stroke="#bfe9e0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  mfcentral: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="#bfe9e0" strokeWidth="1.3"/>
      <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" stroke="#bfe9e0" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
};

export function QuickStart() {
  return (
    <section className="section-pad-lg px-4 sm:px-6 lg:px-8" style={{ paddingTop: 0 }}>
      <div className="mx-auto max-w-[1180px]">
        <div className="section-dark-ink px-16 py-16 max-[900px]:px-7 max-[900px]:py-10">
          {/* Background aqua orb */}
          <div
            className="hero-orb opacity-25"
            style={{ width: 380, height: 380, background: "radial-gradient(circle, #bfe9e0, transparent 70%)", bottom: -160, left: -100 }}
            aria-hidden
          />

          <div className="relative z-10 grid items-center gap-14 lg:grid-cols-2 max-[900px]:grid-cols-1 max-[900px]:gap-9">
            {/* Left */}
            <div>
              <span className="eyebrow-label" style={{ color: "#bfe9e0" }}>
                {IMPORT_STRIP.eyebrow}
              </span>
              <h2 className="font-manrope mt-3.5 text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.02em] text-white leading-[1.2] mb-4">
                {IMPORT_STRIP.headline}
              </h2>
              <p style={{ color: "#9AA3B5", fontSize: 15.5, lineHeight: 1.6, maxWidth: 420, marginBottom: 22 }}>
                {IMPORT_STRIP.subhead}
              </p>

              {/* Status chips */}
              <div className="flex flex-wrap gap-2.5 mb-5">
                {IMPORT_STRIP.connectors.map((c) => {
                  const st = CONNECTOR_STATUS[c.status] ?? CONNECTOR_STATUS.roadmap;
                  return (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium"
                      style={{ color: "#D7DAE3", background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${st.dotClass}`} />
                      {c.label} · {st.label}
                    </span>
                  );
                })}
              </div>

              {/* Beta note */}
              <div
                className="rounded-[16px] p-5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                <h5 className="font-manrope text-[14.5px] font-bold text-white mb-1.5">
                  {SCALE_PROOF.headline}
                </h5>
                <p style={{ color: "#9AA3B5", fontSize: 13, lineHeight: 1.55 }}>
                  {SCALE_PROOF.detail}
                </p>
              </div>
            </div>

            {/* Right: 2×2 doc cards */}
            <div className="grid grid-cols-2 gap-3.5">
              {QUICK_START_CONNECTORS.map((connector) => (
                <Link
                  key={connector.id}
                  href={connector.href}
                  className="group block rounded-[16px] p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div
                    className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-[10px]"
                    style={{ background: "rgba(6,198,212,0.15)" }}
                  >
                    {DOC_ICONS[connector.id] ?? DOC_ICONS.form16}
                  </div>
                  <h5 className="font-manrope text-[15px] font-bold text-white mb-1.5">
                    {connector.title}
                  </h5>
                  <p style={{ color: "#9AA3B5", fontSize: 12.5, lineHeight: 1.45 }}>
                    {connector.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
