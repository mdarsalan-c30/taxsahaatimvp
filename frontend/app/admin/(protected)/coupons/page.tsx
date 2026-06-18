import { fraudFlags, listCoupons } from "@/lib/admin/coupons";
import { PageHeader } from "../../_components/ui";
import { CouponsManager } from "./CouponsManager";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const [coupons, flags] = await Promise.all([listCoupons(), fraudFlags()]);
  const flaggedIds = [...new Set(flags.map((f) => f.couponId))];

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Grant discounted or free companion access without a code deploy"
      />
      <CouponsManager coupons={coupons} flaggedIds={flaggedIds} />
    </div>
  );
}
