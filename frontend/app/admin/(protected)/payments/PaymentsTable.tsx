"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Payment } from "@/lib/db/types";

function tone(status: Payment["status"]): string {
  if (status === "paid" || status === "granted") return "text-emerald-600";
  if (status === "refunded") return "text-amber-600";
  return "text-red-600";
}

export function PaymentsTable({
  payments,
  canRefund,
}: {
  payments: Payment[];
  canRefund: boolean;
}) {
  const router = useRouter();
  const [refundId, setRefundId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirmRefund() {
    if (!refundId || !reason.trim()) return;
    setBusy(true);
    await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: refundId, reason }),
    });
    setBusy(false);
    setRefundId(null);
    setReason("");
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {["When", "Plan", "Amount", "Status", "Razorpay order", "Source", ""].map(
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
          {payments.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                No payments recorded yet.
              </td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id} className="border-b border-border/60">
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(p.ts).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">{p.plan}</td>
                <td className="px-4 py-3 tabular-nums">₹{p.amount}</td>
                <td className={`px-4 py-3 font-medium ${tone(p.status)}`}>
                  {p.status}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {p.razorpayOrderId ?? "—"}
                </td>
                <td className="px-4 py-3">{p.source}</td>
                <td className="px-4 py-3">
                  {canRefund && p.status === "paid" && (
                    <button
                      type="button"
                      onClick={() => setRefundId(p.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Refund
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {refundId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold">Refund payment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A reason is required and the refund is recorded in the audit log.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for refund"
              className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundId(null)}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !reason.trim()}
                onClick={confirmRefund}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Refunding…" : "Confirm refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
