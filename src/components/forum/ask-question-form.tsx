"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FilePicker } from "@/components/forum/file-picker";
import { createQuestionAction } from "@/lib/actions/forum";
import type { School } from "@/lib/types";

interface AskQuestionFormProps {
  schools: School[];
}

export function AskQuestionForm({ schools }: AskQuestionFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function toggleSchool(id: string, checked: boolean) {
    setSelectedSchools((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id),
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.delete("schools");
    selectedSchools.forEach((id) => formData.append("schools", id));
    formData.delete("files");
    files.forEach((file) => formData.append("files", file));

    startTransition(async () => {
      const result = await createQuestionAction(formData);
      if (result && !result.ok) {
        toast.error(result.error ?? "Could not create question.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="What are you trying to collaborate on?"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Details</Label>
        <Textarea
          id="body"
          name="body"
          required
          rows={8}
          placeholder="Share context, goals, and how other schools can help. Markdown supported."
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <Legend>Schools involved</Legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {schools.map((school) => (
            <label
              key={school.id}
              className="flex items-center gap-2 rounded-md border border-border/70 bg-background/50 px-3 py-2 text-sm"
            >
              <Checkbox
                checked={selectedSchools.includes(school.id)}
                onCheckedChange={(checked) =>
                  toggleSchool(school.id, Boolean(checked))
                }
              />
              {school.name}
            </label>
          ))}
        </div>
      </fieldset>

      <FilePicker files={files} onChange={setFiles} disabled={pending} />

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Posting…" : "Post question"}
      </Button>
    </form>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="text-sm font-medium text-foreground">{children}</legend>
  );
}
