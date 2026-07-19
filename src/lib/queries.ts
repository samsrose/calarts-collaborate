import { createClient } from "@/lib/supabase/server";
import { SCHOOLS } from "@/lib/constants";
import type { QuestionListItem, School } from "@/lib/types";

const HOME_FEED_LIMIT = 100;

// The school taxonomy is fixed by design (seeded once in the migration), so
// pages read it from the module constant instead of querying Postgres.
export function getSchools(): School[] {
  return SCHOOLS.map((school) => ({ id: school.id, name: school.name }));
}

export async function getQuestions(options: {
  schoolIds?: string[];
  sort?: "activity" | "newest";
}): Promise<QuestionListItem[]> {
  const supabase = await createClient();
  const sort = options.sort ?? "activity";

  // `body` is intentionally excluded — the list view never shows it.
  let query = supabase.from("questions").select(`
      id,
      author_id,
      title,
      created_at,
      last_activity_at,
      author:profiles!questions_author_id_fkey (
        id,
        display_name,
        avatar_path
      ),
      question_schools (
        school:schools (
          id,
          name
        )
      ),
      answers (count)
    `);

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("last_activity_at", { ascending: false });
  }

  const { data, error } = await query.limit(HOME_FEED_LIMIT);
  if (error || !data) return [];

  const mapped = data.map((row) => {
    const schools =
      (
        row.question_schools as
          | { school: School | School[] | null }[]
          | null
      )?.flatMap((qs) => {
        if (!qs.school) return [];
        return Array.isArray(qs.school) ? qs.school : [qs.school];
      }) ?? [];

    const authorRaw = row.author as
      | { id: string; display_name: string; avatar_path: string | null }
      | { id: string; display_name: string; avatar_path: string | null }[]
      | null;
    const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw;

    const answerCountRaw = row.answers as { count: number }[] | null;

    return {
      id: row.id,
      author_id: row.author_id,
      title: row.title,
      created_at: row.created_at,
      last_activity_at: row.last_activity_at,
      author: author ?? {
        id: row.author_id,
        display_name: "Unknown",
        avatar_path: null,
      },
      schools,
      answer_count: answerCountRaw?.[0]?.count ?? 0,
    } satisfies QuestionListItem;
  });

  if (options.schoolIds && options.schoolIds.length > 0) {
    const selected = new Set(options.schoolIds);
    return mapped.filter((q) => q.schools.some((s) => selected.has(s.id)));
  }

  return mapped;
}

export async function getAttachmentSignedUrls(
  paths: { id: string; bucket_path: string }[],
) {
  if (paths.length === 0) return {};

  const supabase = await createClient();
  const urls: Record<string, string> = {};

  // One batched request instead of N parallel round-trips.
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrls(
      paths.map((item) => item.bucket_path),
      60 * 60,
    );

  if (data) {
    const byPath = new Map(paths.map((item) => [item.bucket_path, item.id]));
    for (const entry of data) {
      const id = entry.path ? byPath.get(entry.path) : undefined;
      if (id && entry.signedUrl) urls[id] = entry.signedUrl;
    }
  }

  return urls;
}
