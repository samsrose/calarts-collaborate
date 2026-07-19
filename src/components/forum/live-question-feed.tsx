"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { QuestionListItem } from "@/lib/types";
import { QuestionList } from "@/components/forum/question-list";

interface LiveQuestionFeedProps {
  initialQuestions: QuestionListItem[];
}

export function LiveQuestionFeed({ initialQuestions }: LiveQuestionFeedProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Subscribe once per mount — refresh re-runs the server query with the
  // current URL filters, so the channel doesn't need filter-aware deps.
  useEffect(() => {
    const supabase = createClient();

    const refresh = () => startTransition(() => router.refresh());

    const channel = supabase
      .channel("questions-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "questions" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "questions" },
        refresh,
      )
      .subscribe();

    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return <QuestionList questions={initialQuestions} />;
}
