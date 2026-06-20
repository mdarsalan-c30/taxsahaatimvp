"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { BlogCTA } from "@/components/marketing/BlogCTA";
import { FaqJsonLd } from "@/components/marketing/FaqJsonLd";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import {
  HELP_ARTICLES,
  HELP_PILLARS,
  type HelpPillar,
} from "@/lib/content/help-articles";
import { HELP_HUB } from "@/lib/copy/help";
import { HELP_FAQS } from "@/lib/content/faqs";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function HelpHubPage() {
  const [query, setQuery] = useState("");
  const [pillar, setPillar] = useState<HelpPillar | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HELP_ARTICLES.filter((article) => {
      if (pillar !== "all" && article.pillar !== pillar) return false;
      if (!q) return true;
      const haystack = [
        article.title,
        article.summary,
        ...article.keywords,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, pillar]);

  return (
    <>
      <FaqJsonLd faqs={HELP_FAQS} />
      <SiteHeader />
      <PageShell className="py-10 sm:py-12" contentClassName="max-w-4xl">
        <ScrollReveal delay={0}>
          <h1 className={`font-semibold text-foreground ${TYPOGRAPHY_SCALE.headline}`}>
            {HELP_HUB.title}
          </h1>
          <p className={`mt-2 text-muted-foreground ${TYPOGRAPHY_SCALE.body}`}>
            {HELP_HUB.subtitle}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={1} className="mt-6">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={HELP_HUB.searchPlaceholder}
              className="w-full rounded-xl border border-border/70 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-primary/20 focus:ring-2"
            />
          </label>
        </ScrollReveal>

        <ScrollReveal delay={1} className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPillar("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              pillar === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:bg-muted/40"
            )}
          >
            All
          </button>
          {HELP_PILLARS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPillar(p.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                pillar === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:bg-muted/40"
              )}
            >
              {p.label}
            </button>
          ))}
        </ScrollReveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {HELP_PILLARS.map((p) => (
            <ScrollReveal key={p.id} delay={2}>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <h2 className="text-sm font-semibold text-foreground">{p.label}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ul className="mt-8 space-y-3">
          {filtered.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No articles match — try &quot;AIS&quot; or &quot;e-verify&quot;, or browse{" "}
              <Link href="/learn" className="text-primary hover:underline">
                Learn guides
              </Link>
              .
            </li>
          ) : (
            filtered.map((article) => (
              <li key={article.slug}>
                <Link href={article.href} className="block">
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="py-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary">
                        {HELP_PILLARS.find((p) => p.id === article.pillar)?.label}
                      </p>
                      <CardTitle className="text-base">{article.title}</CardTitle>
                      <CardDescription>{article.summary}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))
          )}
        </ul>

        <div className="mt-10">
          <BlogCTA />
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
