import type { ConfidenceResult } from "@/lib/engine/types";
import type { PlanId } from "@/lib/filing/types";

export function recommendPlanFromConfidence(
  confidence: ConfidenceResult & { mismatch_detected?: boolean }
): PlanId {
  // Free plan logic if everything is 0
  if (
    confidence.completeness_score === 100 &&
    confidence.missing_documents.length === 0 &&
    confidence.mismatch_detected === false
  ) {
    return "free";
  }

  // If there are mismatches or missing docs, recommend the Pro plan
  if (confidence.mismatch_detected || confidence.missing_documents.length > 0) {
    return "pro";
  }

  // Otherwise, default to Normal plan
  return "normal";
}
