"use client";

import { useDraftStore } from "@/lib/store/draft";
import { FilingLayout } from "@/components/filing/FilingLayout";
import { PlainEnglishHelp } from "@/components/filing/PlainEnglishHelp";
import { PlainEnglishField } from "@/components/filing/PlainEnglishField";
import { WhyWeAskHint } from "@/components/filing/WhyWeAskHint";
import { WHY_WE_ASK } from "@/lib/copy/trust";
import { FILING_DEDUCTIONS } from "@/lib/copy/filing";
import {
  Button,
  FilingActions,
  RiskBadge,
  ScreenTitle,
} from "@/components/filing/ui";
import { PiggyBank, ShieldAlert, Sparkles, ReceiptText } from "lucide-react";

export default function DeductionsPage() {
  const { deductions, setDeductions } = useDraftStore();

  const handleUpdate80C = (val: string) => {
    setDeductions({ section80C: Number(val) || 0 });
  };

  const handleUpdate80D = (val: string) => {
    setDeductions({ section80D: Number(val) || 0 });
  };

  const handleUpdateNps = (val: string) => {
    setDeductions({ npsExtra: Number(val) || 0 });
  };

  const handleUpdate80GG = (val: string) => {
    setDeductions({ section80GG: Number(val) || 0 });
  };

  return (
    <FilingLayout
      showNavRail
      activeNavSection="deductions"
      mirrorText="Only claim deductions you actually made and can prove. Inflated 80C or fake rent claims are common reasons for scrutiny notices."
    >
      <div className="space-y-6">
        {/* Header */}
        <ScreenTitle
          title={FILING_DEDUCTIONS.title}
          subtitle={FILING_DEDUCTIONS.subtitle}
        />

        <PlainEnglishHelp
          summary="Deductions reduce tax only when they are real and supported by proof."
          points={[
            "Enter what you actually paid during the financial year.",
            "80C covers common tax-saving investments like PF, PPF, and ELSS.",
            "80D is health insurance premium paid by you.",
            "If you do not have proof, do not claim that deduction.",
          ]}
        />

        <WhyWeAskHint className="mb-2">{WHY_WE_ASK.deductions}</WhyWeAskHint>

        {/* Deductions Interactive Form */}
        <div className="bg-slate-50/20 border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100/80 flex items-center gap-2">
            <PiggyBank className="size-4.5 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Tax-Saving Exemptions (Old Regime Only)
            </h3>
          </div>

          {/* 1. Section 80C */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start border-b border-slate-50 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-850">Section 80C Investments</span>
                <RiskBadge variant="green">Standard</RiskBadge>
              </div>
              <p className="text-xs text-slate-500">Includes EPF, PPF, ELSS mutual funds, LIC premiums, and home loan principal repayments.</p>
            </div>
            <div className="w-full md:w-48">
              <PlainEnglishField
                govLabel="Deduction in respect of life insurance premia, contributions to provident fund etc. under section 80C"
                simpleLabel="80C Total"
                placeholder="0"
                type="number"
                fieldId="section80c"
                value={deductions.section80C ? String(deductions.section80C) : ""}
                onChange={handleUpdate80C}
              />
            </div>
          </div>

          {/* 2. Section 80D */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start border-b border-slate-50 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-850">Section 80D Health Insurance</span>
                <RiskBadge variant="yellow">Proof needed</RiskBadge>
              </div>
              <p className="text-xs text-slate-500">Premiums paid for health insurance policies for self, spouse, children, or parents.</p>
            </div>
            <div className="w-full md:w-48">
              <PlainEnglishField
                govLabel="Deduction in respect of health insurance premia under section 80D"
                simpleLabel="80D Total"
                placeholder="0"
                type="number"
                fieldId="section80d"
                value={deductions.section80D ? String(deductions.section80D) : ""}
                onChange={handleUpdate80D}
              />
            </div>
          </div>

          {/* 3. Section NPS Extra */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start border-b border-slate-50 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-850">NPS Extra (Section 80CCD(1B))</span>
                <RiskBadge variant="yellow">Proof needed</RiskBadge>
              </div>
              <p className="text-xs text-slate-500">Additional contribution to National Pension System (NPS) up to ₹50,000.</p>
            </div>
            <div className="w-full md:w-48">
              <PlainEnglishField
                govLabel="Deduction in respect of contribution to pension scheme of Central Government under section 80CCD(1B)"
                simpleLabel="NPS Extra"
                placeholder="0"
                type="number"
                fieldId="nps_extra"
                value={deductions.npsExtra ? String(deductions.npsExtra) : ""}
                onChange={handleUpdateNps}
              />
            </div>
          </div>

          {/* 4. Section 80GG */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start border-b border-slate-50 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-850">Section 80GG House Rent</span>
                <RiskBadge variant="yellow">Proof needed</RiskBadge>
              </div>
              <p className="text-xs text-slate-500">Rent paid if you do not receive any HRA from your employer (no HRA component in pay).</p>
            </div>
            <div className="w-full md:w-48">
              <PlainEnglishField
                govLabel="Deduction in respect of rents paid under section 80GG"
                simpleLabel="80GG Total"
                placeholder="0"
                type="number"
                fieldId="actual_rent_paid"
                value={deductions.section80GG ? String(deductions.section80GG) : ""}
                onChange={handleUpdate80GG}
              />
            </div>
          </div>

          {/* 5. Invented Expense Block */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center opacity-50 bg-slate-50/50 p-3.5 rounded-xl border border-dashed border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-550 flex items-center gap-1.5">
                  <ShieldAlert className="size-4 text-red-500" />
                  Invented Expense Patterns
                </span>
                <RiskBadge variant="red">Blocked</RiskBadge>
              </div>
              <p className="text-xs text-slate-500">Fake donations (80G) or standard deduction inflation is blocked to prevent processing bans.</p>
            </div>
            <Button variant="ghost" disabled className="text-xs font-semibold px-3 py-1">
              Protected
            </Button>
          </div>
        </div>

        {/* Navigation Actions */}
        <FilingActions>
          <Button href="/file/regime" className="w-full sm:w-auto">
            Save & Continue
          </Button>
        </FilingActions>
      </div>
    </FilingLayout>
  );
}
