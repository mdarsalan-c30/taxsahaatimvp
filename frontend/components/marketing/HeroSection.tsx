"use client";

import { useState } from "react";
import Link from "next/link";
import { RegimeComparatorHero } from "@/components/marketing/RegimeComparatorHero";
import { CaRegistrationForm } from "@/components/marketing/CaRegistrationForm";
import { ASSESSMENT_YEAR } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const [mode, setMode] = useState<"b2c" | "b2b">("b2c");

  return (
    <header
      className="relative overflow-hidden"
      style={{ padding: "32px 0 120px", background: "#FAFAFB" }}
    >
      {/* Background orbs */}
      <div
        className="hero-orb"
        style={{
          width: 520,
          height: 520,
          background: "radial-gradient(circle, #bfe9e0, transparent 70%)",
          top: -180,
          right: -160,
          opacity: 0.35,
        }}
        aria-hidden
      />
      <div
        className="hero-orb"
        style={{
          width: 420,
          height: 420,
          background: "radial-gradient(circle, #0e5f63, transparent 70%)",
          bottom: -200,
          left: -180,
          opacity: 0.18,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-[1180px] px-8 max-[560px]:px-5">
        
        {/* Toggle Switch */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-full bg-white p-1.5 shadow-[0_2px_12px_rgba(11,18,32,0.06)] border border-[#E6E8EC]">
            <button
              onClick={() => setMode("b2c")}
              className={cn(
                "relative z-10 rounded-full px-5 py-2.5 text-[14.5px] font-semibold transition-all duration-300",
                mode === "b2c"
                  ? "bg-[#0e5f63] text-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#0B1220]"
              )}
            >
              Individual Filer
            </button>
            <button
              onClick={() => setMode("b2b")}
              className={cn(
                "relative z-10 rounded-full px-5 py-2.5 text-[14.5px] font-semibold transition-all duration-300",
                mode === "b2b"
                  ? "bg-[#0e5f63] text-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#0B1220]"
              )}
            >
              For Tax Professionals
            </button>
          </div>
        </div>

        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] max-[980px]:grid-cols-1 max-[980px]:gap-12">
          {/* Left copy */}
          <div>
            {mode === "b2c" ? (
              <>
                {/* B2C Content */}
                <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#E6E8EC] bg-white px-4 py-1.5 text-[13px] font-medium text-[#2B3344] shadow-sm">
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                    style={{ background: "#0B1220" }}
                  >
                    {ASSESSMENT_YEAR}
                  </span>
                  Launch offer · ₹349{" "}
                  <span style={{ textDecoration: "line-through", color: "#9CA3AF" }}>
                    ₹799
                  </span>
                </div>

                <h1
                  className="font-manrope font-bold tracking-[-0.02em] text-[#0B1220]"
                  style={{
                    fontSize: "clamp(34px, 4.2vw, 52px)",
                    lineHeight: 1.08,
                    marginBottom: 22,
                  }}
                >
                  File your ITR before the deadline —{" "}
                  <span style={{ color: "#0e5f63" }}>without the guesswork.</span>
                </h1>

                <p
                  style={{
                    fontSize: 17.5,
                    color: "#2B3344",
                    maxWidth: 480,
                    marginBottom: 32,
                    lineHeight: 1.6,
                  }}
                >
                  We reconcile Form 16, AIS, and 26AS, pick the cheaper tax
                  regime, and hand you a copy-ready guide. You file and e-verify
                  yourself, directly on incometax.gov.in.
                </p>

                <form
                  className="mb-9 flex max-w-sm flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    // Since it's B2C filing, send to register with name query param
                    window.location.href = `/auth/register?name=${encodeURIComponent(name)}`;
                  }}
                >
                  <div>
                    <label htmlFor="b2c-name" className="sr-only">
                      What should we call you?
                    </label>
                    <input
                      id="b2c-name"
                      name="name"
                      type="text"
                      required
                      placeholder="What should we call you? (e.g. Rahul)"
                      className="w-full rounded-[10px] border border-[#E6E8EC] px-4 py-3 text-[15px] outline-none transition-colors focus:border-[#0e5f63] focus:ring-1 focus:ring-[#0e5f63]"
                    />
                  </div>
                  <button type="submit" className="btn-pill-primary w-full justify-center">
                    Proceed to file
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <p className="text-center text-[12.5px] text-[#6B7280]">
                    Already have an account? <Link href="/auth/login" className="font-semibold text-[#0e5f63] hover:underline">Log in</Link>
                  </p>
                </form>

                <div className="mb-3.5 flex flex-wrap gap-2.5">
                  {[
                    {
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                          <path d="M8 1l5.5 2.2v4.3c0 4-2.5 6.6-5.5 7.5-3-0.9-5.5-3.5-5.5-7.5V3.2L8 1z" stroke="#0e5f63" strokeWidth="1.3"/>
                        </svg>
                      ),
                      label: "Lawful optimisation",
                    },
                    {
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                          <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="#0e5f63" strokeWidth="1.3"/>
                          <path d="M5 6V4a3 3 0 016 0v2" stroke="#0e5f63" strokeWidth="1.3"/>
                        </svg>
                      ),
                      label: "DPDP compliant",
                    },
                    {
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                          <circle cx="8" cy="8" r="6.5" stroke="#0e5f63" strokeWidth="1.3"/>
                          <path d="M5 8h6M11 8l-2-2M11 8l-2 2" stroke="#0e5f63" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ),
                      label: "No auto-submit",
                    },
                  ].map((chip) => (
                    <div
                      key={chip.label}
                      className="flex items-center gap-1.5 rounded-[8px] border border-[#E6E8EC] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#2B3344]"
                    >
                      {chip.icon}
                      {chip.label}
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 12.5, color: "#6B7280" }}>
                  Independently operated — not affiliated with the Income Tax
                  Department. Estimates only; ITD confirms your final refund.
                </p>
              </>
            ) : (
              <>
                {/* B2B Content */}
                <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#E6E8EC] bg-white px-4 py-1.5 text-[13px] font-medium text-[#2B3344] shadow-sm">
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                    style={{ background: "#0B1220" }}
                  >
                    B2B PARTNER
                  </span>
                  Exclusive CA Portal Access
                </div>

                <h1
                  className="font-manrope font-bold tracking-[-0.02em] text-[#0B1220]"
                  style={{
                    fontSize: "clamp(34px, 4.2vw, 52px)",
                    lineHeight: 1.08,
                    marginBottom: 22,
                  }}
                >
                  Scale your tax practice —{" "}
                  <span style={{ color: "#0e5f63" }}>automate the heavy lifting.</span>
                </h1>

                <p
                  style={{
                    fontSize: 17.5,
                    color: "#2B3344",
                    maxWidth: 480,
                    marginBottom: 32,
                    lineHeight: 1.6,
                  }}
                >
                  Join LastminuteITR’s partner program. Manage all your clients from a single dashboard, auto-read documents with AI, and optimize regimes instantly. Save hours per return.
                </p>

                <div className="mb-3.5 flex flex-col gap-2.5">
                  {[
                    { label: "AI Document Parsing (Form 16, AIS, 26AS)" },
                    { label: "Bulk Client Management Dashboard" },
                    { label: "Custom Branded Reports for Clients" },
                    { label: "Priority Expert Support" },
                  ].map((feature) => (
                    <div
                      key={feature.label}
                      className="flex items-center gap-3 text-[15px] font-medium text-[#2B3344]"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <circle cx="10" cy="10" r="10" fill="#F2F9E5" />
                        <path d="M6 10l3 3 5-6" stroke="#74A81F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {feature.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Component depending on mode */}
          {mode === "b2c" ? <RegimeComparatorHero /> : <CaRegistrationForm />}
        </div>
      </div>
    </header>
  );
}
