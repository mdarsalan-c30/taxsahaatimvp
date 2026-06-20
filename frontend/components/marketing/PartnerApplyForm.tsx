"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { B2B_PROFESSIONALS } from "@/lib/copy/marketing";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface PartnerApplyFormProps {
  className?: string;
}

export function PartnerApplyForm({ className }: PartnerApplyFormProps) {
  const [firmName, setFirmName] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [icaiNo, setIcaiNo] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmName: firmName.trim(),
          applicantName: applicantName.trim() || undefined,
          icaiNo: icaiNo.trim() || undefined,
          city: city.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Application failed. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "card-premium flex flex-col items-center gap-3 px-6 py-8 text-center",
          className
        )}
      >
        <CheckCircle2 className="size-10 text-emerald-600" aria-hidden />
        <h3 className="text-lg font-semibold text-foreground">
          Application received
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Thanks for your interest in LastMinute Pro. Our team will review your
          application and reach out within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("card-premium space-y-4 p-5 sm:p-6", className)}
    >
      <div className="space-y-1.5">
        <label htmlFor="firmName" className="text-sm font-medium text-foreground">
          Firm name *
        </label>
        <Input
          id="firmName"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          placeholder="e.g. Sharma & Associates"
          required
          disabled={status === "loading"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="applicantName" className="text-sm font-medium text-foreground">
            Your name
          </label>
          <Input
            id="applicantName"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            placeholder="CA Rahul Sharma"
            disabled={status === "loading"}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="icaiNo" className="text-sm font-medium text-foreground">
            ICAI membership no.
          </label>
          <Input
            id="icaiNo"
            value={icaiNo}
            onChange={(e) => setIcaiNo(e.target.value)}
            placeholder="Optional"
            disabled={status === "loading"}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="city" className="text-sm font-medium text-foreground">
          City
        </label>
        <Input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Bengaluru"
          disabled={status === "loading"}
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full gap-2 rounded-xl font-semibold"
        disabled={status === "loading" || !firmName.trim()}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            {B2B_PROFESSIONALS.cta}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        Wholesale pricing · Set your own client fees · Same mismatch engine as
        LastMinute ITR
      </p>
    </form>
  );
}
