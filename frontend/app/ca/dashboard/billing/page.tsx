import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CA_SESSION_COOKIE, readCASession } from "@/lib/auth/ca";
import { all } from "@/lib/db/store";
import { CheckCircle2, ShieldCheck, Quote } from "lucide-react";

export default async function CABillingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CA_SESSION_COOKIE)?.value;
  const session = readCASession(token);

  if (!session) {
    redirect("/auth/ca-login");
  }

  const tenants = await all("tenants");
  const tenant = tenants.find((t) => t.id === session.tenantId);
  const credits = tenant?.creditsAvailable || 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Packages</h2>
        <p className="text-sm text-slate-500 mt-1">
          Purchase application credits in bulk. You currently have <span className="font-bold text-slate-800">{credits} credits</span> available.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 20 Pack */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col overflow-hidden">
          <div className="p-6 flex-1">
            <h3 className="font-bold text-xl text-slate-900">20 Applications</h3>
            <p className="text-xs text-slate-500 mb-6">Valid for 1 year</p>
            
            <div className="flex items-end gap-2 mb-6">
              <span className="text-3xl font-black tabular-nums tracking-tight">₹5,000</span>
              <span className="text-sm text-slate-400 line-through mb-1.5">₹7,180</span>
            </div>
            
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Assign up to 20 clients</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Credit wallet & analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Robust CRM dashboard tracking</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-600">₹250 / filing</span>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition">
              Buy Now
            </button>
          </div>
        </div>

        {/* 40 Pack - Most Popular */}
        <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md relative flex flex-col overflow-hidden transform md:-translate-y-2">
          <div className="absolute top-0 inset-x-0 h-1 bg-blue-500" />
          <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Most Popular
          </div>
          <div className="p-6 flex-1">
            <h3 className="font-bold text-xl text-slate-900">40 Applications</h3>
            <p className="text-xs text-slate-500 mb-6">Valid for 1 year</p>
            
            <div className="flex items-end gap-2 mb-6">
              <span className="text-3xl font-black tabular-nums tracking-tight">₹9,000</span>
              <span className="text-sm text-slate-400 line-through mb-1.5">₹14,360</span>
            </div>
            
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Assign up to 40 clients</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Credit wallet & analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Robust CRM dashboard tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="font-medium text-slate-900">Priority error rollback</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
            <span className="text-sm font-bold text-blue-700">₹225 / filing</span>
            <button className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
              Buy Now
            </button>
          </div>
        </div>

        {/* 100 Pack */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col overflow-hidden">
          <div className="p-6 flex-1">
            <h3 className="font-bold text-xl text-slate-900">100 Applications</h3>
            <p className="text-xs text-slate-500 mb-6">Valid for 1 year</p>
            
            <div className="flex items-end gap-2 mb-6">
              <span className="text-3xl font-black tabular-nums tracking-tight">₹15,999</span>
              <span className="text-sm text-slate-400 line-through mb-1.5">₹35,900</span>
            </div>
            
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Assign up to 100 clients</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Credit wallet & analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Robust CRM dashboard tracking</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-600">₹160 / filing</span>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition">
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 md:p-10 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <ShieldCheck className="size-6 text-emerald-400" />
            <h3 className="text-xl font-bold">Trusted by Tax Professionals</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <Quote className="size-6 text-slate-500 mb-4" />
              <p className="text-slate-300 italic text-sm mb-4">
                "The CRM tool acts like a mini accounting tracker for my firm. I can see all my clients, enter the custom fees I charge them, and track my total earnings right from the dashboard. It's incredibly robust."
              </p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">SP</div>
                <div>
                  <p className="text-sm font-bold">Sanjay Patel</p>
                  <p className="text-xs text-slate-400">Chartered Accountant, Mumbai</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <Quote className="size-6 text-slate-500 mb-4" />
              <p className="text-slate-300 italic text-sm mb-4">
                "The credit system is flawless. I bought the 40-pack, and it automatically deducts a credit only when filing is successful. If there's an error, the credit rolls back immediately. Production-ready logic."
              </p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">RN</div>
                <div>
                  <p className="text-sm font-bold">Riya Nambiar</p>
                  <p className="text-xs text-slate-400">Tax Consultant, Bengaluru</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
