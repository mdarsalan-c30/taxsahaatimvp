import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CA_SESSION_COOKIE, readCASession } from "@/lib/auth/ca";
import { all } from "@/lib/db/store";
import { AIWorkspace } from "./AIWorkspace";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(CA_SESSION_COOKIE)?.value;
  const session = readCASession(token);

  if (!session) {
    redirect("/auth/ca-login");
  }

  const allContacts = await all("crmContacts");
  const client = allContacts.find(
    (c) => c.id === id && c.tenantId === session.tenantId
  );

  if (!client) {
    redirect("/ca/dashboard");
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/ca/dashboard" 
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Workspace: {client.email || "Client"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Status: <span className="uppercase font-semibold text-blue-600">{client.stage}</span> 
            {client.customFeeCharged && ` • Fee: ₹${client.customFeeCharged}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <AIWorkspace contactId={client.id} initialStatus={client.stage} />
      </div>
    </div>
  );
}
