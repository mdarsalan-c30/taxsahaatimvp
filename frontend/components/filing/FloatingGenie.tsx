"use client";

import { useState, useEffect } from "react";
import { useDraftStore } from "@/lib/store/draft";
import { formatINR } from "@/lib/format";
import {
  Sparkles,
  Calculator,
  X,
  Plus,
  ArrowRight,
  Check,
  PiggyBank,
  Info,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

interface GenieGuidance {
  title: string;
  desc: string;
  placeholderText?: string;
  helperText?: string;
  engineRule?: string;
  hasCalculator?: "hra" | "section80c" | "nps";
}

const GENIE_FIELDS_GUIDE: Record<string, GenieGuidance> = {
  employer: {
    title: "Employer Name",
    desc: "Type the legal name of your company. This must match the name on your Form 16.",
    engineRule: "Used to cross-reference with TDS logs (Form 26AS/AIS) to ensure compliance.",
  },
  gross_salary: {
    title: "Gross Salary",
    desc: "Your total salary income under Section 17(1). Check Box 17(1) of your Form 16 Part B.",
    engineRule: "Standard deduction of ₹75,000 (New Regime) or ₹50,000 (Old Regime) will be auto-applied.",
  },
  tds: {
    title: "Tax Deducted (TDS)",
    desc: "Total tax already cut by your employer. Confirm it matches certified TDS Part A logs.",
    engineRule: "Mismatches between entered TDS and Form 26AS/AIS will flag an audit notice alert.",
  },
  hra_received: {
    title: "HRA Allowance Received",
    desc: "House Rent Allowance paid by your employer. Typically shown in your salary breakdown (Box 10(13A)).",
    hasCalculator: "hra",
    engineRule: "Exempt only under the Old Tax Regime. Tax engine computes the exempt amount in real-time.",
  },
  actual_rent_paid: {
    title: "Actual Rent Paid",
    desc: "The total amount of rent you paid to your landlord during the financial year.",
    hasCalculator: "hra",
    engineRule: "If rent exceeds ₹1 Lakh annually, your landlord's PAN is mandatory to prevent audit flags.",
  },
  section80c: {
    title: "Section 80C Deductions",
    desc: "Claim tax deductions up to ₹1,50,000 for EPF, PPF, ELSS, LIC, and school fees.",
    hasCalculator: "section80c",
    engineRule: "Maximum allowed cap is ₹1,50,000. Saves up to ₹46,800 in tax (at the 30% slab) under the Old Regime.",
  },
  section80d: {
    title: "Section 80D (Health Insurance)",
    desc: "Declare medical insurance premiums. Claims are allowed for self, family, and parents.",
    engineRule: "Limit is ₹25,000 for self/spouse/kids, plus another ₹25,000 (or ₹50,000 for senior citizens) for parents.",
  },
  nps_extra: {
    title: "NPS Extra (Section 80CCD(1B))",
    desc: "Additional self-contribution to National Pension System (NPS) Tier 1.",
    engineRule: "Saves tax on an extra ₹50,000, completely over-and-above the ₹1.5 Lakh limit of Section 80C.",
  },
  actual_rent_paid_80gg: {
    title: "Rent Paid (No HRA received)",
    desc: "Rent paid if you do not receive HRA from your employer. Claimable under Section 80GG.",
    engineRule: "Deduction is capped at the least of: ₹5,000/month, 25% of total income, or Rent minus 10% of adjusted income.",
  },
  fd_interest: {
    title: "Fixed Deposit & Savings Interest",
    desc: "Total interest income earned from banks, post office, or cooperative societies.",
    engineRule: "We automatically apply Section 80TTA (up to ₹10,000 for standard) or 80TTB (up to ₹50,000 for seniors).",
  },
  annualRent: {
    title: "Annual Rental Income",
    desc: "Gross rent received from letting out your owned house property to a tenant.",
    engineRule: "A standard deduction of 30% is automatically subtracted for maintenance before taxing.",
  },
  homeLoanInterest: {
    title: "Home Loan Interest (Section 24b)",
    desc: "Interest portion of your home loan repayment. Look at your bank interest certificate.",
    engineRule: "Deduction capped at ₹2,00,000 for self-occupied properties. No cap for let-out properties.",
  },
  municipalTax: {
    title: "Municipal Property Tax Paid",
    desc: "Local body property tax actually paid by you during the financial year.",
    engineRule: "Directly deductible from gross rental income, reducing net taxable property income.",
  },
  coOwnerPercent: {
    title: "Co-Ownership Share (%)",
    desc: "Your share of ownership in this property. e.g. 100% if sole owner, 50% if owned half-half.",
    engineRule: "All property incomes, taxes, and loan interest calculations will be scaled by this share.",
  },
  propertyType: {
    title: "Property Occupancy Type",
    desc: "Select Self-occupied if you live in it, or Let-out if you rent it out to tenants.",
    engineRule: "Triggers Section 24b limits (₹2L cap for self-occupied, unlimited for let-out).",
  },
};

export function FloatingGenie() {
  const activeField = useDraftStore((s) => s.activeField);
  const income = useDraftStore((s) => s.income);
  const deductions = useDraftStore((s) => s.deductions);
  const setIncome = useDraftStore((s) => s.setIncome);
  const setDeductions = useDraftStore((s) => s.setDeductions);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"guide" | "calculator">("guide");

  useEffect(() => {
    const saved = localStorage.getItem("genie_open");
    if (saved === "true") {
      setIsOpen(true);
    } else if (saved === "false") {
      setIsOpen(false);
    } else {
      setIsOpen(false);
    }
  }, []);

  // Drag-and-drop states
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({ x: clientX, y: clientY });
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = Math.abs(e.clientX - dragStart.x);
      const dy = Math.abs(e.clientY - dragStart.y);
      if (dx > 4 || dy > 4) {
        setDragMoved(true);
      }
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - dragStart.x);
      const dy = Math.abs(touch.clientY - dragStart.y);
      if (dx > 4 || dy > 4) {
        setDragMoved(true);
      }
      setPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });
    };

    const handleEndDrag = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEndDrag);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleEndDrag);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEndDrag);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEndDrag);
    };
  }, [isDragging, dragStart, dragOffset]);

  const handleButtonRelease = () => {
    if (!dragMoved) {
      setIsOpen(true);
      localStorage.setItem("genie_open", "true");
    }
  };

  // HRA Calculator inputs
  const [hraSalary, setHraSalary] = useState(
    income.grossSalary ? String(Math.round(income.grossSalary * 0.5)) : "0"
  );
  const [hraReceived, setHraReceived] = useState(income.hraReceived ? String(income.hraReceived) : "0");
  const [hraRent, setHraRent] = useState(income.actualRentPaid ? String(income.actualRentPaid) : "0");
  const [hraCityTier, setHraCityTier] = useState<"metro" | "non_metro">(
    income.cityTier || "metro"
  );
  const [hraResult, setHraResult] = useState<{
    exempt: number;
    taxable: number;
    rule1: number;
    rule2: number;
    rule3: number;
  } | null>(null);

  // 80C sum builder inputs
  const [epf, setEpf] = useState("0");
  const [ppf, setPpf] = useState("0");
  const [elss, setElss] = useState("0");
  const [lic, setLic] = useState("0");
  const [homeLoanPrincipal, setHomeLoanPrincipal] = useState("0");
  const [tuitionFees, setTuitionFees] = useState("0");
  const [sum80C, setSum80C] = useState(0);

  // Set default tabs and sync calculator states on field change
  useEffect(() => {
    if (activeField) {
      const fieldData = GENIE_FIELDS_GUIDE[activeField];
      if (fieldData?.hasCalculator) {
        setActiveTab("calculator");
      } else {
        setActiveTab("guide");
      }
    }
  }, [activeField]);

  // Recalculate HRA exemption locally
  useEffect(() => {
    const basic = Number(hraSalary) || 0;
    const rec = Number(hraReceived) || 0;
    const rent = Number(hraRent) || 0;

    const rule1 = rec;
    const rule2 = hraCityTier === "metro" ? basic * 0.5 : basic * 0.4;
    const rule3 = Math.max(0, rent - basic * 0.1);
    const exempt = Math.min(rule1, rule2, rule3);
    const taxable = Math.max(0, rec - exempt);

    setHraResult({
      exempt,
      taxable,
      rule1,
      rule2,
      rule3,
    });
  }, [hraSalary, hraReceived, hraRent, hraCityTier]);

  // Recalculate 80C total
  useEffect(() => {
    const total =
      (Number(epf) || 0) +
      (Number(ppf) || 0) +
      (Number(elss) || 0) +
      (Number(lic) || 0) +
      (Number(homeLoanPrincipal) || 0) +
      (Number(tuitionFees) || 0);
    setSum80C(Math.min(150000, total));
  }, [epf, ppf, elss, lic, homeLoanPrincipal, tuitionFees]);

  const handleApplyHra = () => {
    if (hraResult) {
      setIncome({
        hraReceived: Number(hraReceived) || 0,
        actualRentPaid: Number(hraRent) || 0,
        cityTier: hraCityTier,
      });
      // Set activeTab back to guide or show success
      setActiveTab("guide");
    }
  };

  const handleApply80C = () => {
    setDeductions({
      section80C: sum80C,
    });
    setActiveTab("guide");
  };

  // If no field is focused, show general status
  const currentGuidance = activeField ? GENIE_FIELDS_GUIDE[activeField] : null;

  if (!isOpen) {
    return (
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseUp={handleButtonRelease}
        onTouchEnd={handleButtonRelease}
        style={{ transform: `translate(${position.x}px, calc(-50% + ${position.y}px))` }}
        className="fixed top-1/2 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all select-none cursor-grab active:cursor-grabbing"
        aria-label="Open Tax Genie"
      >
        <Sparkles className="size-5 text-white animate-pulse" />
        <span className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping pointer-events-none" />
      </button>
    );
  }

  return (
    <div
      style={{ transform: `translate(${position.x}px, calc(-50% + ${position.y}px))` }}
      className="fixed top-1/2 right-6 z-40 max-w-sm w-[calc(100vw-3rem)] rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right-5"
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between text-white select-none cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="flex size-7 items-center justify-center rounded-lg bg-white/20">
            <Sparkles className="size-4 animate-pulse text-blue-100" />
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Super Genie Helper</h4>
            <p className="text-[10px] text-blue-100/80">Interactive input assistant</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            localStorage.setItem("genie_open", "false");
          }}
          className="p-1 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto scrollbar-thin">
        {currentGuidance ? (
          <div className="space-y-3">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">{currentGuidance.title}</span>
              {currentGuidance.hasCalculator && (
                <div className="flex gap-1.5 bg-slate-50 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab("guide")}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                      activeTab === "guide"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Guide
                  </button>
                  <button
                    onClick={() => setActiveTab("calculator")}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                      activeTab === "calculator"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Calculator className="size-3" />
                    Calculator
                  </button>
                </div>
              )}
            </div>

            {/* TAB CONTENT: Guide */}
            {activeTab === "guide" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/20 border border-blue-100/20 rounded-xl p-3">
                  {currentGuidance.desc}
                </p>

                {currentGuidance.engineRule && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex gap-2">
                    <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Engine Computation Rule</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{currentGuidance.engineRule}</p>
                    </div>
                  </div>
                )}

                {/* Direct Action Helpers */}
                {activeField === "section80c" && (
                  <button
                    onClick={() => {
                      setDeductions({ section80C: 150000 });
                      setActiveTab("guide");
                    }}
                    className="w-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="size-3.5" />
                    Claim Max 80C (₹1.5 Lakhs)
                  </button>
                )}
                {activeField === "section80d" && (
                  <button
                    onClick={() => {
                      setDeductions({ section80D: 25000 });
                      setActiveTab("guide");
                    }}
                    className="w-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="size-3.5" />
                    Claim Self Premium Limit (₹25k)
                  </button>
                )}
                {activeField === "nps_extra" && (
                  <button
                    onClick={() => {
                      setDeductions({ npsExtra: 50000 });
                      setActiveTab("guide");
                    }}
                    className="w-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="size-3.5" />
                    Apply Max NPS extra (₹50k)
                  </button>
                )}
              </div>
            )}

            {/* TAB CONTENT: Calculator */}
            {activeTab === "calculator" && currentGuidance.hasCalculator === "hra" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enter salary details to compute tax-exempt HRA under Section 10(13A).
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Basic Salary (Annual)
                    </label>
                    <input
                      type="number"
                      value={hraSalary}
                      onChange={(e) => setHraSalary(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      HRA Component
                    </label>
                    <input
                      type="number"
                      value={hraReceived}
                      onChange={(e) => setHraReceived(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Annual Rent Paid
                    </label>
                    <input
                      type="number"
                      value={hraRent}
                      onChange={(e) => setHraRent(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      City of Residence
                    </label>
                    <select
                      value={hraCityTier}
                      onChange={(e) => setHraCityTier(e.target.value as "metro" | "non_metro")}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="metro">Metro (Delhi/Mumbai/etc.)</option>
                      <option value="non_metro">Non-Metro City</option>
                    </select>
                  </div>
                </div>

                {hraResult && (
                  <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-3 space-y-1.5 text-xs text-blue-950">
                    <div className="flex justify-between font-bold border-b border-blue-100 pb-1 mb-1">
                      <span>Exempt HRA (Tax Free):</span>
                      <span className="text-emerald-600">{formatINR(hraResult.exempt)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Taxable HRA portion:</span>
                      <span>{formatINR(hraResult.taxable)}</span>
                    </div>
                    <div className="text-[10px] text-blue-800 leading-normal pt-1 space-y-0.5">
                      <p>• Actual HRA: {formatINR(hraResult.rule1)}</p>
                      <p>• {hraCityTier === "metro" ? "50%" : "40%"} of Basic: {formatINR(hraResult.rule2)}</p>
                      <p>• Rent paid - 10% Basic: {formatINR(hraResult.rule3)}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleApplyHra}
                  className="w-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="size-4" />
                  Apply HRA Exemption details
                </button>
              </div>
            )}

            {/* TAB CONTENT: Calculator 80C */}
            {activeTab === "calculator" && currentGuidance.hasCalculator === "section80c" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Sum up your individual investments. We will cap it at the ₹1,50,000 maximum.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      EPF (Provident Fund)
                    </label>
                    <input
                      type="number"
                      value={epf}
                      onChange={(e) => setEpf(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      PPF (Public Provident)
                    </label>
                    <input
                      type="number"
                      value={ppf}
                      onChange={(e) => setPpf(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      ELSS Mutual Funds
                    </label>
                    <input
                      type="number"
                      value={elss}
                      onChange={(e) => setElss(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      LIC Premium
                    </label>
                    <input
                      type="number"
                      value={lic}
                      onChange={(e) => setLic(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Home Loan Principal
                    </label>
                    <input
                      type="number"
                      value={homeLoanPrincipal}
                      onChange={(e) => setHomeLoanPrincipal(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      School Tuition Fees
                    </label>
                    <input
                      type="number"
                      value={tuitionFees}
                      onChange={(e) => setTuitionFees(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="font-semibold text-blue-900">Total Deductible Sum:</span>
                  <span className="font-bold text-emerald-600">{formatINR(sum80C)}</span>
                </div>

                <button
                  onClick={handleApply80C}
                  className="w-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="size-4" />
                  Apply 80C Deduction Total
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3 animate-in fade-in duration-200">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-2 relative">
              <Sparkles className="size-6 animate-pulse" />
              <span className="absolute inset-0 bg-blue-200/20 rounded-full animate-ping" />
            </div>
            <p className="text-xs font-semibold text-slate-800">Hello filing partner!</p>
            <p className="text-[11px] text-slate-500 leading-normal max-w-[240px] mx-auto">
              Select or click any input field in the middle workspace, and I will hover here to navigate you with calculators, tips, and engine rules in real-time.
            </p>
          </div>
        )}
      </div>

      {/* Footer branding */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3 text-emerald-500" />
          Indian Tax Law Compliant
        </span>
        <span>v2.1</span>
      </div>
    </div>
  );
}
