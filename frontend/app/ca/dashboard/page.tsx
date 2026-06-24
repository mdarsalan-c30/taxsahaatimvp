import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CA_SESSION_COOKIE, readCASession } from "@/lib/auth/ca";
import { all } from "@/lib/db/store";
import { Users, FileText, CheckCircle2, Clock } from "lucide-react";

export default async function CADashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CA_SESSION_COOKIE)?.value;
  const session = readCASession(token);

  if (!session) {
    redirect("/auth/ca-login");
  }

  // Fetch clients assigned to this CA
  const allContacts = await all("crmContacts");
  const myClients = allContacts.filter((c) => c.tenantId === session.tenantId);

  const pendingClients = myClients.filter((c) => c.stage === "active" || c.stage === "started");
  const completedClients = myClients.filter((c) => c.stage === "won");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your clients and review tax filings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <th className="px-6 py-4 font-semibold">Client Details</th>
                  <th className="px-6 py-4 font-semibold">Status / Stage</th>
                  <th className="px-6 py-4 font-semibold">Assigned On</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
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
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        Review Filing
                      </button>
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
