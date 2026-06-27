"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  heading?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  { items: [{ href: "/admin", label: "Home" }] },
  {
    heading: "B2C",
    items: [
      { href: "/admin/crm", label: "CRM" },
      { href: "/admin/coupons", label: "Coupons" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/pricing", label: "Pricing" },
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/sessions", label: "Sessions" },
      { href: "/admin/support", label: "Support" },
    ],
  },
  {
    heading: "B2B",
    items: [{ href: "/admin/partners", label: "Partners" }],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/blogs", label: "Blogs" },
    ],
  },
  {
    heading: "System",
    items: [
      { href: "/admin/compliance", label: "Compliance" },
      { href: "/admin/settings", label: "Team & roles" },
      { href: "/admin/credentials", label: "Credentials (Dev)" },
    ],
  },
];

export function Sidebar({ email, role }: { email: string; role: string }) {
  const pathname = usePathname();

  const isContentRole = ["content", "content_writer", "intern"].includes(role.toLowerCase());

  const displayedNav = NAV.filter((group) => {
    if (isContentRole) {
      return !group.heading || group.heading === "Content";
    }
    return true;
  });

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span className="text-sm font-semibold text-foreground">TaxSaathi</span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {displayedNav.map((group, i) => (
          <div key={group.heading ?? `g${i}`} className="mb-3">
            {group.heading && (
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.heading}
              </p>
            )}
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3 text-xs">
        <p className="truncate font-medium text-foreground">{email}</p>
        <p className="text-muted-foreground capitalize">{role}</p>
        <form action="/api/admin/logout" method="post" className="mt-2">
          <button
            type="submit"
            className="text-primary underline-offset-2 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
