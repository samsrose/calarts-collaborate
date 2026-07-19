"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCommentAction } from "@/lib/actions/forum";

interface CommentFormProps {
  threadQuestionId: string;
  questionId?: string;
  answerId?: string;
}

export function CommentForm({
  threadQuestionId,
  questionId,
  answerId,
}: CommentFormProps) {
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");

    startTransition(async () => {
      const result = await createCommentAction({
        threadQuestionId,
        questionId,
        answerId,
        body,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not add comment.");
        return;
      }
      form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex gap-2">
      <Input
        name="body"
        required
        maxLength={2000}
        placeholder="Add a comment…"
        className="h-8"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "…" : "Comment"}
      </Button>
    </form>
  );
}
