"use client";

import { useState } from "react";
import { FieldLabel, TextInput } from "./ui";
import { HelpCircle, Languages, Sparkles } from "lucide-react";
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
  const [showGov, setShowGov] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const setActiveField = useDraftStore((s) => s.setActiveField);

  const activeId = fieldId ?? simpleLabel.toLowerCase().replace(/[^a-z0-9]/g, "_");

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <FieldLabel>{showGov ? govLabel : simpleLabel}</FieldLabel>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGov(!showGov)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <Languages className="size-3" />
            {showGov ? "Simple" : "Gov term"}
          </button>
          {glossaryTerm && (
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-primary"
              aria-label={`What is ${glossaryTerm}?`}
            >
              <HelpCircle className="size-4" />
            </button>
          )}
        </div>
      </div>

      {showTooltip && glossaryTerm && (
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
          onBlur={() => setActiveField?.(null)}
        />
      )}

      {helper && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{helper}</p>
      )}

      {/* Genie hint popup below input field when focused */}
      {useDraftStore((s) => s.activeField) === activeId && FIELD_GUIDANCE[activeId] && (
        <div className="mt-2 rounded-xl bg-blue-50/60 border border-blue-100/60 p-3 flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <Sparkles className="size-4 text-blue-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
              Genie Hint <span className="inline-block animate-ping size-1 h-1 rounded-full bg-blue-600" />
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {FIELD_GUIDANCE[activeId].tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
