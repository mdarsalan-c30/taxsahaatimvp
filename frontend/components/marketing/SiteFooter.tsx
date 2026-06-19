import Link from "next/link";
import { CompactGrid } from "@/components/layout/CompactGrid";
import { PRICING_PLANS, SITE_NAME } from "@/lib/constants";
import { COMPACT_SECTION, CONTENT_MAX } from "@/lib/design/layout";
import { getDisplayPricing, formatPlanPriceLabel } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";
import { FileText, Mail } from "lucide-react";

const SUPPORT_EMAIL = "support@lastminute-itr.com";

const FOOTER_TAGLINE =
  "AI-assisted ITR prep — you file on incometax.gov.in. We never auto-file for you.";

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
        {title}
      </p>
      <ul className="mt-0.5 flex flex-col gap-0.5 text-tier-legal lg:flex-row lg:flex-wrap lg:gap-x-2.5 lg:gap-y-0.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div
        className={cn(
          "mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8 xl:px-8",
          COMPACT_SECTION.footer,
          CONTENT_MAX
        )}
      >
        <CompactGrid cols={4}>
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <FileText className="size-2.5" />
              </span>
              <p className="text-xs font-bold">{SITE_NAME}</p>
            </div>
            <p className="mt-0.5 line-clamp-1 text-tier-legal">{FOOTER_TAGLINE}</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-0.5 inline-flex items-center gap-1 text-tier-legal text-primary hover:underline"
            >
              <Mail className="size-3" />
              {SUPPORT_EMAIL}
            </a>
          </div>

          <FooterLinkColumn
            title="Learn"
            links={[
              { href: "/blogs", label: "Blogs" },
              { href: "/learn", label: "Guides" },
              { href: "/glossary", label: "Glossary" },
            ]}
          />

          <FooterLinkColumn
            title="Product"
            links={[
              { href: "/#pricing", label: "Pricing" },
              { href: "/reviews", label: "Reviews" },
              { href: "/chat", label: "Support chat" },
              { href: "/profile", label: "Profile" },
            ]}
          />

          <FooterLinkColumn
            title="Legal"
            links={[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Service" },
              { href: "/refund-policy", label: "Refund Policy" },
              { href: "/disclaimer", label: "Disclaimer" },
            ]}
          />
        </CompactGrid>
      </div>

      <div className="border-t border-border/60 bg-muted/30">
        <div className={cn("mx-auto px-4 py-2 sm:px-6 lg:px-8", CONTENT_MAX)}>
          <details className="group">
            <summary className="cursor-pointer list-none text-tier-legal [&::-webkit-details-marker]:hidden">
              <span className="font-medium text-foreground">Compliance notice</span>
              <span className="ml-1 group-open:hidden">
                — {SITE_NAME} is independently operated; you file on incometax.gov.in.{" "}
                <Link href="/disclaimer" className="text-primary underline">
                  Full disclaimer
                </Link>
              </span>
              <span className="ml-1 hidden group-open:inline text-primary">Hide</span>
            </summary>
            <p className="mt-1.5 text-tier-legal leading-relaxed">
              {SITE_NAME} is independently operated. We are not a chartered accountancy firm unless
              you purchase an explicit CA review plan. You file and e-verify your return directly on
              the official{" "}
              <a
                href="https://www.incometax.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                incometax.gov.in
              </a>
              . Tax/refund estimates are illustrative — final amounts are determined by ITD. We do
              not guarantee refunds. Your data is handled per our Privacy Policy with reasonable
              security safeguards.{" "}
              <Link href="/disclaimer" className="text-primary underline">
                Read full disclaimer
              </Link>
            </p>
          </details>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/40 pt-1.5 text-tier-legal">
            <span className="shrink-0">
              © {new Date().getFullYear()} {SITE_NAME}
            </span>
            <span className="hidden text-muted-foreground sm:inline" aria-hidden>
              ·
            </span>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              {PRICING_PLANS.map((plan, index) => {
                const pricing = getDisplayPricing(plan.id);
                return (
                  <span key={plan.id} className="inline-flex items-center gap-x-2 whitespace-nowrap">
                    {index > 0 ? (
                      <span className="text-muted-foreground" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    <span>
                      {plan.name}:{" "}
                      {pricing.showOffer && pricing.original !== undefined ? (
                        <>
                          {formatPlanPriceLabel(pricing.current)}{" "}
                          <span className="line-through opacity-70">
                            {formatPlanPriceLabel(pricing.original)}
                          </span>
                        </>
                      ) : (
                        formatPlanPriceLabel(pricing.current)
                      )}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
