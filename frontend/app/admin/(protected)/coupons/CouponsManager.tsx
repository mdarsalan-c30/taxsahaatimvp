"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@/lib/db/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function CouponsManager({
  coupons,
  flaggedIds,
}: {
  coupons: Coupon[];
  flaggedIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [planScope, setPlanScope] = useState("any");
  const [lane, setLane] = useState("b2c");
  const [discount, setDiscount] = useState("full");
  const [amountOff, setAmountOff] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [validityDays, setValidityDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          planScope,
          lane,
          discount,
          amountOff: discount === "amount" ? Number(amountOff) : undefined,
          maxUses: Number(maxUses),
          validityDays: Number(validityDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setOpen(false);
      setCode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  function exportCsv() {
    const header = "code,plan,lane,used,max,status,expires\n";
    const lines = coupons
      .map(
        (c) =>
          `${c.code},${c.planScope},${c.lane},${c.usedCount},${c.maxUses},${c.status},${c.expiresAt}`
      )
      .join("\n");
    const blob = new Blob([header + lines], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coupons.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          + New coupon
        </button>
      </div>

      {open && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                placeholder="LAUNCH50"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Plan scope</span>
              <select
                value={planScope}
                onChange={(e) => setPlanScope(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
              >
                <option value="any">any</option>
                <option value="diy">diy</option>
                <option value="ai_smart">ai_smart</option>
                <option value="ca">ca</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Lane</span>
              <select
                value={lane}
                onChange={(e) => setLane(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
              >
                <option value="b2c">b2c</option>
                <option value="b2b">b2b</option>
                <option value="both">both</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Discount</span>
              <select
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
              >
                <option value="full">Full unlock</option>
                <option value="amount">Amount off</option>
              </select>
            </label>
            {discount === "amount" && (
              <label className="text-sm">
                <span className="mb-1 block font-medium">Amount off (₹)</span>
                <input
                  type="number"
                  value={amountOff}
                  onChange={(e) => setAmountOff(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                />
              </label>
            )}
            <label className="text-sm">
              <span className="mb-1 block font-medium">Max uses</span>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Validity (days)</span>
              <input
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
              />
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create coupon"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {["Code", "Plan", "Lane", "Used", "Max", "Expires", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No coupons yet. Create one to grant companion access.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-mono font-medium">
                    {c.code}
                    {flaggedIds.includes(c.id) && (
                      <span className="ml-2 text-xs text-amber-600">⚠ fraud</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.planScope}</td>
                  <td className="px-4 py-3">{c.lane}</td>
                  <td className="px-4 py-3 tabular-nums">{c.usedCount}</td>
                  <td className="px-4 py-3 tabular-nums">{c.maxUses}</td>
                  <td className="px-4 py-3">{fmtDate(c.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.status === "active"
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "active" && (
                      <button
                        type="button"
                        onClick={() => revoke(c.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
