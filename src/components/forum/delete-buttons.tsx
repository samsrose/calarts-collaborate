"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteAnswerAction,
  deleteCommentAction,
  deleteQuestionAction,
} from "@/lib/actions/forum";

export function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteQuestionAction(questionId);
          if (result && !result.ok) toast.error(result.error);
        })
      }
    >
      Delete
    </Button>
  );
}

export function DeleteAnswerButton({
  answerId,
  questionId,
}: {
  answerId: string;
  questionId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteAnswerAction(answerId, questionId);
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      Delete
    </Button>
  );
}

export function DeleteCommentButton({
  commentId,
  questionId,
}: {
  commentId: string;
  questionId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteCommentAction(commentId, questionId);
          if (!result.ok) toast.error(result.error);
        })
      }
    >
      Delete
    </Button>
  );
}
