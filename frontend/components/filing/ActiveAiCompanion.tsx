"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useDraftStore } from "@/lib/store/draft";
import { useDraftTaxCompute } from "@/lib/hooks/useDraftTaxCompute";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  MessageSquare,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  User,
  ArrowLeftRight,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

// Pre-coded expert answers for instant local replies to common tax questions
const LOCAL_TAX_KNOWLEDGE: Record<string, string> = {
  "how to get form 16?":
    "Form 16 is a TDS certificate issued by your employer by June 15th every year. It details your salary earned and tax deducted. Contact your HR or finance department to download it.",
  "is my data safe?":
    "Yes, completely. In compliance with the Indian DPDP Act 2025, your data is processed and stored locally in India. We never share your raw PII (like PAN or name) with external APIs.",
  "what is section 17(1)?":
    "Section 17(1) refers to your basic salary plus all allowances, bonus, and commissions. It is the raw gross salary figure before deductions. This must match the amount in Box 17(1) of your Form 16.",
  "what is standard deduction?":
    "Standard Deduction is a flat tax exemption of ₹75,000 (increased in latest budget) automatically deducted from your salary income under both Old and New Tax Regimes. You do not need to submit any rent bills or proofs to claim this.",
  "what is 80c limit?":
    "Under Section 80C, you can claim tax deductions up to ₹1,500,000 (1.5 Lakhs) per year. This includes payments for PPF, ELSS, Employee Provident Fund (EPF), life insurance premiums, and home loan principal repayments.",
  "can i claim rent without rent receipt?":
    "Yes, you can declare HRA exemption without uploading rent receipts initially. However, you must keep receipts and rent agreements safe, as the Income Tax Department may demand them later. If rent exceeds ₹1 Lakh annually, your landlord's PAN is mandatory.",
  "old vs new regime differences?":
    "The New Tax Regime has lower tax slabs but removes most deductions (like HRA, 80C, 24b). The Old Tax Regime has higher tax slabs but allows you to claim all deductions. We compare both in real-time to suggest the one that saves you the most money.",
  "what if there is a mismatch?":
    "If your Form 16 numbers differ from AIS/26AS, the tax department will flag it. We highlight mismatches in the Review tab. You should either ask your employer to correct their TDS return or file matching the official AIS details to prevent notices.",
  "how to avoid notices?":
    "Notice avoidance checklist: (1) Ensure gross salary matches Form 16, (2) Claim only genuine deductions backed by proofs, (3) Confirm all TDS entries match Form 26AS, (4) File your return before the July 31st deadline.",
  "how do i choose itr form?":
    "We select the form automatically: ITR-1 (for single salary + one house property), ITR-2 (salary + capital gains or multiple houses), and ITR-3/4 (if business/professional income is declared).",
};

export const FIELD_GUIDANCE: Record<string, { title: string; tip: string; impact: string }> = {
  employer: {
    title: "Employer Name",
    tip: "Enter the legal name of your employer as printed on your Form 16.",
    impact: "Must match the TAN details of your deductor to avoid mapping issues.",
  },
  gross_salary: {
    title: "Gross Salary (Sec 17(1))",
    tip: "Look at point 1(a) of your Form 16 Part B. This is your salary before any exemptions.",
    impact: "This is the primary base for your tax calculations. Direct impact on tax liability.",
  },
  tds: {
    title: "Tax Deducted (TDS)",
    tip: "Enter the total tax deducted by your employer. Confirm it matches the certified TDS total on Part A.",
    impact: "Directly reduces your final tax payable. Mismatches will block your refund.",
  },
  section80c: {
    title: "Section 80C Deductions",
    tip: "Combine your EPF, PPF, ELSS, life insurance, and school tuition fees here (Max ₹1,50,000).",
    impact: "Saves up to ₹46,800 in tax (at the 30% slab) under the Old Regime.",
  },
  section80d: {
    title: "Section 80D (Health Insurance)",
    tip: "Enter premiums paid for health insurance. Limit is ₹25,000 for self/family, plus ₹25,000/₹50,000 for parents.",
    impact: "Directly lowers your taxable income under the Old Regime.",
  },
  hra_received: {
    title: "HRA Received",
    tip: "Enter the total House Rent Allowance paid by your employer (usually in Box 10(13A) of Form 16).",
    impact: "Used to compute tax-exempt rent under the Old Regime.",
  },
  actual_rent_paid: {
    title: "Actual Rent Paid",
    tip: "Enter the total rent paid by you to your landlord during the year.",
    impact: "Essential for HRA exemption calculation. Higher rent can increase your tax savings.",
  },
  fd_interest: {
    title: "FD / Savings Interest",
    tip: "Check your bank statements for interest credited. Savings interest has a ₹10,000 deduction (80TTA).",
    impact: "Must be declared under 'Other Sources' to match bank reporting (SFT).",
  },
  home_loan_interest: {
    title: "Home Loan Interest (Sec 24b)",
    tip: "Enter the interest portion paid on your housing loan this year (Max ₹2,00,000 for self-occupied).",
    impact: "Significantly reduces taxable income under the Old Regime.",
  },
};

