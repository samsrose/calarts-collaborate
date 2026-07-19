"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { MessageSquareIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { avatarPublicUrl } from "@/lib/avatar";
import type { QuestionListItem } from "@/lib/types";

interface QuestionListProps {
  questions: QuestionListItem[];
}

export function QuestionList({ questions }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
        <p className="font-heading text-xl">No questions yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to ask across schools.
        </p>
        <Link
          href="/questions/new"
          className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Ask a question
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card/50">
      {questions.map((question) => {
        const avatar = avatarPublicUrl(question.author.avatar_path);
        const initials = question.author.display_name.slice(0, 2).toUpperCase();

        return (
          <li key={question.id} className="transition-colors hover:bg-muted/40">
            <Link
              href={`/questions/${question.id}`}
              className="flex gap-4 px-4 py-4 sm:px-5"
            >
              <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 text-muted-foreground">
                <MessageSquareIcon className="size-4" />
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {question.answer_count}
                </span>
                <span className="text-[10px] uppercase tracking-wide">
                  ans
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base leading-snug text-foreground sm:text-lg">
                  {question.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {question.schools.map((school) => (
                    <Badge key={school.id} variant="secondary">
                      {school.name}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="size-5">
                    {avatar ? (
                      <AvatarImage
                        src={avatar}
                        alt={question.author.display_name}
                      />
                    ) : null}
                    <AvatarFallback className="text-[9px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span>{question.author.display_name}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={question.last_activity_at}>
                    {formatDistanceToNow(new Date(question.last_activity_at), {
                      addSuffix: true,
                    })}
                  </time>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
