"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilePicker } from "@/components/forum/file-picker";
import { createAnswerAction } from "@/lib/actions/forum";

interface AnswerFormProps {
  questionId: string;
}

export function AnswerForm({ questionId }: AnswerFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.delete("files");
    files.forEach((file) => formData.append("files", file));

    startTransition(async () => {
      const result = await createAnswerAction(questionId, formData);
      if (!result.ok) {
        toast.error(result.error ?? "Could not post answer.");
        return;
      }
      form.reset();
      setFiles([]);
      toast.success("Answer posted.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="answer-body">Your answer</Label>
        <Textarea
          id="answer-body"
          name="body"
          required
          rows={5}
          placeholder="Share your approach, references, or files."
        />
      </div>
      <FilePicker files={files} onChange={setFiles} disabled={pending} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Posting…" : "Post answer"}
      </Button>
    </form>
  );
}
