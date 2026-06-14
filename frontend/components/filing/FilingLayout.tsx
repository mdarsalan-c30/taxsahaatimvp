"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useDraftStore } from "@/lib/store/draft";
import { useDraftTaxCompute } from "@/lib/hooks/useDraftTaxCompute";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getIncomeSectionStatuses, statusDotClass } from "@/lib/filing/navStatus";
import { ProfileNavLink } from "@/components/marketing/ProfileNavLink";
import { ActiveAiCompanion } from "./ActiveAiCompanion";
import {
  UserCheck,
  UploadCloud,
  Coins,
  PiggyBank,
  GitCompare,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  FileText,
  Menu,
  X,
  Check,
  ChevronRight,
  HelpCircle,
  BookOpen,
  Wrench,
  LogOut,
  Sparkles,
} from "lucide-react";

const SIDEBAR_STEPS = [
  {
    id: "onboarding",
    label: "Get Started",
    href: "/file/onboarding/eligibility?step=about-you",
    match: ["/file/onboarding"],
    icon: UserCheck,
  },
  {
    id: "import",
    label: "Import Documents",
    href: "/file/import/documents",
    match: ["/file/import/documents", "/file/import/parsing"],
    icon: UploadCloud,
  },
  {
    id: "income",
    label: "Income Details",
    href: "/file/income",
    match: [
      "/file/income",
      "/file/house-property",
      "/file/other",
      "/file/import/mismatch",
      "/file/import/tds",
      "/file/import/bank",
    ],
    icon: Coins,
    subItems: [
      { id: "salary", label: "Salary details", href: "/file/income", statusKey: "salary" as const },
      { id: "house", label: "House property", href: "/file/house-property", statusKey: "house" as const },
      { id: "other", label: "Other sources", href: "/file/other", statusKey: "other" as const },
    ],
  },
  {
    id: "deductions",
    label: "Deductions (80C/80D)",
    href: "/file/deductions",
    match: ["/file/deductions"],
    icon: PiggyBank,
  },
  {
    id: "regime",
    label: "Tax Regime",
    href: "/file/regime",
    match: ["/file/regime", "/file/cabrain"],
    icon: GitCompare,
  },
  {
    id: "review",
    label: "Audit & Review",
    href: "/file/review",
    match: ["/file/review"],
    icon: ShieldCheck,
  },
  {
    id: "checkout",
    label: "Plans & Pay",
    href: "/file/checkout/plans",
    match: ["/file/checkout"],
    icon: CreditCard,
  },
  {
    id: "companion",
    label: "File on Portal",
    href: "/file/companion",
    match: ["/file/companion", "/file/support"],
    icon: ExternalLink,
  },
];

const SUMMARY_PATH_PREFIXES = [
  "/file/import",
  "/file/income",
  "/file/house-property",
  "/file/other",
  "/file/deductions",
  "/file/regime",
  "/file/review",
  "/file/checkout",
];

