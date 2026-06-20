"use client";

import { useState } from "react";
import { FieldLabel, TextInput } from "./ui";
import { HelpCircle, Info, Sparkles } from "lucide-react";
import { useDraftStore } from "@/lib/store/draft";
import { FIELD_GUIDANCE } from "./ActiveAiCompanion";

export function PlainEnglishField({
  govLabel,
  simpleLabel,
  helper,
  glossaryTerm,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  children,
  fieldId,
}: {
  govLabel: string;
  simpleLabel: string;
  helper?: string;
  glossaryTerm?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  children?: React.ReactNode;
  fieldId?: string;
}) {
  const [showGovTooltip, setShowGovTooltip] = useState(false);
  const [showGlossaryTooltip, setShowGlossaryTooltip] = useState(false);
  const setActiveField = useDraftStore((s) => s.setActiveField);

  const activeId = fieldId ?? simpleLabel.toLowerCase().replace(/[^a-z0-9]/g, "_");

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <FieldLabel>{simpleLabel}</FieldLabel>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowGovTooltip((prev) => !prev)}
            className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-primary"
            aria-label={`Government portal name for ${simpleLabel}`}
            title={`On the Income Tax portal, this is called: ${govLabel}`}
          >
            <Info className="size-4" />
          </button>
          {glossaryTerm && (
            <button
              type="button"
              onClick={() => setShowGlossaryTooltip((prev) => !prev)}
              className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-primary"
              aria-label={`What is ${glossaryTerm}?`}
            >
              <HelpCircle className="size-4" />
            </button>
          )}
        </div>
      </div>

      {showGovTooltip && (
        <div className="field-tooltip mb-2">
          On the Income Tax portal, this is called:{" "}
          <strong className="font-semibold">{govLabel}</strong>
        </div>
      )}

      {showGlossaryTooltip && glossaryTerm && (
        <div className="field-tooltip mb-2">
          <strong className="font-semibold">{glossaryTerm}</strong> — This is the official
          term used on incometax.gov.in. We show it in plain English by default so you
          know exactly what you&apos;re declaring.
        </div>
      )}

      {children ?? (
        <TextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          maxLength={maxLength}
          onFocus={() => setActiveField?.(activeId)}
        />
      )}

      {helper && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{helper}</p>
      )}

      {useDraftStore((s) => s.activeField) === activeId && FIELD_GUIDANCE[activeId] && (
        <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-blue-100/60 bg-blue-50/60 p-3 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <Sparkles className="mt-0.5 size-4 shrink-0 animate-bounce text-blue-600" />
          <div className="space-y-0.5">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-900">
              Genie Hint{" "}
              <span className="inline-block size-1 h-1 animate-ping rounded-full bg-blue-600" />
            </p>
            <p className="text-xs leading-relaxed text-slate-700">
              {FIELD_GUIDANCE[activeId].tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