const STEP_GUIDANCE: Record<string, { banner: string; tips: string[] }> = {
  onboarding: {
    banner: "Let's set up your filing baseline. Answer these questions to determine the correct ITR Form.",
    tips: [
      "Select all your income sources (Salary, House, FD).",
      "Confirm your age group for correct tax slabs.",
      "Check senior citizen options for higher deductions.",
    ],
  },
  import: {
    banner: "Upload your Form 16 PDFs. I will automatically parse the tables and match them to TDS logs.",
    tips: [
      "If password-protected, the password is your PAN in CAPITALS.",
      "You can upload up to 5 PDFs if you changed jobs.",
      "We scan for digital signatures to ensure safety.",
    ],
  },
  income: {
    banner: "Verify your pre-filled income numbers. I have cross-checked them with your uploaded documents.",
    tips: [
      "Verify Gross Salary matches your Form 16 Box 17(1).",
      "Make sure TDS matches the amount credited in Form 26AS.",
      "Add any freelance/other income to avoid penalty interest.",
    ],
  },
  deductions: {
    banner: "Let's maximize your tax savings. I will check for unclaimed deductions.",
    tips: [
      "Confirm Section 80C contributions (PPF, LIC, PF).",
      "Declare preventive health checks under Section 80D.",
      "I'll automatically apply the standard deduction of ₹75,000.",
    ],
  },
  regime: {
    banner: "Comparing Old vs. New Tax Regimes. I've computed your exact savings.",
    tips: [
      "New regime has lower rates but allows no exemptions.",
      "Old regime is profitable if your total deductions exceed ₹4.25L.",
      "You can switch regimes every year if you have salary income.",
    ],
  },
  review: {
    banner: "Audit engine checklist is running. I am looking for mismatch signals.",
    tips: [
      "Green checks mean no critical differences with government logs.",
      "Double check salary entries if a mismatch is flagged.",
      "You can add a note to explain deviations and lock filing.",
    ],
  },
  checkout: {
    banner: "Select your helper package. Unlocks portal filing scripts and dedicated CA review support.",
    tips: [
      "Standard plan covers salary earners with Form 16.",
      "AI Smart plan includes real-time validation and AI Q&A.",
      "All plans include secure data retention for 7 years.",
    ],
  },
  companion: {
    banner: "Dual-screen assistant is active. Open incometax.gov.in in another tab.",
    tips: [
      "Follow the sequence of fields page by page.",
      "Use the copy button to copy numbers exactly.",
      "E-verify via Aadhaar OTP after clicking submit.",
    ],
  },
};

