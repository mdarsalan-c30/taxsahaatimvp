"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, ArrowRight, Briefcase } from "lucide-react";

export default function CALoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/ca/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Redirect to CA dashboard
      router.push("/ca/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Briefcase className="size-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">CA Partner Login</h1>
          <p className="text-center text-sm text-slate-500 mb-8">Access your TaxSaathi dashboard to manage client applications and filings.</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 animate-in fade-in slide-in-from-top-1 duration-300">
                <p className="text-sm text-red-600 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="size-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="ca@firm.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="size-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
            >
              {loading ? "Signing in..." : (
                <>
                  Sign in to Partner Dashboard
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/file/cabrain" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Not a registered CA partner? Apply now
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
            <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Access is restricted to verified CA professionals. By logging in, you agree to our 
              Partner Terms of Service and Data Protection guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
