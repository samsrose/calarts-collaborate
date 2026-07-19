import type { Metadata } from "next";
import { AskQuestionForm } from "@/components/forum/ask-question-form";
import { getSchools } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Ask a question",
};

export default function NewQuestionPage() {
  const schools = getSchools();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl">Ask a question</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tag the CalArts schools that should see this — and attach files if useful.
        </p>
      </div>
      <AskQuestionForm schools={schools} />
    </div>
  );
}
