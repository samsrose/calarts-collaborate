import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { avatarPublicUrl } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/server";
import type { School } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Profile and history queries are independent — fetch everything in parallel.
  const [
    { data: profile },
    { data: questions },
    { data: answers },
    { data: comments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `
        *,
        profile_schools ( school:schools (*) )
      `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("questions")
      .select("id, title, created_at")
      .eq("author_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("answers")
      .select("id, body, created_at, question_id")
      .eq("author_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select(
        "id, body, created_at, question_id, answer_id, answer:answers!comments_answer_id_fkey ( question_id )",
      )
      .eq("author_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) notFound();

  const schools =
    (
      profile.profile_schools as { school: School | null }[] | null
    )?.flatMap((ps) => (ps.school ? [ps.school] : [])) ?? [];

  const avatar = avatarPublicUrl(profile.avatar_path);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <Avatar className="size-16">
          {avatar ? (
            <AvatarImage src={avatar} alt={profile.display_name} />
          ) : null}
          <AvatarFallback>
            {profile.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-3xl">{profile.display_name}</h1>
          {profile.bio ? (
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {profile.bio}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {schools.map((school) => (
              <Badge key={school.id} variant="secondary">
                {school.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">
            Questions ({questions?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="answers">
            Answers ({answers?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="comments">
            Comments ({comments?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4">
          <HistoryList
            empty="No questions yet."
            items={(questions ?? []).map((q) => ({
              id: q.id,
              href: `/questions/${q.id}`,
              title: q.title,
              at: q.created_at,
            }))}
          />
        </TabsContent>

        <TabsContent value="answers" className="mt-4">
          <HistoryList
            empty="No answers yet."
            items={(answers ?? []).map((a) => ({
              id: a.id,
              href: `/questions/${a.question_id}`,
              title: a.body.slice(0, 120),
              at: a.created_at,
            }))}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <HistoryList
            empty="No comments yet."
            items={(comments ?? []).map((c) => {
              const answerRef = Array.isArray(c.answer)
                ? c.answer[0]
                : c.answer;
              const threadId =
                c.question_id ??
                (answerRef as { question_id?: string } | null)?.question_id;
              return {
                id: c.id,
                href: threadId ? `/questions/${threadId}` : "/",
                title: c.body.slice(0, 120),
                at: c.created_at,
              };
            })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HistoryList({
  items,
  empty,
}: {
  items: { id: string; href: string; title: string; at: string }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card/40">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/40"
          >
            <span className="text-sm text-foreground">{item.title}</span>
            <time className="text-xs text-muted-foreground" dateTime={item.at}>
              {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}
