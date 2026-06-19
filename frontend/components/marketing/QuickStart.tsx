import Link from "next/link";
import { COMPANION_QUICKSTART_ONELINER } from "@/lib/copy/companion";
import { IMPORT_STRIP, SCALE_PROOF } from "@/lib/copy/competitorInspired";
import { QUICK_START_CONNECTORS } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Landmark,
  TrendingUp,
  Wallet,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  form16: FileText,
  ais: Landmark,
  groww: TrendingUp,
  mfcentral: Wallet,
};

const CONNECTOR_STATUS_LABEL: Record<
  (typeof IMPORT_STRIP.connectors)[number]["status"],
  { label: string; className: string }
> = {
  live: { label: "Live", className: "bg-emerald-500/15 text-emerald-300" },
  soon: { label: "Soon", className: "bg-amber-500/15 text-amber-300" },
  roadmap: { label: "Roadmap", className: "bg-white/10 text-zinc-400" },
};

function ImportStrip() {
  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Supported document imports">
      {IMPORT_STRIP.connectors.map((connector) => {
        const status = CONNECTOR_STATUS_LABEL[connector.status];
        return (
          <li
            key={connector.id}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
          >
            <span className="font-medium text-white">{connector.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
              {status.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function DashboardMock() {
  return (
    <div className="card-premium-dark overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-400/80" />
          <span className="size-2 rounded-full bg-amber-400/80" />
          <span className="size-2 rounded-full bg-emerald-400/80" />
        </div>
        <span className="text-xs text-zinc-500">Filing dashboard</span>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Estimated refund</p>
            <p className="text-2xl font-bold text-emerald-400">{formatINR(18420)}</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            New regime
          </span>
        </div>
        <div className="space-y-2">
          {[
            { label: "Form 16 imported", done: true },
            { label: "AIS reconciled", done: true },
            { label: "Regime optimized", done: true },
            { label: "Ready to file", done: false },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
            >
              <CheckCircle2
                className={`size-4 ${item.done ? "text-emerald-400" : "text-zinc-600"}`}
              />
              <span className={`text-sm ${item.done ? "text-zinc-300" : "text-zinc-500"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-primary/20 px-4 py-3">
          <p className="text-xs font-medium text-blue-300">Filing confidence</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[87%] rounded-full bg-primary" />
            </div>
            <span className="text-sm font-bold text-white">87%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickStart() {
  return (
    <section className="section-dark py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              {IMPORT_STRIP.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              {IMPORT_STRIP.headline}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-400">
              {IMPORT_STRIP.subhead}
            </p>
            <ImportStrip />
            <p className="mt-3 max-w-lg text-xs leading-relaxed text-zinc-500">
              {COMPANION_QUICKSTART_ONELINER}
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{SCALE_PROOF.headline}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {SCALE_PROOF.detail}
              </p>
            </div>
            <div className="mt-8 hidden lg:block">
              <DashboardMock />
            </div>
          </div>

          <div className="grid h-full gap-3 sm:grid-cols-2">
            {QUICK_START_CONNECTORS.map((connector) => {
              const Icon = ICONS[connector.id] ?? FileText;
              return (
                <Link
                  key={connector.id}
                  href={connector.href}
                  className="group card-premium-dark flex h-full flex-col p-4 transition-all hover:border-blue-500/30 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 transition-colors group-hover:bg-blue-600/30">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-white">{connector.title}</h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-zinc-400">
                    {connector.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Connect
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-10 lg:hidden">
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}
