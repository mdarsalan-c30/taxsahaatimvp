import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLearnArticle } from "@/lib/content/learn-articles";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { ArrowRight, BookOpen } from "lucide-react";

const PRIORITY_GUIDE_SLUGS = [
  "file-itr-without-ca",
  "old-vs-new-regime",
  "itr-1-salaried-guide",
  "ais-mismatch",
  "last-minute-filing",
  "two-form-16-job-change",
] as const;

function getPriorityGuides() {
  return PRIORITY_GUIDE_SLUGS.map((slug) => getLearnArticle(slug)).filter(
    (article): article is NonNullable<typeof article> => article !== undefined
  );
}

export function PopularGuides() {
  const guides = getPriorityGuides();

  return (
    <section className="section-compact-tight border-b border-border/40 bg-muted/30 px-4 sm:px-6 lg:px-8">
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-tier-feature font-medium text-primary">
              <BookOpen className="size-3.5" />
              Popular guides
            </div>
            <h2 className={`mt-1 font-heading font-bold ${TYPOGRAPHY_SCALE.headline}`}>
              Read before you file
            </h2>
            <p className={`mt-1 max-w-xl text-muted-foreground ${TYPOGRAPHY_SCALE.caption}`}>
              Plain-English explainers on filing without a CA, regimes, AIS gaps, and Sahaj for
              salaried Indians.
            </p>
          </div>
          <Link
            href="/learn"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
          >
            All guides
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <ul
          className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Popular filing guides"
        >
          {guides.map((article) => (
            <li key={article.slug} className="shrink-0 snap-start">
              <Link href={`/learn/${article.slug}`} className="block h-40 w-64">
                <article className="landing-card h-full justify-between hover:shadow-md">
                  <div>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                      {article.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                      {article.description}
                    </p>
                  </div>
                  <p className="text-tier-feature text-muted-foreground">{article.readMinutes} min read</p>
                </article>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium">Ready to import your documents?</p>
            <p className={`mt-0.5 text-muted-foreground ${TYPOGRAPHY_SCALE.caption}`}>
              Upload Form 16 and AIS — get a free estimate before you file on incometax.gov.in.
            </p>
          </div>
          <Link
            href="/file/import/documents?source=form16"
            className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
          >
            Import Form 16 — free estimate
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