function shouldShowSummaryRail(pathname: string): boolean {
  return SUMMARY_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

function isStepActive(step: typeof SIDEBAR_STEPS[number], pathname: string, activeNavSection?: string) {
  if (activeNavSection && step.id === activeNavSection) return true;
  return step.match.some((m) => pathname.startsWith(m));
}

function isSubItemActive(subId: string, pathname: string, activeNavSection?: string) {
  if (activeNavSection && subId === activeNavSection) return true;
  if (subId === "salary" && pathname.startsWith("/file/income")) return true;
  if (subId === "house" && pathname.startsWith("/file/house-property")) return true;
  if (subId === "other" && pathname.startsWith("/file/other")) return true;
  return false;
}

function getBreadcrumbs(pathname: string) {
  const parts = [{ label: "Filing Workspace", href: "/file" }];
  
  if (pathname.startsWith("/file/onboarding")) {
    parts.push({ label: "Get Started", href: "/file/onboarding/eligibility" });
  } else if (pathname.startsWith("/file/import")) {
    parts.push({ label: "Import Documents", href: "/file/import/documents" });
  } else if (pathname.startsWith("/file/income") || pathname.startsWith("/file/house-property") || pathname.startsWith("/file/other")) {
    parts.push({ label: "Income Details", href: "/file/income" });
    if (pathname.startsWith("/file/income")) parts.push({ label: "Salary Details", href: "/file/income" });
    if (pathname.startsWith("/file/house-property")) parts.push({ label: "House Property", href: "/file/house-property" });
    if (pathname.startsWith("/file/other")) parts.push({ label: "Other Sources", href: "/file/other" });
  } else if (pathname.startsWith("/file/deductions")) {
    parts.push({ label: "Deductions", href: "/file/deductions" });
  } else if (pathname.startsWith("/file/regime")) {
    parts.push({ label: "Tax Regime", href: "/file/regime" });
  } else if (pathname.startsWith("/file/review")) {
    parts.push({ label: "Audit & Review", href: "/file/review" });
  } else if (pathname.startsWith("/file/checkout")) {
    parts.push({ label: "Checkout & Plans", href: "/file/checkout/plans" });
  } else if (pathname.startsWith("/file/companion")) {
    parts.push({ label: "File on Portal", href: "/file/companion" });
  }
  
  return parts;
}

export function FilingLayout({
  children,
  showNavRail = false,
  activeNavSection,
  mirrorText = "Government forms use legal terms. We explain each field in plain English so you know what you are declaring.",
  variant = "default",
}: {
  children: ReactNode;
  showNavRail?: boolean;
  activeNavSection?: string;
  mirrorText?: string;
  /** wide: full content width; companion: wide + hide right mirror aside */
  variant?: "default" | "wide" | "companion";
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Draft state variables for step completion
  const draftName = useDraftStore((s) => s.name);
  const regime = useDraftStore((s) => s.regime);
  const income = useDraftStore((s) => s.income);
  const houseProperty = useDraftStore((s) => s.houseProperty);
  const deductions = useDraftStore((s) => s.deductions);
  const incomeChips = useDraftStore((s) => s.incomeChips);
  const connectedConnectors = useDraftStore((s) => s.connectedConnectors);
  const mismatchResolved = useDraftStore((s) => s.mismatchResolved);

  const sectionStatuses = getIncomeSectionStatuses({
    income,
    houseProperty,
    deductions,
    regime,
    incomeChips,
    connectedConnectors,
    mismatchResolved,
  });

  // Fetch real-time tax compute values for sidebar summary card
  const { loading: taxLoading, result, confidence: taxConfidence } = useDraftTaxCompute({ readOnly: true });

  const selectedRegime = regime ?? result?.regime_comparison.recommended_regime ?? "new";
  const netPayable = result?.regime_comparison[selectedRegime].net_payable ?? null;
  const isRefund = netPayable !== null && netPayable < 0;
  const score = Math.round(taxConfidence.completeness_score);

  function getStepStatus(stepId: string): "complete" | "partial" | "missing" {
    if (stepId === "onboarding") {
      return draftName ? "complete" : "missing";
    }
    if (stepId === "import") {
      return connectedConnectors.includes("form16")
        ? "complete"
        : connectedConnectors.length > 0
          ? "partial"
          : "missing";
    }
    if (stepId === "income") {
      const statuses = [sectionStatuses.salary, sectionStatuses.house, sectionStatuses.other];
      if (statuses.every((s) => s === "complete")) return "complete";
      if (statuses.every((s) => s === "missing")) return "missing";
      return "partial";
    }
    if (stepId === "deductions") return sectionStatuses.deductions;
    if (stepId === "regime") return sectionStatuses.regime;
    if (stepId === "review") {
      return mismatchResolved ? "complete" : "partial";
    }
    if (stepId === "checkout") {
      return pathname.startsWith("/file/companion") ? "complete" : "missing";
    }
    if (stepId === "companion") {
      return pathname.startsWith("/file/checkout/everify") ? "complete" : "missing";
    }
    return "missing";
  }

  const isCompanionLayout = variant === "companion";
  const isWideLayout = variant === "wide" || isCompanionLayout;
  const breadcrumbs = getBreadcrumbs(pathname);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-100/60 gap-2.5 bg-white">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/10">
          <FileText className="size-4" />
        </span>
        <span className="font-semibold text-slate-900 tracking-tight text-base">
          TaxSaathi
        </span>
        <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          MVP
        </span>
      </div>

      {/* Steps List */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7 scrollbar-thin">
        <div>
          <h4 className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Filing Journey
          </h4>
          <ul className="space-y-1">
            {SIDEBAR_STEPS.map((step) => {
              const active = isStepActive(step, pathname, activeNavSection);
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              const hasSubItems = step.subItems && step.subItems.length > 0;

              return (
                <li key={step.id} className="space-y-1">
                  <Link
                    href={step.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all relative group",
                      active
                        ? "bg-blue-50/70 font-semibold text-blue-600 shadow-[inset_1px_0_0_rgba(37,99,235,0.05)]"
                        : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
                    )}
                  >
                    {/* Active Left Indicator Bar */}
                    {active && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded bg-blue-600" />
                    )}
                    
                    {/* Icon */}
                    <Icon className={cn("size-4.5 shrink-0", active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                    
                    <span className="flex-1 truncate">{step.label}</span>

                    {/* Status indicator */}
                    {status === "complete" ? (
                      <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    ) : status === "partial" ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mr-1.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-200 shrink-0 mr-1.5" />
                    )}
                  </Link>

                  {/* Render Sub-items if expanded */}
                  {hasSubItems && active && (
                    <ul className="pl-9 space-y-1 mt-0.5 border-l border-slate-100 ml-5">
                      {step.subItems!.map((sub) => {
                        const subActive = isSubItemActive(sub.id, pathname, activeNavSection);
                        const subStatus = sectionStatuses[sub.statusKey];
                        return (
                          <li key={sub.id}>
                            <Link
                              href={sub.href}
                              onClick={() => setIsSidebarOpen(false)}
                              className={cn(
                                "flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-all",
                                subActive
                                  ? "font-semibold text-blue-600 bg-blue-50/30"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/40"
                              )}
                            >
                              <span>{sub.label}</span>
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  statusDotClass(subStatus)
                                )}
                              />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Resources / Help Section */}
        <div>
          <h4 className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Resources
          </h4>
          <ul className="space-y-1">
            <li>
              <Link
                href="/help"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
              >
                <HelpCircle className="size-4.5 text-slate-400" />
                <span>Help Center</span>
              </Link>
            </li>
            <li>
              <Link
                href="/learn"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
              >
                <BookOpen className="size-4.5 text-slate-400" />
                <span>Tax Guides</span>
              </Link>
            </li>
            <li>
              <Link
                href="/tools"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
              >
                <Wrench className="size-4.5 text-slate-400" />
                <span>Tax Tools</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Tax Summary Widget & User footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40 space-y-4">
        {/* Tax Summary Card */}
        {shouldShowSummaryRail(pathname) && (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Tax Summary
              </span>
              {!taxLoading && score > 0 && (
                <span className="text-xs font-medium text-slate-500">
                  {score}%
                </span>
              )}
            </div>

            {taxLoading ? (
              <div className="text-sm font-semibold text-slate-600 animate-pulse">
                Calculating…
              </div>
            ) : netPayable !== null ? (
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  {isRefund ? "Estimated Refund" : "Estimated Tax Due"}
                </p>
                <p
                  className={cn(
                    "text-xl font-bold tracking-tight tabular-nums",
                    isRefund ? "text-emerald-600" : "text-slate-900"
                  )}
                >
                  {formatINR(Math.abs(netPayable))}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-normal">
                Add income details to see tax estimate.
              </p>
            )}

            {/* Progress Meter */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    taxConfidence.filing_ready
                      ? "bg-emerald-500"
                      : score >= 70
                        ? "bg-amber-500"
                        : "bg-slate-300"
                  )}
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{taxConfidence.filing_ready ? "Filing-ready" : "Incomplete"}</span>
                {!taxConfidence.filing_ready && (
                  <Link href="/file/import/documents" className="text-blue-600 font-semibold hover:underline">
                    Upload
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exit link / User Profile indicator */}
        <div className="flex items-center justify-between px-2 text-xs">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <LogOut className="size-3.5" />
            <span>Exit to home</span>
          </Link>
          <span className="text-slate-300">|</span>
          <ProfileNavLink className="font-semibold text-slate-600 hover:text-blue-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* 1. Desktop Sidebar Navigation (lg & up) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:sticky lg:top-0 lg:border-r lg:border-slate-100/80 lg:shrink-0">
        {sidebarContent}
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Main Content Header (slim navbar) */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-100/60 bg-white/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          {/* Mobile hamburger menu & logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <FileText className="size-3.5" />
              </span>
              <span className="font-semibold text-slate-900 text-sm">
                TaxSaathi
              </span>
            </Link>
          </div>

          {/* Desktop Breadcrumbs */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3 text-slate-300" />}
                <Link
                  href={crumb.href}
                  className={cn(
                    "hover:text-slate-900 transition-colors",
                    i === breadcrumbs.length - 1 && "font-medium text-slate-800"
                  )}
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>

          {/* Quick exit & profile on mobile/desktop */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors hidden sm:block"
            >
              Back to Home
            </Link>
            <ProfileNavLink className="text-xs font-semibold" />
          </div>
        </header>

        {/* 3. Main Workspace Grid */}
        <div
          className={cn(
            "grid w-full flex-1 content-start items-start gap-6 p-4 sm:p-6 lg:p-8 min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]",
            isWideLayout
              ? "grid-cols-1"
              : isCompanionLayout
                ? "grid-cols-1"
                : "grid-cols-1 xl:grid-cols-[1fr_20rem]"
          )}
        >
          {/* Main workspace card */}
          <main className="bg-white rounded-2xl border border-slate-100/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-6 sm:p-8 min-w-0 w-full">
            {children}
          </main>

          {/* Context helper rail */}
          {!isCompanionLayout && (
            <aside className="hidden xl:block w-full shrink-0 self-start xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:overflow-y-auto">
              <div className="h-full border border-slate-100 bg-white rounded-2xl shadow-sm overflow-hidden">
                <ActiveAiCompanion />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* 4. Responsive Mobile Sidebar Drawer Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Sidebar Content */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out">
            <div className="absolute right-4 top-4 z-10">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 focus:outline-none"
                aria-label="Close sidebar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 h-full">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
