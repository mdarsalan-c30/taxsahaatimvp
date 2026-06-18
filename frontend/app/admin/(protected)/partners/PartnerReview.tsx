"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PartnerReview({ id }: { id: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(decision: "verified" | "rejected") {
    if (decision === "rejected" && !reason.trim()) return;
    setBusy(true);
    await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision, reason }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (required to reject)"
        className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => decide("verified")}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => decide("rejected")}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
