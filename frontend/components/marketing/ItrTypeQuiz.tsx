"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ITR_TYPE_QUIZ,
  suggestItrType,
  type ItrQuizAnswers,
} from "@/lib/content/hooks";
import { cn } from "@/lib/utils";
import { ArrowRight, ClipboardList } from "lucide-react";

const EMPTY_ANSWERS: ItrQuizAnswers = {
  income: "",
  employers: "",
  property: "",
  income_level: "",
  residency: "",
};

export function ItrTypeQuiz() {
  const [answers, setAnswers] = useState<ItrQuizAnswers>(EMPTY_ANSWERS);
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = ITR_TYPE_QUIZ.questions.every(
    (q) => answers[q.id as keyof ItrQuizAnswers] !== ""
  );

  const resultKey = useMemo(() => {
    if (!submitted || !allAnswered) return null;
    return suggestItrType(answers);
  }, [answers, allAnswered, submitted]);

  const result = resultKey ? ITR_TYPE_QUIZ.results[resultKey] : null;

  return (
    <div className="landing-card p-4 sm:p-5">
      <div className="flex items-start gap-2">
        <ClipboardList className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <h3 className="text-base font-semibold text-foreground">{ITR_TYPE_QUIZ.headline}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{ITR_TYPE_QUIZ.subhead}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {ITR_TYPE_QUIZ.questions.map((question) => (
          <fieldset key={question.id} className="min-w-0">
            <legend className="text-sm font-medium text-foreground">{question.prompt}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {question.options.map((option) => {
                const selected =
                  answers[question.id as keyof ItrQuizAnswers] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: option.value,
                      }));
                    }}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition sm:text-sm",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 bg-white text-foreground shadow-sm hover:border-gray-300 hover:bg-muted/40"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!allAnswered}
          onClick={() => setSubmitted(true)}
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          See suggestion
        </button>
        <button
          type="button"
          onClick={() => {
            setAnswers(EMPTY_ANSWERS);
            setSubmitted(false);
          }}
          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          Reset
        </button>
      </div>

      {result && resultKey ? (
        <div
          className={cn(
            "mt-4 rounded-xl border p-4",
            resultKey === "talkToCa"
              ? "border-amber-300/80 bg-amber-50/50"
              : "border-emerald-300/80 bg-emerald-50/50"
          )}
        >
          <p className="text-sm font-semibold text-foreground">{result.form}</p>
          <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>
          <p className="mt-2 text-tier-legal text-muted-foreground">
            Rule-based suggestion only — confirm on incometax.gov.in before submitting.
          </p>
          <Link
            href={result.href}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Continue to filing prep
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
