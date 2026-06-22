"use client";

import Link from "next/link";
import { useScrollNav } from "@/components/motion/useScrollNav";
import { ProfileNavLink } from "@/components/marketing/ProfileNavLink";
import { Sheet, SheetCloseLink, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

import { NavMenu } from "@/components/nav/NavMenu";

const PRODUCTS_LINKS = [
  { href: "/#", label: "Individual Tax Filing" },
  { href: "/#b2b", label: "For Tax Professionals" },
  { href: "/#pricing", label: "Pricing" },
];

const RESOURCES_LINKS = [
  { href: "/blogs", label: "Blogs" },
  { href: "/guides", label: "Filing Guides" },
  { href: "/glossary", label: "Tax Glossary" },
  { href: "/news", label: "News & Updates" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/support", label: "Contact/Support" },
];

const MOBILE_EXTRA = [
  ...PRODUCTS_LINKS,
  ...RESOURCES_LINKS,
  ...COMPANY_LINKS,
];

export function SiteHeader() {
  const { scrolled } = useScrollNav();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-[#E6E8EC] bg-[rgba(250,250,251,0.92)] shadow-[0_1px_0_rgba(12,18,34,0.06)] backdrop-blur-[14px] saturate-150"
          : "border-[#E6E8EC]/60 bg-[rgba(250,250,251,0.70)] backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-8 h-[72px] max-[560px]:h-[64px] max-[560px]:px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-manrope font-extrabold text-[18px] tracking-[-0.01em] text-[#0B1220] max-[560px]:text-base">
          <svg className="size-[30px] max-[560px]:size-[26px] flex-shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden>
            <path d="M14 6h12l8 8v6H14V6z" fill="#06C6D4"/>
            <path d="M10 14h13v9h13l-13 13-13-13h9v-9z" fill="#1D4ED8"/>
          </svg>
          <span>Lastminute<span className="text-[#1D4ED8]">ITR</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-9 lg:flex" aria-label="Main navigation">
          <NavMenu label="Products" items={PRODUCTS_LINKS} triggerClassName="text-[14.5px] font-medium text-[#2B3344] hover:text-[#1D4ED8]" />
          <NavMenu label="Resources" items={RESOURCES_LINKS} triggerClassName="text-[14.5px] font-medium text-[#2B3344] hover:text-[#1D4ED8]" />
          <NavMenu label="Company" items={COMPANY_LINKS} triggerClassName="text-[14.5px] font-medium text-[#2B3344] hover:text-[#1D4ED8]" />
        </nav>

        {/* CTA cluster */}
        <div className="flex items-center gap-3.5">
          <ProfileNavLink className="hidden sm:flex" />
          {/* Upload Form 16 — secondary pill (hidden on mobile) */}
          <Link
            href="/file/import/documents?source=form16"
            className="btn-pill-secondary hidden py-[10px] px-5 text-[14px] max-[860px]:hidden"
          >
            Upload Form 16
          </Link>
          {/* Start my return — primary pill */}
          <Link
            href="/#pricing"
            className="btn-pill-primary py-[10px] px-5 text-[14px] max-[560px]:px-4 max-[380px]:hidden"
          >
            Start my return
          </Link>
          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger
              className="flex size-9 items-center justify-center rounded-lg border border-[#E6E8EC] bg-white text-[#0B1220] transition hover:bg-[#F3F4F7] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-[18px]" aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <nav className="flex flex-col gap-0.5 p-4" aria-label="Mobile navigation">
                {MOBILE_EXTRA.map((item) => (
                  <SheetCloseLink
                    key={item.href}
                    href={item.href}
                    className="min-h-10 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
                  >
                    {item.label}
                  </SheetCloseLink>
                ))}
                <div className="mt-3 border-t border-border/60 pt-3">
                  <SheetCloseLink
                    href="/file/import/documents?source=form16"
                    className="btn-pill-primary block w-full text-center py-3"
                  >
                    Upload Form 16
                  </SheetCloseLink>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
