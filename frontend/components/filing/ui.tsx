"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function ScreenTitle({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-4 min-w-0 sm:mb-5">
      {badge}
      <h1 className="text-[length:var(--text-headline)] font-semibold tracking-[-0.015em] text-slate-900">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-2.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function FilingActions({
  children,
  hint,
  className = "",
}: {
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`filing-actions-bar ${className}`}>
      {hint &&
        (typeof hint === "string" ? (
          <p className="text-tier-feature">{hint}</p>
        ) : (
          hint
        ))}
      <div className="filing-actions-primary">{children}</div>
    </div>
  );
}

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0";
  const variants = {
    primary:
      "min-h-11 border border-transparent bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-md",
    secondary:
      "border border-slate-200/80 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:shadow-md",
    ghost:
      "border border-transparent text-muted-foreground hover:bg-slate-100 hover:text-slate-800 px-3 py-1.5 font-medium",
  };
  const cls = `${base} ${variants[variant]} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Banner({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "critical";
}) {
  const styles = {
    info: "bg-blue-50/80 text-blue-900 border-blue-100",
    success: "bg-emerald-50/80 text-emerald-900 border-emerald-100",
    warning: "bg-amber-50/80 text-amber-900 border-amber-100",
    critical: "bg-red-50/80 text-red-900 border-red-100",
  };
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3.5 text-sm leading-relaxed ${styles[variant]}`}
    >
      {children}
    </div>
  );
}

export function Card({
  children,
  recommended,
  className = "",
}: {
  children: ReactNode;
  recommended?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`card-premium mb-3 flex flex-col p-4 sm:p-5 ${
        recommended ? "ring-2 ring-primary/15 border-primary/30" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`filing-card-grid ${className}`}>{children}</div>;
}

export function RiskBadge({
  children,
  variant = "green",
}: {
  children: ReactNode;
  variant?: "green" | "yellow" | "red";
}) {
  const styles = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    yellow: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span
      className={`mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function ResetStepButton({
  label,
  onClick,
  variant = "secondary",
  className = "",
}: {
  label: string;
  onClick: () => void;
  variant?: "secondary" | "ghost";
  className?: string;
}) {
  const styles =
    variant === "ghost"
      ? "border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-slate-100 hover:text-slate-800"
      : "border-slate-200/80 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${styles} ${className}`}
    >
      {label}
    </button>
  );
}

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[length:var(--text-caption)] font-medium transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {label}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-slate-800">
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  onFocus,
  onBlur,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      onFocus={onFocus}
      onBlur={onBlur}
      className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ModeCard({
  title,
  description,
  selected,
  onClick,
  small,
}: {
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  small?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full min-h-11 w-full flex-col rounded-2xl border p-4 text-left transition-all sm:p-5 ${
        selected
          ? "border-primary/40 bg-primary/5 shadow-md ring-2 ring-primary/10"
          : "border-slate-200/80 bg-white shadow-sm hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {small && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{small}</p>
      )}
    </button>
  );
}

export function TrackerSteps({
  steps,
}: {
  steps: { label: string; status: "done" | "current" | "pending" | "overdue" }[];
}) {
  return (
    <div className="mb-6">
      <div className="filing-step-indicator" aria-hidden>
        {steps.map((step) => (
          <div
            key={`seg-${step.label}`}
            data-active={step.status === "current"}
            data-done={step.status === "done"}
            className="filing-step-segment"
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {steps.map((step) => (
          <div key={step.label} className="flex min-w-0 flex-col items-center">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:size-9 ${
                step.status === "done"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : step.status === "current"
                    ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                    : step.status === "overdue"
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              {step.status === "done" ? "✓" : step.label[0]}
            </div>
            <span
              className={`mt-1.5 text-center text-[10px] leading-tight sm:text-xs ${
                step.status === "current"
                  ? "font-semibold text-slate-900"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
