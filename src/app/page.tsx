import Link from "next/link";
import { Suspense } from "react";
import { LiveQuestionFeed } from "@/components/forum/live-question-feed";
import { SchoolFilter } from "@/components/forum/school-filter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getQuestions, getSchools } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface HomePageProps {
  searchParams: Promise<{ schools?: string; sort?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const schoolFilter = (params.schools ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sort = params.sort === "newest" ? "newest" : "activity";

  const schools = getSchools();
  const questions = await getQuestions({ schoolIds: schoolFilter, sort });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
            Questions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collaborate across CalArts schools — ask, answer, and share files.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/questions/new" />}>
          Ask a question
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-8 w-full" />}>
        <SchoolFilter schools={schools} />
      </Suspense>

      <div className="flex gap-2 text-sm">
        <SortLink active={sort === "activity"} href={buildSortHref(params, "activity")}>
          Recent activity
        </SortLink>
        <SortLink active={sort === "newest"} href={buildSortHref(params, "newest")}>
          Newest
        </SortLink>
      </div>

      <LiveQuestionFeed initialQuestions={questions} />
    </div>
  );
}

function SortLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-2.5 py-1 transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function buildSortHref(
  params: { schools?: string; sort?: string },
  sort: "activity" | "newest",
) {
  const next = new URLSearchParams();
  if (params.schools) next.set("schools", params.schools);
  if (sort !== "activity") next.set("sort", sort);
  const qs = next.toString();
  return qs ? `/?${qs}` : "/";
}
