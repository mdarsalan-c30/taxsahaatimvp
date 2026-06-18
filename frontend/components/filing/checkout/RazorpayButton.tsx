"use client";

import { useCallback, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { PlanId } from "@/lib/payments/plans";
import { getPlan } from "@/lib/payments/plans";
import { getEffectivePrice, getPlanPriceLabel } from "@/lib/marketing/pricing";
import { getBrowserSessionId } from "@/lib/store/sessionInit";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: RazorpayResponse) => void) => void;
    };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  planId: PlanId;
  mock: boolean;
  keyId?: string | null;
  message?: string;
}

interface RazorpayButtonProps {
  planId: PlanId;
  couponCode?: string;
  onSuccess?: (result: {
    orderId: string;
    paymentId: string;
    planId: PlanId;
    mock: boolean;
  }) => void;
  onError?: (message: string) => void;
  className?: string;
  disabled?: boolean;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export default function RazorpayButton({
  planId,
  couponCode,
  onSuccess,
  onError,
  className = "",
  disabled = false,
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const plan = getPlan(planId);
  const effectivePrice = getEffectivePrice(planId);
  const priceLabel = getPlanPriceLabel(planId);

  const verifyPayment = useCallback(
    async (response: RazorpayResponse) => {
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...response,
          planId,
          sessionId: getBrowserSessionId(),
          couponCode,
        }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok || !data.verified) {
        throw new Error(data.error ?? "Payment verification failed");
      }
      return data;
    },
    [planId, couponCode]
  );

  const handleMockPayment = useCallback(
    async (order: CreateOrderResponse) => {
      const mockResponse: RazorpayResponse = {
        razorpay_order_id: order.orderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: "mock_signature",
      };
      await verifyPayment(mockResponse);
      trackEvent("payment_success", { plan_id: planId, mock: true });
      onSuccess?.({
        orderId: order.orderId,
        paymentId: mockResponse.razorpay_payment_id,
        planId,
        mock: true,
      });
    },
    [onSuccess, planId, verifyPayment]
  );

  const handlePay = useCallback(async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, couponCode }),
      });
      const order = (await orderRes.json()) as CreateOrderResponse & {
        error?: string;
      };

      if (!orderRes.ok) {
        throw new Error(order.error ?? "Could not create order");
      }

      if (effectivePrice === 0 || order.mock) {
        await handleMockPayment(order);
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay || !order.keyId) {
        throw new Error("Razorpay checkout unavailable");
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "LastMinute ITR",
        description: `${plan.name} plan — ${priceLabel}`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await verifyPayment(response);
            trackEvent("payment_success", { plan_id: planId, mock: false });
            onSuccess?.({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              planId,
              mock: false,
            });
          } catch (err) {
            onError?.(
              err instanceof Error ? err.message : "Verification failed"
            );
          }
        },
        theme: { color: "#1d4ed8" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }, [
    disabled,
    handleMockPayment,
    loading,
    effectivePrice,
    onError,
    onSuccess,
    plan,
    planId,
    priceLabel,
    verifyPayment,
    couponCode,
  ]);

  const label =
    effectivePrice === 0
      ? "Continue free"
      : loading
        ? "Processing…"
        : `Pay ${priceLabel} & unlock filing guide`;

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={disabled || loading}
      className={
        className ||
        "min-h-11 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {label}
    </button>
  );
}
