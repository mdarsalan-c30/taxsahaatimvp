"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CaRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      firmName: formData.get("firmName") as string,
      applicantName: formData.get("applicantName") as string,
      icaiNo: formData.get("icaiNo") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      city: formData.get("city") as string,
    };

    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit application.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="w-full rounded-[24px] bg-white p-8 text-center"
        style={{
          border: "1px solid #E6E8EC",
          boxShadow: "0 24px 60px -24px rgba(11,18,32,.16), 0 2px 4px rgba(11,18,32,.04)",
        }}
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F9E5]">
          <svg width="28" height="28" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M5 10l3 3 7-7" stroke="#74A81F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="font-manrope mb-2 text-xl font-bold text-[#0B1220]">
          Application Received
        </h3>
        <p className="text-[14.5px] text-[#6B7280] leading-relaxed">
          Thank you for applying. Our team will verify your ICAI membership details and grant B2B portal access within 1-2 business days.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-[24px] bg-white p-7"
      style={{
        border: "1px solid #E6E8EC",
        boxShadow: "0 24px 60px -24px rgba(11,18,32,.16), 0 2px 4px rgba(11,18,32,.04)",
      }}
    >
      <div className="mb-6">
        <h3 className="font-manrope text-[19px] font-bold tracking-[-0.01em] text-[#0B1220]">
          Partner Onboarding
        </h3>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Apply for CA portal access to manage your clients.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="firmName" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
            Firm Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firmName"
            name="firmName"
            type="text"
            required
            placeholder="e.g. Sharma & Associates"
            className="w-full rounded-[10px] border border-[#E6E8EC] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#0e5f63]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="applicantName" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="applicantName"
              name="applicantName"
              type="text"
              required
              placeholder="e.g. CA Rahul Sharma"
              className="w-full rounded-[10px] border border-[#E6E8EC] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#0e5f63]"
            />
          </div>
          <div>
            <label htmlFor="icaiNo" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
              ICAI Number <span className="text-red-500">*</span>
            </label>
            <input
              id="icaiNo"
              name="icaiNo"
              type="text"
              required
              placeholder="e.g. 504312"
              className="w-full rounded-[10px] border border-[#E6E8EC] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#0e5f63]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
            Work Email (Login ID) <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="e.g. rahul@sharma-associates.in"
            className="w-full rounded-[10px] border border-[#E6E8EC] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#0e5f63]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Create a password"
              className="w-full rounded-[10px] border border-[#E6E8EC] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#0e5f63]"
            />
          </div>
          <div>
            <label htmlFor="city" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              placeholder="e.g. Mumbai"
              className="w-full rounded-[10px] border border-[#E6E8EC] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#0e5f63]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-[8px] bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "btn-pill-primary mt-2 w-full py-3",
            loading && "opacity-70 pointer-events-none"
          )}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>

        <p className="mt-2 text-center text-[12px] text-[#9CA3AF]">
          By applying, you agree to our B2B Terms of Service.
        </p>

        <p className="mt-4 text-center text-[13px] text-[#6B7280]">
          Already registered?{" "}
          <a href="/auth/ca-login" className="font-semibold text-[#0e5f63] hover:underline">
            Log in here
          </a>
        </p>
      </form>
    </div>
  );
}
