import type { Metadata } from "next";
import Link from "next/link";
import { PartnerApplyForm } from "@/components/marketing/PartnerApplyForm";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { PageShell } from "@/components/layout/PageShell";
import { B2B_PROFESSIONALS } from "@/lib/copy/marketing";
import { TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { pageMetadata } from "@/lib/seo";
import { Briefcase, CheckCircle2, Users } from "lucide-react";

export const metadata: Metadata = pageMetadata({
  title: "For Tax Professionals",
  description: B2B_PROFESSIONALS.subheadline,
  path: "/for-professionals",
});

export default function ForProfessionalsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageShell className="py-10 sm:py-12" contentClassName="max-w-5xl">
          <ScrollReveal delay={0}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              LastMinute Pro
            </p>
            <h1
              className={`mt-2 font-heading font-semibold text-foreground ${TYPOGRAPHY_SCALE.headline}`}
            >
              {B2B_PROFESSIONALS.headline}
            </h1>
            <p
              className={`mt-3 max-w-2xl text-muted-foreground ${TYPOGRAPHY_SCALE.body}`}
            >
              {B2B_PROFESSIONALS.subheadline}
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-10">
            <ScrollReveal delay={1} className="space-y-6">
              <ul className="space-y-3">
                {B2B_PROFESSIONALS.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-white/80 px-4 py-3 shadow-sm"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed text-foreground">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
                  <Users className="size-5 text-primary" aria-hidden />
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    10 or 100 clients
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Same tools whether you run a solo desk or a busy season
                    floor.
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
                  <Briefcase className="size-5 text-primary" aria-hidden />
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    You set client fees
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pay wholesale per return. Bill your clients whatever you
                    choose.
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Filing for yourself?{" "}
                <Link href="/" className="font-medium text-primary hover:underline">
                  Go to the consumer filing flow
                </Link>
              </p>
            </ScrollReveal>

            <ScrollReveal delay={2}>
              <PartnerApplyForm />
            </ScrollReveal>
          </div>
        </PageShell>
      </main>
      <SiteFooter />
    </>
  );
}
