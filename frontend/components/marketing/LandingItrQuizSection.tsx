import { ItrTypeQuiz } from "@/components/marketing/ItrTypeQuiz";
import { CONTENT_MAX } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function LandingItrQuizSection() {
  return (
    <section
      id="itr-quiz"
      className="section-compact-tight border-b border-border/40 bg-muted/10 px-4 sm:px-6 lg:px-8"
    >
      <div className={cn("mx-auto w-full min-w-0", CONTENT_MAX)}>
        <ItrTypeQuiz />
      </div>
    </section>
  );
}
