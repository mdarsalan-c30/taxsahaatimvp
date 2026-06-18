import { getAdminSession, can } from "@/lib/admin/rbac";
import { listPayments, paymentSummary } from "@/lib/admin/payments";
import { Card, PageHeader } from "../../_components/ui";
import { PaymentsTable } from "./PaymentsTable";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const session = await getAdminSession();
  const canRefund = session ? can(session.role, "refundPayment") : false;

  const [payments, summary] = await Promise.all([
    listPayments(),
    paymentSummary(),
  ]);

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Razorpay orders and coupon unlocks"
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-muted-foreground">Revenue</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            ₹{summary.revenue.toLocaleString("en-IN")}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted-foreground">Paid orders</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.paidOrders}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted-foreground">
            Coupon unlocks
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.couponUnlocks}
          </p>
        </Card>
      </div>

      <PaymentsTable payments={payments} canRefund={canRefund} />
    </div>
  );
}
