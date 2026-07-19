import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
