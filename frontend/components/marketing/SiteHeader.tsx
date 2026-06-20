"use client";

import Link from "next/link";
import { useScrollNav } from "@/components/motion/useScrollNav";
import { ProfileNavLink } from "@/components/marketing/ProfileNavLink";
import { NavMenu } from "@/components/nav/NavMenu";
import { SITE_NAME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetCloseLink, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { FileText, Menu } from "lucide-react";

const NAV_ITEMS = [
  { href: "/file", label: "File" },
  { href: "/file/import/documents?source=form16", label: "Import" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/for-professionals", label: "For Tax Professionals" },
] as const;

const RESOURCE_ITEMS = [
  { href: "/learn", label: "Learn" },
  { href: "/help", label: "Help" },
  { href: "/tools", label: "Tools" },
  { href: "/glossary", label: "Glossary" },
  { href: "/blogs", label: "Blogs" },
] as const;

const MOBILE_EXTRA_ITEMS = [
  { href: "/reviews", label: "Reviews" },
  { href: "/chat", label: "Support chat" },
  { href: "/profile", label: "Profile" },
] as const;

const NAV_LINK_CLASS =
  "rounded-md px-2.5 py-1.5 text-[13px] font-medium leading-none text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:px-3 lg:text-sm";

export function SiteHeader() {
  const { scrolled } = useScrollNav();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-out",
        scrolled
          ? "border-border/80 bg-background/78 shadow-[0_1px_0_rgba(12,18,34,0.04)] backdrop-blur-2xl"
          : "border-border/40 bg-background/55 backdrop-blur-md"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-4 transition-[height] duration-300 ease-out sm:gap-3 sm:px-6",
          scrolled ? "h-12" : "h-14"
        )}
      >
        <Link
          href="/"
          className="flex min-w-0 max-w-[45%] shrink items-center gap-2 sm:max-w-none sm:gap-2.5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm sm:size-8 sm:rounded-xl">
            <FileText className="size-3.5 sm:size-4" aria-hidden />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base lg:text-[17px]">
            {SITE_NAME}
          </span>
        </Link>

        <nav
          className="hidden min-w-0 items-center gap-0.5 lg:flex"
          aria-label="Main"
        >
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_LINK_CLASS}>
              {item.label}
            </Link>
          ))}
          <NavMenu
            label="Resources"
            items={RESOURCE_ITEMS}
            triggerClassName={NAV_LINK_CLASS}
          />
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <ProfileNavLink className="hidden sm:flex" />
          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "lg:hidden"
              )}
              aria-label="Open menu"
            >
              <Menu className="size-[18px]" aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <nav className="flex flex-col gap-0.5 p-4" aria-label="Mobile">
                {NAV_ITEMS.map((item) => (
                  <SheetCloseLink
                    key={item.href}
                    href={item.href}
                    className="min-h-10 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
                  >
                    {item.label}
                  </SheetCloseLink>
                ))}
                <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resources
                </p>
                {RESOURCE_ITEMS.map((item) => (
                  <SheetCloseLink
                    key={item.href}
                    href={item.href}
                    className="min-h-10 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    {item.label}
                  </SheetCloseLink>
                ))}
                <div className="my-2 border-t border-border/60" />
                {MOBILE_EXTRA_ITEMS.map((item) => (
                  <SheetCloseLink
                    key={item.href}
                    href={item.href}
                    className="min-h-10 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    {item.label}
                  </SheetCloseLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link
            href="/file/import/documents?source=form16"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 max-w-[42vw] truncate rounded-lg px-2.5 text-[12px] font-semibold shadow-sm sm:max-w-none sm:px-4 sm:text-[13px] lg:h-9 lg:px-5 lg:text-sm"
            )}
          >
            <span className="hidden sm:inline">Upload </span>Form 16
          </Link>
        </div>
      </div>
    </header>
  );
}
