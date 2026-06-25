"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/lib/store/profile";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/auth/b2c/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const d = await res.json();

      if (!res.ok) {
        throw new Error(d.error || "Failed to register");
      }

      // Sync the profile store so headers/navbar update immediately
      if (d.user) {
        useProfileStore.getState().setProfile({
          name: d.user.name,
          email: d.user.email,
        });
      }

      // Redirect to getting started
      router.push("/file/onboarding/eligibility?step=about-you");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB] px-4 py-12">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white p-8" style={{ border: "1px solid #E6E8EC", boxShadow: "0 24px 60px -24px rgba(11,18,32,.16)" }}>
        <div className="mb-8 text-center">
          <h1 className="font-manrope text-2xl font-bold tracking-tight text-[#0B1220]">
            Create an account
          </h1>
          <p className="mt-2 text-[14px] text-[#6B7280]">
            Let&apos;s get started with your tax filing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
              What should we call you?
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={initialName}
              placeholder="e.g. Rahul"
              className="w-full rounded-[10px] border border-[#E6E8EC] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#0e5f63]"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-[10px] border border-[#E6E8EC] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[#0e5f63]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-[#2B3344]">
              Password
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
            {loading ? "Creating account..." : "Continue"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#6B7280]">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[#0e5f63] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFB]" />}>
      <RegisterForm />
    </Suspense>
  );
}
