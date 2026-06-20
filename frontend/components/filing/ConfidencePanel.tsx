"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileUp,
  ShieldAlert,
} from "lucide-react";
import type { ConfidenceResult } from "@/lib/engine/types";
import {
  DOC_DISPLAY_NAMES,
  DOC_WEIGHTS,
  scoreTone,
  uploadKeyForMissingDoc,
} from "@/lib/filing/confidence";
import { Button, RiskBadge } from "@/components/filing/ui";
import { cn } from "@/lib/utils";

export interface ConfidencePanelProps {
  confidence: ConfidenceResult;
  variant?: "full" | "compact" | "marketing-demo";
  onUploadDoc?: (docKey: string) => void;
  onUpgradeCA?: () => void;
  className?: string;
  showChecksDetail?: boolean;
}

const SCORE_RING_COLORS = {
  green: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
};

const SCORE_BAR_COLORS = {
  green: "bg-blue-600",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

function ScoreRing({
  score,
  tone,
  compact,
}: {
  score: number;
  tone: "green" | "amber" | "red";
  compact?: boolean;
}) {
  const size = compact ? 56 : 72;
  const stroke = compact ? 5 : 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn("relative shrink-0", SCORE_RING_COLORS[tone])}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold tabular-nums text-slate-900",
          compact ? "text-sm" : "text-lg"
        )}
      >
        {Math.round(score)}%
      </span>
    </div>
  );
}

function WeightBreakdown({ confidence }: { confidence: ConfidenceResult }) {
  const missingSet = new Set(confidence.missing_documents);
  const rows = Object.entries(DOC_DISPLAY_NAMES).map(([key, label]) => ({
    key,
    label,
    weight: DOC_WEIGHTS[key] ?? 0,
    earned: !missingSet.has(label),
  }));

  return (
    <ul className="mt-3 space-y-2 text-sm">
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex items-center justify-between gap-2 text-slate-600"
        >
          <span className={row.earned ? "text-slate-800" : "text-slate-500"}>
            {row.earned ? "✓" : "○"} {row.label}
          </span>
          <span className="tabular-nums text-xs font-medium">
            {row.earned ? row.weight : 0}/{row.weight}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ConfidencePanel({
  confidence,
  variant = "full",
  onUploadDoc,
  onUpgradeCA,
  className,
  showChecksDetail = true,
}: ConfidencePanelProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const tone = useMemo(() => scoreTone(confidence), [confidence]);
  const score = confidence.completeness_score;

  const handleUpload = (docLabel: string) => {
    const key = uploadKeyForMissingDoc(docLabel);
    if (!key) return;
    if (onUploadDoc) {
      onUploadDoc(key);
    } else {
      router.push(`/file/import/documents?highlight=${key}`);
    }
  };

  const handleUpgradeCA = () => {
    if (onUpgradeCA) {
      onUpgradeCA();
    } else {
      router.push("/file/checkout/plans");
    }
  };

  if (variant === "marketing-demo") {
    return (
      <div
        className={cn(
          "rounded-xl border border-blue-200/60 bg-blue-50/50 p-4",
          className
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Example dashboard
        </p>
        <div className="mt-3 flex items-center gap-4">
          <ScoreRing score={87} tone="amber" compact />
          <div>
            <p className="text-sm font-semibold text-slate-900">87% complete</p>
            <p className="text-xs text-slate-600">Upload AIS to reach filing-ready</p>
          </div>
        </div>
      </div>
    );
  }

  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white",
        isCompact ? "p-3" : "p-4",
        className
      )}
      data-filing-ready={confidence.filing_ready}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {!isCompact && (
            <ScoreRing score={score} tone={tone} />
          )}
          <div className="min-w-0">
            <strong className="text-sm text-slate-900">
              {isCompact ? "Filing confidence" : "Confidence summary"}
            </strong>
            {isCompact ? (
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    SCORE_BAR_COLORS[tone]
                  )}
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
            ) : null}
            {!confidence.filing_ready && isCompact ? (
              <p className="mt-2 text-sm text-slate-700">
                Let&apos;s get this filing-ready. You just need to upload{" "}
                <strong className="tabular-nums">
                  {confidence.missing_documents.length}
                </strong>{" "}
                more document
                {confidence.missing_documents.length === 1 ? "" : "s"}.
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-700">
                <strong className="tabular-nums">{Math.round(score)}%</strong> complete
                {!isCompact && (
                  <>
                    {" "}
                    ·{" "}
                    {confidence.filing_ready ? "Filing-ready" : "Not filing-ready"}
                  </>
                )}
              </p>
            )}
            {isCompact &&
              confidence.filing_ready &&
              confidence.missing_documents.length === 0 && (
                <p className="mt-1 text-xs text-emerald-700">Looking good — filing-ready.</p>
              )}
            {isCompact &&
              !confidence.filing_ready &&
              confidence.missing_documents.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {Math.round(score)}% complete so far
                </p>
              )}
          </div>
        </div>
        <RiskBadge variant={confidence.filing_ready ? "green" : "yellow"}>
          {confidence.filing_ready
            ? "Filing-ready"
            : isCompact
              ? "Almost there"
              : confidence.is_estimate_mode
                ? "Estimate mode"
                : "Not filing-ready"}
        </RiskBadge>
      </div>

      {confidence.is_estimate_mode && !isCompact && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            You&apos;re in estimate mode for now. Upload your documents when ready and
            we&apos;ll get you filing-ready before you pay or file.
          </p>
        </div>
      )}

      {!isCompact && confidence.missing_documents.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Missing documents
          </p>
          <ul className="mt-2 space-y-2">
            {confidence.missing_documents.map((doc) => (
              <li
                key={doc}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{doc}</span>
                <Button
                  variant="ghost"
                  className="min-h-11 px-3 text-xs"
                  onClick={() => handleUpload(doc)}
                >
                  <FileUp className="mr-1.5 size-3.5" />
                  Upload
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isCompact && confidence.ca_escalation_recommended && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Professional review recommended
              </p>
              <ul className="mt-1 list-disc pl-4 text-sm text-amber-800">
                {confidence.ca_escalation_reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p className="mt-2 text-tier-feature text-amber-800">
                Complex cases (foreign assets, business books) need a CA — we help with
                simpler salaried returns.
              </p>
              <Button
                variant="secondary"
                className="mt-3 min-h-11 text-xs"
                onClick={handleUpgradeCA}
              >
                Explore CA Review (soon)
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isCompact && showChecksDetail && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex w-full min-h-11 items-center justify-between text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            What we checked
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          <p className="mt-1 text-xs text-slate-500">
            Confidence score: {Math.round(score)}%
          </p>
          {expanded && <WeightBreakdown confidence={confidence} />}
        </div>
      )}
    </div>
  );
}
