import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CA_SESSION_COOKIE, readCASession } from "@/lib/auth/ca";
import { all } from "@/lib/db/store";
import { Users, FileText, CheckCircle2, Clock, BrainCircuit } from "lucide-react";
import { CAClientActions } from "./ClientActionButtons";
import { AddClientHeader } from "./AddClientHeader";

export default async function CADashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CA_SESSION_COOKIE)?.value;
  const session = readCASession(token);

  if (!session) {
    redirect("/auth/ca-login");
  }

  // Fetch tenant details for credits
  const tenants = await all("tenants");
  const tenant = tenants.find((t) => t.id === session.tenantId);
  const creditsAvailable = tenant?.creditsAvailable || 0;

  // Fetch clients assigned to this CA
  const allContacts = await all("crmContacts");
  const myClients = allContacts.filter((c) => c.tenantId === session.tenantId);

  const pendingClients = myClients.filter((c) => c.stage === "active" || c.stage === "started");
  const completedClients = myClients.filter((c) => c.stage === "won");
  const aiProcessedClients = myClients.filter((c) => c.aiStatus === "processed");

  const totalEarnings = completedClients.reduce((sum, c) => sum + (c.customFeeCharged || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your clients and review tax filings.</p>
        </div>
        <AddClientHeader />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Clients</p>
              <h3 className="text-2xl font-bold text-slate-900">{myClients.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Review</p>
              <h3 className="text-2xl font-bold text-slate-900">{pendingClients.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <h3 className="text-2xl font-bold text-slate-900">{completedClients.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BrainCircuit className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">AI Processed</p>
              <h3 className="text-2xl font-bold text-slate-900">{aiProcessedClients.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm text-white">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-400">Total Earnings</p>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-800 rounded-md text-emerald-400">
              {creditsAvailable} credits left
            </span>
          </div>
          <h3 className="text-3xl font-black tabular-nums">
            ₹{totalEarnings.toLocaleString("en-IN")}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Assigned Clients</h3>
        </div>
        
        {myClients.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-slate-100 mb-4">
              <FileText className="size-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-700">No clients assigned yet</h4>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              When a user purchases the Expert Review plan and is assigned to your firm, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Client Details</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Status / Stage</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">AI Status</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Fee Charged</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Assigned On</th>
                  <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{client.email || "User"}</p>
                      <p className="text-xs text-slate-500">ID: {client.sessionId?.substring(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {client.stage.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {client.aiStatus === "processed" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                          <BrainCircuit className="size-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      ₹{client.customFeeCharged ? client.customFeeCharged.toLocaleString("en-IN") : "0"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CAClientActions contactId={client.id} currentStage={client.stage} aiStatus={client.aiStatus || "pending"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
