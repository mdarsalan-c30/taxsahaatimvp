import type {
  ComputeResponse,
  PortalForm,
  PortalGuideResponse,
  UserInput,
} from "./types";
import type { PortalDraftSlice } from "@/lib/filing/portalSop";

export async function fetchCompute(userInput: UserInput): Promise<ComputeResponse> {
  const res = await fetch("/api/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userInput),
  });
  const data = (await res.json()) as ComputeResponse;
  if (!res.ok) {
    return {
      ...data,
      ok: false,
      error: data.error ?? "Computation failed",
      code: data.code,
    };
  }
  return data;
}

export async function fetchLayer2Advice(handoffPayload: Record<string, unknown>): Promise<string> {
  const res = await fetch("/api/layer2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(handoffPayload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch AI advice");
  }
  return data.advice;
}

export async function fetchPortalGuide(
  form: PortalForm,
  computeResult?: unknown,
  completedSteps: number[] = [],
  mismatches: string[] = [],
  userInput?: UserInput,
  personalization?: {
    draft?: PortalDraftSlice;
    paymentUnlocked?: boolean;
  }
): Promise<PortalGuideResponse> {
  const res = await fetch(`/api/portal-guide/${encodeURIComponent(form)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      computeResult,
      userInput,
      completedSteps,
      mismatches,
      draft: personalization?.draft,
      paymentUnlocked: personalization?.paymentUnlocked,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Portal guide failed (${res.status})`);
  }
  return res.json();
}

export async function getPortalGuide(form: PortalForm): Promise<PortalGuideResponse> {
  const res = await fetch(`/api/portal-guide/${encodeURIComponent(form)}`);
  if (!res.ok) {
    throw new Error(`Portal guide not found for ${form}`);
  }
  return res.json();
}
