"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2, Play, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, IndianRupee } from "lucide-react";
import type { ComputeResponse } from "@/lib/engine/types";
import { AIResults } from "./AIResults";

const MOCK_COMPLEX_SCENARIO = {
  "age": 35,
  "assessment_year": "2025-26",
  "residential_status": "resident",
  "mode": "estimate",
  "salary": {
    "gross_salary": 1800000,
    "basic_salary": 900000,
    "hra_received": 450000,
    "actual_rent_paid": 480000,
    "city_tier": "metro",
    "professional_tax": 2400
  },
  "deductions": {
    "epf": 108000,
    "elss": 30000,
    "health_insurance_self": 20000
  },
  "taxes_paid": {
    "tds_salary": 200000
  }
};

export function AIWorkspace({ contactId, initialStatus }: { contactId: string, initialStatus: string }) {
  const router = useRouter();
  const [inputJson, setInputJson] = useState(JSON.stringify(MOCK_COMPLEX_SCENARIO, null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ComputeResponse | null>(null);
  const [filingLoading, setFilingLoading] = useState(false);

  const handleRunAI = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const parsed = JSON.parse(inputJson);
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Engine error");
      
      setResponse(data);
      
      // Mark as processed in DB
      await fetch("/api/ca/ai-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId })
      });
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || "Invalid JSON");
    } finally {
      setLoading(false);
    }
  };

  const handleFileReturn = async () => {
    setFilingLoading(true);
    try {
      const res = await fetch("/api/ca/file-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, simulationMode: "success" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Filing failed");
      alert("Return filed successfully! 1 Credit Deducted.");
      router.push("/ca/dashboard");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setFilingLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left side: Input */}
      <div className="w-full lg:w-1/3 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="size-5 text-purple-600" />
            Client Tax Data
          </h3>
          <button 
            onClick={handleRunAI}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Play className="size-4 mr-2" />}
            Run Engine
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 flex items-start gap-2">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        
        <p className="text-xs text-slate-500 mb-2">Edit the JSON payload to simulate different client scenarios.</p>
        <textarea 
          value={inputJson}
          onChange={e => setInputJson(e.target.value)}
          className="flex-1 w-full bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[500px]"
          spellCheck="false"
        />
      </div>

      {/* Right side: Results */}
      <div className="w-full lg:w-2/3">
        {!response ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <BrainCircuit className="size-16 mb-4 text-slate-300" />
            <p className="font-semibold text-lg text-slate-600">Awaiting Tax Data</p>
            <p className="text-sm mt-1 text-center max-w-sm">Hit "Run Engine" to process the client's raw tax data and extract maximum refunds.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AIResults response={response} />
            
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button 
                onClick={handleFileReturn}
                disabled={filingLoading || initialStatus === "won"}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
              >
                {filingLoading ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
                {initialStatus === "won" ? "Return Already Filed" : "Approve & File Return (1 Credit)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
