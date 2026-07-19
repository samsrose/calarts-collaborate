"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface LiveThreadProps {
  questionId: string;
  children: React.ReactNode;
}

export function LiveThread({ questionId, children }: LiveThreadProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Collapse bursts of realtime events into a single server refetch.
    const refresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        startTransition(() => router.refresh());
      }, 150);
    };

    const channel = supabase
      .channel(`thread-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `question_id=eq.${questionId}`,
        },
        refresh,
      )
      // Comments can hang off the question or any of its answers; answer
      // comments have a null question_id, so a server-side filter can't
      // match them — listen broadly and let the debounce absorb noise.
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        refresh,
      )
      .subscribe();

    const onFocus = () => startTransition(() => router.refresh());
    window.addEventListener("focus", onFocus);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [questionId, router]);

  return <>{children}</>;
}
