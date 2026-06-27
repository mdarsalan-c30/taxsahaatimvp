"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function CAClientActions({ contactId, currentStage }: { contactId: string, currentStage: string, aiStatus: string }) {
  const router = useRouter();

  if (currentStage === "won") {
    return <span className="text-xs font-semibold text-slate-400">Completed</span>;
  }

  return (
    <div className="flex items-center justify-end">
      <button 
        onClick={() => router.push(`/ca/dashboard/client/${contactId}`)}
        className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center shadow-sm"
      >
        Open Workspace
        <ArrowRight className="size-3 ml-1.5" />
      </button>
    </div>
  );
}
