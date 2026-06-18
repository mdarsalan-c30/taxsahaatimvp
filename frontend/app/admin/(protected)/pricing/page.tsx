import { getAdminSession } from "@/lib/admin/rbac";
import { getPricingConfig, listPricingRevisions } from "@/lib/pricing/config";
import { getPlan, PLAN_LIST } from "@/lib/payments/plans";
import { EmptyState, PageHeader } from "../../_components/ui";
import { PricingEditor, type EditorRow } from "./PricingEditor";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await getAdminSession();
  const isCeo = session?.role === "ceo";

  const [config, revisions] = await Promise.all([
    getPricingConfig(),
    listPricingRevisions(),
  ]);

  const rows: EditorRow[] = PLAN_LIST.map((plan) => {
    const row = config.find((c) => c.planId === plan.id);
    return {
      planId: plan.id,
      name: getPlan(plan.id).name,
      basePriceInr: row?.basePriceInr ?? plan.price,
      offerPriceInr: row?.offerPriceInr ?? null,
      offerEndsAt: row?.offerEndsAt ?? null,
    };
  });

  return (
    <div>
      <PageHeader
        title="Pricing & offers"
        subtitle="Single source of truth for plan prices and the launch offer · CEO only"
      />

      {!isCeo ? (
        <EmptyState message="Pricing changes are restricted to the CEO role." />
      ) : (
        <PricingEditor initial={rows} />
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Revision history
        </h2>
        {revisions.length === 0 ? (
          <EmptyState message="No pricing changes published yet." />
        ) : (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {revisions.map((rev) => (
              <li key={rev.id}>
                {new Date(rev.ts).toLocaleString("en-IN")} · {rev.adminEmail} ·{" "}
                {rev.configSnapshot.length} plans snapshotted
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
