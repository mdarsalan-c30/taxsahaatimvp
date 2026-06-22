"use client";

import { useState, useCallback } from "react";

function fmtINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
function fmtLakh(n: number): string {
  if (n >= 100_000) return (n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1) + "L";
  return (n / 1000).toFixed(0) + "k";
}

function oldRegimeTax(income: number): number {
  // Standard deduction ₹50k + assumed 80C ₹1.5L = ₹2L
  let taxable = Math.max(0, income - 50_000 - 150_000);
  let tax = 0;
  if (taxable > 1_000_000) { tax += (taxable - 1_000_000) * 0.3; taxable = 1_000_000; }
  if (taxable > 500_000)   { tax += (taxable - 500_000) * 0.2; taxable = 500_000; }
  if (taxable > 250_000)   { tax += (taxable - 250_000) * 0.05; }
  tax = tax * 1.04; // 4% cess
  if (income - 50_000 - 150_000 <= 500_000) tax = 0; // 87A rebate
  return Math.max(0, tax);
}

function newRegimeTax(income: number): number {
  let taxable = Math.max(0, income - 75_000); // std deduction
  if (taxable <= 300_000) return 0;
  const slabs: [number, number][] = [
    [700_000, 0.05],
    [1_000_000, 0.10],
    [1_200_000, 0.15],
    [1_500_000, 0.20],
    [Infinity,  0.30],
  ];
  let prev = 300_000, tax = 0;
  for (const [limit, rate] of slabs) {
    if (taxable > prev) {
      tax += (Math.min(taxable, limit) - prev) * rate;
      prev = limit;
    }
  }
  tax = tax * 1.04;
  if (taxable <= 700_000) tax = 0; // 87A new regime
  return Math.max(0, tax);
}

export function RegimeComparatorHero() {
  const [income, setIncome] = useState(1_200_000);

  const ot = oldRegimeTax(income);
  const nt = newRegimeTax(income);
  const newWins = nt <= ot;
  const diff = Math.abs(ot - nt);

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIncome(parseInt(e.target.value, 10));
  }, []);

  return (
    <div
      className="w-full rounded-[24px] bg-white p-7"
      style={{
        border: "1px solid #E6E8EC",
        boxShadow: "0 24px 60px -24px rgba(11,18,32,.16), 0 2px 4px rgba(11,18,32,.04)",
      }}
    >
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <div>
          <span className="eyebrow-label" style={{ fontSize: 11.5 }}>Regime compare</span>
          <h3 className="font-manrope mt-1 text-[19px] font-bold tracking-[-0.01em] text-[#0B1220]">
            Old vs New tax
          </h3>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={{ background: "#F2F9E5", color: "#74A81F" }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#74A81F]"
            style={{ animation: "pulse 2s infinite" }}
          />
          Live · ₹{fmtLakh(income)}
        </div>
      </div>

      {/* Slider */}
      <div className="my-6">
        <div className="mb-2.5 flex justify-between text-[13px] text-[#6B7280]">
          <span>Annual salary</span>
          <strong className="text-[15px] text-[#0B1220]">{fmtINR(income)}</strong>
        </div>
        <input
          type="range"
          className="regime-slider"
          min={300_000}
          max={5_000_000}
          step={50_000}
          value={income}
          onChange={handleSlider}
          aria-label="Annual income"
        />
        <div className="mt-1.5 flex justify-between text-[11.5px] text-[#9CA3AF]">
          <span>₹3L</span>
          <span>₹50L</span>
        </div>
      </div>

      {/* Regime cards */}
      <div className="mb-4.5 grid grid-cols-2 gap-3">
        {/* Old */}
        <div
          className="relative rounded-[16px] border-[1.5px] px-4 py-4.5 text-center transition-all duration-300"
          style={{
            borderColor: newWins ? "#E6E8EC" : "#1D4ED8",
            background: newWins ? "#fff" : "linear-gradient(180deg, #EEF3FF, #fff)",
          }}
        >
          {!newWins && (
            <span
              className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white"
              style={{ background: "#1D4ED8" }}
            >
              CHEAPER
            </span>
          )}
          <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">Old regime</div>
          <div
            className="font-manrope my-2 text-[clamp(20px,5vw,26px)] font-extrabold transition-colors"
            style={{ color: newWins ? "#0B1220" : "#1D4ED8" }}
          >
            {fmtINR(ot)}
          </div>
          <div className="text-[11.5px] text-[#9CA3AF]">Tax payable</div>
        </div>

        {/* New */}
        <div
          className="relative rounded-[16px] border-[1.5px] px-4 py-4.5 text-center transition-all duration-300"
          style={{
            borderColor: newWins ? "#1D4ED8" : "#E6E8EC",
            background: newWins ? "linear-gradient(180deg, #EEF3FF, #fff)" : "#fff",
          }}
        >
          {newWins && (
            <span
              className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white"
              style={{ background: "#1D4ED8" }}
            >
              CHEAPER
            </span>
          )}
          <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6B7280]">New regime</div>
          <div
            className="font-manrope my-2 text-[clamp(20px,5vw,26px)] font-extrabold transition-colors"
            style={{ color: newWins ? "#1D4ED8" : "#0B1220" }}
          >
            {fmtINR(nt)}
          </div>
          <div className="text-[11.5px] text-[#9CA3AF]">Tax payable</div>
        </div>
      </div>

      {/* Savings banner */}
      <div
        className="flex items-start gap-2.5 rounded-[10px] px-3.5 py-3 text-[13.5px] text-[#2B3344] leading-[1.5]"
        style={{ background: "#F2F9E5" }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0" aria-hidden>
          <path d="M8 1l5.5 2.2v4.3c0 4-2.5 6.6-5.5 7.5-3-0.9-5.5-3.5-5.5-7.5V3.2L8 1z" stroke="#74A81F" strokeWidth="1.3"/>
          <path d="M5.5 8l1.8 1.8L10.5 6" stroke="#74A81F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>
          {newWins ? "New" : "Old"} regime saves you{" "}
          <strong style={{ color: "#74A81F", whiteSpace: "nowrap" }}>{fmtINR(diff)}</strong>
          {" "}— try the slider on your own number.
        </span>
      </div>
    </div>
  );
}
