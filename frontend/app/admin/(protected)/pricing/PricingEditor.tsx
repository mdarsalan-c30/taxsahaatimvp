"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/lib/payments/plans";

export interface EditorRow {
  planId: PlanId;
  name: string;
  basePriceInr: number;
  offerPriceInr: number | null;
  offerEndsAt: string | null;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function PricingEditor({ initial }: { initial: EditorRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<EditorRow[]>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(initial),
    [rows, initial]
  );

  const aiSmart = rows.find((r) => r.planId === "ai_smart");
  const now = Date.now();
  const offerActive =
    aiSmart?.offerPriceInr != null &&
    aiSmart.offerEndsAt != null &&
    new Date(aiSmart.offerEndsAt).getTime() > now;

  function patch(planId: PlanId, patch: Partial<EditorRow>) {
    setRows((rs) => rs.map((r) => (r.planId === planId ? { ...r, ...patch } : r)));
  }

  async function publish() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((r) => ({
            planId: r.planId,
            basePriceInr: r.basePriceInr,
            offerPriceInr: r.offerPriceInr,
            offerEndsAt: r.offerEndsAt,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setMessage("Published. Marketing and checkout will reflect within ~60s.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {["Plan", "Base price", "Offer price", "Offer ends"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.planId} className="border-b border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.name}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    value={row.basePriceInr}
                    onChange={(e) =>
                      patch(row.planId, {
                        basePriceInr: Number(e.target.value),
                      })
                    }
                    className="w-24 rounded-md border border-input bg-background px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    placeholder="—"
                    value={row.offerPriceInr ?? ""}
                    onChange={(e) =>
                      patch(row.planId, {
                        offerPriceInr:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-24 rounded-md border border-input bg-background px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={toDateInput(row.offerEndsAt)}
                    onChange={(e) =>
                      patch(row.planId, {
                        offerEndsAt: e.target.value
                          ? new Date(`${e.target.value}T23:59:59+05:30`).toISOString()
                          : null,
                      })
                    }
                    className="rounded-md border border-input bg-background px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Marketing card preview — AI Smart
          </p>
          {aiSmart && (
            <p className="text-lg font-semibold text-foreground">
              {offerActive ? (
                <>
                  {formatInr(aiSmart.offerPriceInr as number)}{" "}
                  <span className="text-sm font-normal text-muted-foreground line-through">
                    {formatInr(aiSmart.basePriceInr)}
                  </span>{" "}
                  <span className="text-xs font-medium text-emerald-600">
                    Launch offer
                  </span>
                </>
              ) : (
                formatInr(aiSmart.basePriceInr)
              )}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            You file on incometax.gov.in yourself.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Checkout amount — AI Smart
          </p>
          {aiSmart && (
            <p className="text-lg font-semibold text-foreground">
              Razorpay order:{" "}
              {formatInr(
                offerActive
                  ? (aiSmart.offerPriceInr as number)
                  : aiSmart.basePriceInr
              )}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => setRows(initial)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
        >
          Discard draft
        </button>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={publish}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
        >
          {saving ? "Publishing…" : "Publish change"}
        </button>
      </div>
    </div>
  );
}