export function ActiveAiCompanion() {
  const pathname = usePathname();
  const activeField = useDraftStore((s) => s.activeField);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic step determination based on path
  const currentStep = pathname.startsWith("/file/onboarding")
    ? "onboarding"
    : pathname.startsWith("/file/import")
      ? "import"
      : pathname.startsWith("/file/income") ||
        pathname.startsWith("/file/house-property") ||
        pathname.startsWith("/file/other")
        ? "income"
        : pathname.startsWith("/file/deductions")
          ? "deductions"
          : pathname.startsWith("/file/regime")
            ? "regime"
            : pathname.startsWith("/file/review")
              ? "review"
              : pathname.startsWith("/file/checkout")
                ? "checkout"
                : pathname.startsWith("/file/companion")
                  ? "companion"
                  : "income";

  // Initial welcome message from the Genie when changing steps
  useEffect(() => {
    const stepGuide = STEP_GUIDANCE[currentStep];
    const initialText = activeField
      ? `I see you are focusing on the **${
          FIELD_GUIDANCE[activeField]?.title ?? activeField
        }** field. Let me explain: ${FIELD_GUIDANCE[activeField]?.tip ?? "Fill out this detail."}`
      : stepGuide?.banner ?? "I am ready to guide you. Ask me anything!";

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: initialText,
      },
    ]);
  }, [currentStep, activeField]);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Suggested questions based on the current step
  const suggestedQuestions = (() => {
    if (currentStep === "onboarding") return ["How do I choose ITR form?", "Can I file late?"];
    if (currentStep === "import") return ["Is my data safe?", "How to get Form 16?"];
    if (currentStep === "income") return ["What is Section 17(1)?", "What is Standard Deduction?"];
    if (currentStep === "deductions") return ["What is 80C limit?", "Can I claim rent without rent receipt?"];
    if (currentStep === "regime") return ["Old vs New regime differences?", "What is surcharge?"];
    if (currentStep === "review") return ["What if there is a mismatch?", "How to avoid notices?"];
    return ["Is my data safe?", "What is Standard Deduction?"];
  })();

  const handleSendQuestion = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      text: question.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    const normalizedQuestion = question.toLowerCase().trim();

    // Check local database for instant reply
    if (LOCAL_TAX_KNOWLEDGE[normalizedQuestion]) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `genie_${Date.now()}`,
            role: "assistant",
            text: LOCAL_TAX_KNOWLEDGE[normalizedQuestion],
          },
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    // Call API fallback for other/custom questions
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question, sessionId: "genie_session" }),
      });
      if (res.ok) {
        const data = await res.json();
        // Take last response from message array
        const responseText = data.messages?.[data.messages.length - 1]?.text ?? "I'm checking that for you.";
        setMessages((prev) => [
          ...prev,
          {
            id: `genie_${Date.now()}`,
            role: "assistant",
            text: responseText,
          },
        ]);
      } else {
        throw new Error();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `genie_${Date.now()}`,
          role: "assistant",
          text: "I couldn't reach the tax network. Under Section 80C, you can claim up to ₹1.5L, and Section 17(1) is your gross salary. Please review your Form 16.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentFieldGuidance = activeField ? FIELD_GUIDANCE[activeField] : null;
  const currentStepGuidance = STEP_GUIDANCE[currentStep];

  return (
    <div className="flex flex-col h-full bg-slate-50/20 border-l border-slate-100/80">
      {/* 1. Genie Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white">
        <div className="relative">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 relative overflow-hidden">
            <Sparkles className="size-4 animate-pulse text-blue-100" />
            {/* Pulsing glow overlay */}
            <span className="absolute inset-0 bg-blue-400/10 rounded-xl animate-ping" />
          </div>
          <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            TaxSaathi Genie
          </h4>
          <p className="text-[10px] text-slate-500">Active filing assistant</p>
        </div>
      </div>

      {/* 2. Main Guidance Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Active Input Genie Card */}
        {activeField && currentFieldGuidance ? (
          <div className="bg-gradient-to-br from-blue-50/70 to-blue-50/30 border border-blue-100/60 rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Sparkling corner effect */}
            <span className="absolute right-2 top-2 text-blue-400 opacity-20">
              <Sparkles className="size-8" />
            </span>
            <div className="flex items-start gap-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                i
              </span>
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Focused Field Guide
                </h5>
                <p className="text-sm font-semibold text-slate-900">
                  {currentFieldGuidance.title}
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-700 leading-relaxed bg-white/70 rounded-xl p-3 border border-blue-50/50">
              {currentFieldGuidance.tip}
            </p>
            
            <div className="text-[11px] text-blue-800 bg-blue-100/30 rounded-lg p-2.5 flex gap-2">
              <Lightbulb className="size-3.5 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <strong className="font-semibold text-blue-900">Tax Impact:</strong> {currentFieldGuidance.impact}
              </div>
            </div>
          </div>
        ) : (
          /* Step guidance (if no field is focused) */
          currentStepGuidance && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4.5 text-blue-500" />
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step Tips
                </h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentStepGuidance.banner}
              </p>
              <ul className="space-y-2 pt-1.5 border-t border-slate-50">
                {currentStepGuidance.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-500 leading-relaxed">
                    <span className="text-blue-500 font-semibold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}

        {/* 3. Conversation Thread */}
        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
            Genie Chat & Q&A
          </p>
          <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm min-h-48 flex flex-col justify-between gap-3">
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl p-2.5 max-w-[90%] leading-relaxed",
                    msg.role === "user"
                      ? "bg-slate-100 text-slate-900 self-end ml-auto"
                      : "bg-blue-50/50 text-slate-700 border border-blue-100/20 self-start mr-auto"
                  )}
                >
                  <p className="font-medium text-[10px] uppercase text-slate-400">
                    {msg.role === "user" ? "You" : "Genie"}
                  </p>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              ))}
              {loading && (
                <div className="bg-blue-50/30 text-slate-500 border border-blue-100/10 rounded-xl p-2.5 max-w-[90%] self-start mr-auto animate-pulse">
                  Genie is writing…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Question Chips */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50 shrink-0">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendQuestion(q)}
                  className="text-[10px] font-medium text-blue-600 bg-blue-50/50 hover:bg-blue-50 hover:text-blue-700 border border-blue-100/40 rounded-lg px-2 py-1 text-left transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuestion(inputText);
        }}
        className="p-3 border-t border-slate-100 bg-white"
      >
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Genie a question…"
            className="flex-1 min-w-0 bg-transparent text-xs text-slate-900 focus:outline-none placeholder:text-slate-400 py-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="size-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
