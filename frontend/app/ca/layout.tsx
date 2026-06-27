import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CA_SESSION_COOKIE, readCASession } from "@/lib/auth/ca";
import Link from "next/link";
import { Briefcase, LogOut } from "lucide-react";

export default async function CALayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(CA_SESSION_COOKIE)?.value;
  const session = readCASession(token);

  if (!session) {
    redirect("/auth/ca-login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Briefcase className="size-4" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight tracking-tight">CA Partner Portal</h1>
            <p className="text-[10px] font-medium text-slate-500">{session.firmName}</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          <Link href="/ca/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Clients Dashboard
          </Link>
          <Link href="/ca/dashboard/billing" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Billing & Packages
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700 hidden sm:block">
            {session.email}
          </span>
          <a
            href="/api/auth/ca/logout"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </a>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
