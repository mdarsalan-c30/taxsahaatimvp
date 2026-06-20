"use client";

import { useDraftStore } from "@/lib/store/draft";
import { FilingLayout } from "@/components/filing/FilingLayout";
import { PlainEnglishField } from "@/components/filing/PlainEnglishField";
import {
  Button,
  FilingActions,
  ScreenTitle,
} from "@/components/filing/ui";
import { WhyWeAskHint } from "@/components/filing/WhyWeAskHint";
import { WHY_WE_ASK } from "@/lib/copy/trust";
import { FILING_INCOME } from "@/lib/copy/filing";
import { Landmark, Briefcase, ShieldCheck } from "lucide-react";

export default function IncomePage() {
  const { income, setIncome } = useDraftStore();

  return (
    <FilingLayout
      showNavRail
      activeNavSection="salary"
      mirrorText="Salary details from Form 16 are pre-filled if you uploaded a PDF. Review and edit any numbers that do not match your payslip."
    >
      <div className="space-y-6">
        {/* Title & Subtitle */}
        <ScreenTitle
          title={FILING_INCOME.title}
          subtitle={FILING_INCOME.subtitle}
        />

        <WhyWeAskHint className="mb-2">{WHY_WE_ASK.salaryConfirm}</WhyWeAskHint>

        {/* Interactive Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 bg-slate-50/20 border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm">
          {/* Section Heading */}
          <div className="col-span-1 md:col-span-2 pb-3 mb-4 border-b border-slate-100/80 flex items-center gap-2">
            <Briefcase className="size-4.5 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Employer & Salary Income
            </h3>
          </div>

          <div className="col-span-1 md:col-span-2">
            <PlainEnglishField
              govLabel="Name and address of the Employer/Deductor"
              simpleLabel="Employer Name"
              placeholder="e.g. Google India Pvt Ltd"
              fieldId="employer"
              value={income.employer || ""}
              onChange={(v) => setIncome({ employer: v })}
              helper="Your company name as registered under the IT Department."
            />
          </div>

          <PlainEnglishField
            govLabel="Salary as per provisions contained in section 17(1)"
            simpleLabel="Gross Salary"
            placeholder="0"
            type="number"
            fieldId="gross_salary"
            value={income.grossSalary ? String(income.grossSalary) : ""}
            onChange={(v) => setIncome({ grossSalary: Number(v) || 0 })}
            helper="Basic pay, dearness allowance, and taxable perks."
          />

          <PlainEnglishField
            govLabel="Total Tax Deducted at Source (TDS)"
            simpleLabel="Tax Deducted (TDS)"
            placeholder="0"
            type="number"
            fieldId="tds"
            value={income.tds ? String(income.tds) : ""}
            onChange={(v) => setIncome({ tds: Number(v) || 0 })}
            helper="The tax already cut by your employer."
          />

          {/* House Rent Allowance Exemption Section */}
          <div className="col-span-1 md:col-span-2 pb-3 mb-4 mt-6 border-b border-slate-100/80 flex items-center gap-2">
            <Landmark className="size-4.5 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              House Rent Allowance (HRA) Exemption
            </h3>
          </div>

          <PlainEnglishField
            govLabel="Allowance under section 10(13A) received from employer"
            simpleLabel="HRA Received"
            placeholder="0"
            type="number"
            fieldId="hra_received"
            value={income.hraReceived ? String(income.hraReceived) : ""}
            onChange={(v) => setIncome({ hraReceived: Number(v) || 0 })}
            helper="HRA component shown in your salary breakup."
          />

          <PlainEnglishField
            govLabel="Actual Rent Paid for Accommodation"
            simpleLabel="Actual Rent Paid"
            placeholder="0"
            type="number"
            fieldId="actual_rent_paid"
            value={income.actualRentPaid ? String(income.actualRentPaid) : ""}
            onChange={(v) => setIncome({ actualRentPaid: Number(v) || 0 })}
            helper="Total rent paid to your landlord during the year."
          />
        </div>

        {/* Audit Safe Info Box */}
        <div className="flex gap-3 bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-4 text-xs text-emerald-800 leading-normal">
          <ShieldCheck className="size-4.5 shrink-0 text-emerald-600 mt-0.5" />
          <p>
            {FILING_INCOME.auditBanner}
          </p>
        </div>

        {/* Navigation Actions */}
        <FilingActions>
          <Button href="/file/house-property" className="w-full sm:w-auto">
            Save & Continue
          </Button>
          <Button href="/file/import/documents?source=form16" variant="secondary" className="w-full sm:w-auto">
            Upload another Form 16
          </Button>
        </FilingActions>
      </div>
    </FilingLayout>
  );
}
