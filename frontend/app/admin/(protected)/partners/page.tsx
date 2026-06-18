import { listTenants } from "@/lib/admin/partners";
import { EmptyState, PageHeader, Pill } from "../../_components/ui";
import { PartnerReview } from "./PartnerReview";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "gray"> = {
  verified: "green",
  pending: "amber",
  rejected: "red",
  suspended: "gray",
};

export default async function PartnersPage() {
  const tenants = await listTenants();
  const pending = tenants.filter((t) => t.status === "pending");
  const reviewed = tenants.filter((t) => t.status !== "pending");

  return (
    <div>
      <PageHeader
        title="Partners — verification queue"
        subtitle="No CA firm gets B2B access until verified"
      />

      <h2 className="mb-3 text-sm font-semibold">Pending</h2>
      {pending.length === 0 ? (
        <EmptyState message="No pending applications." />
      ) : (
        <div className="space-y-3">
          {pending.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{t.firmName}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.applicantName ?? "—"} · ICAI {t.icaiNo ?? "—"} ·{" "}
                    {t.city ?? "—"}
                  </p>
                </div>
                <Pill tone="amber">pending</Pill>
              </div>
              <PartnerReview id={t.id} />
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-sm font-semibold">Reviewed</h2>
      {reviewed.length === 0 ? (
        <EmptyState message="No reviewed firms yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {["Firm", "ICAI", "City", "Status", "Reviewed by"].map((h) => (
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
              {reviewed.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">{t.firmName}</td>
                  <td className="px-4 py-3">{t.icaiNo ?? "—"}</td>
                  <td className="px-4 py-3">{t.city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Pill tone={STATUS_TONE[t.status]}>{t.status}</Pill>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.reviewedBy ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
