"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanId } from "@/lib/payments/plans";

export interface PaymentSessionState {
  verified: boolean;
  planId?: PlanId;
  orderId?: string;
  paymentId?: string;
  verifiedAt?: number;
  mock?: boolean;
  companionAccess?: boolean;
  passkey?: string;
  expiresAt?: string | null;
}

interface UsePaymentSessionResult {
  session: PaymentSessionState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePaymentSession(): UsePaymentSessionResult {
  const [session, setSession] = useState<PaymentSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/session", {
        credentials: "same-origin",
      });
      const data = (await res.json()) as PaymentSessionState;
      if (!res.ok) {
        throw new Error("Could not load payment session");
      }
      setSession(data);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : "Session check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { session, loading, error, refresh };
}
