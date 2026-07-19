"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { School } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SchoolFilterProps {
  schools: School[];
}

export function SchoolFilter({ schools }: SchoolFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = new Set(
    (searchParams.get("schools") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  function toggle(schoolId: string) {
    const next = new Set(selected);
    if (next.has(schoolId)) next.delete(schoolId);
    else next.add(schoolId);

    const params = new URLSearchParams(searchParams.toString());
    if (next.size === 0) params.delete("schools");
    else params.set("schools", Array.from(next).join(","));
    router.push(`/?${params.toString()}`);
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("schools");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {schools.map((school) => {
        const isActive = selected.has(school.id);
        return (
          <button
            key={school.id}
            type="button"
            onClick={() => toggle(school.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/70 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {school.name}
          </button>
        );
      })}
      {selected.size > 0 ? (
        <Button variant="ghost" size="xs" onClick={clear}>
          Clear
        </Button>
      ) : null}
      {selected.size === 0 ? (
        <Badge variant="outline" className="font-normal">
          All schools
        </Badge>
      ) : null}
    </div>
  );
}
