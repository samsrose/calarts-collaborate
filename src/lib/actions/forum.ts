"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { validateAttachmentList } from "@/lib/validation";

export async function createQuestionAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const schoolIds = formData.getAll("schools").map(String).filter(Boolean);

  if (!title || !body) {
    return { ok: false, error: "Title and body are required." };
  }
  if (schoolIds.length === 0) {
    return { ok: false, error: "Select at least one school." };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const fileError = validateAttachmentList(
    files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
  );
  if (fileError) return { ok: false, error: fileError };

  const { data: question, error } = await supabase
    .from("questions")
    .insert({ author_id: user.id, title, body })
    .select("id")
    .single();

  if (error || !question) {
    return { ok: false, error: error?.message ?? "Could not create question." };
  }

  const { error: schoolError } = await supabase.from("question_schools").insert(
    schoolIds.map((school_id) => ({ question_id: question.id, school_id })),
  );
  if (schoolError) {
    return { ok: false, error: schoolError.message };
  }

  for (const file of files) {
    const path = `${user.id}/${question.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return { ok: false, error: uploadError.message };

    const { error: metaError } = await supabase.from("attachments").insert({
      uploader_id: user.id,
      question_id: question.id,
      bucket_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (metaError) return { ok: false, error: metaError.message };
  }

  revalidatePath("/");
  redirect(`/questions/${question.id}`);
}

export async function createAnswerAction(
  questionId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { ok: false, error: "Answer body is required." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const fileError = validateAttachmentList(
    files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
  );
  if (fileError) return { ok: false, error: fileError };

  const { data: answer, error } = await supabase
    .from("answers")
    .insert({ question_id: questionId, author_id: user.id, body })
    .select("id")
    .single();

  if (error || !answer) {
    return { ok: false, error: error?.message ?? "Could not post answer." };
  }

  for (const file of files) {
    const path = `${user.id}/${answer.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return { ok: false, error: uploadError.message };

    const { error: metaError } = await supabase.from("attachments").insert({
      uploader_id: user.id,
      answer_id: answer.id,
      bucket_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (metaError) return { ok: false, error: metaError.message };
  }

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function createCommentAction(input: {
  questionId?: string;
  answerId?: string;
  body: string;
  threadQuestionId: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const body = input.body.trim();

  if (!body) return { ok: false, error: "Comment cannot be empty." };
  if (!input.questionId && !input.answerId) {
    return { ok: false, error: "Comment parent is required." };
  }

  const { error } = await supabase.from("comments").insert({
    author_id: user.id,
    body,
    question_id: input.questionId ?? null,
    answer_id: input.answerId ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/questions/${input.threadQuestionId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteQuestionAction(questionId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("author_id", user.id);

  if (error) return { ok: false, error: error.message || "Not allowed." };

  revalidatePath("/");
  redirect("/");
}

export async function deleteAnswerAction(
  answerId: string,
  questionId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("answers")
    .delete()
    .eq("id", answerId)
    .eq("author_id", user.id);

  if (error) return { ok: false, error: error.message || "Not allowed." };

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteCommentAction(
  commentId: string,
  questionId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) return { ok: false, error: error.message || "Not allowed." };

  revalidatePath(`/questions/${questionId}`);
  return { ok: true };
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const schoolIds = formData.getAll("schools").map(String).filter(Boolean);
  const avatar = formData.get("avatar");

  if (!displayName) return { ok: false, error: "Display name is required." };

  let avatarPath: string | undefined;

  if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith("image/")) {
      return { ok: false, error: "Avatar must be an image." };
    }
    if (avatar.size > 5 * 1024 * 1024) {
      return { ok: false, error: "Avatar must be 5 MB or smaller." };
    }
    const path = `${user.id}/avatar-${Date.now()}.${avatar.name.split(".").pop() ?? "jpg"}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { contentType: avatar.type, upsert: true });
    if (uploadError) return { ok: false, error: uploadError.message };
    avatarPath = path;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio || null,
      ...(avatarPath ? { avatar_path: avatarPath } : {}),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  await supabase.from("profile_schools").delete().eq("profile_id", user.id);
  if (schoolIds.length > 0) {
    const { error: schoolError } = await supabase.from("profile_schools").insert(
      schoolIds.map((school_id) => ({ profile_id: user.id, school_id })),
    );
    if (schoolError) return { ok: false, error: schoolError.message };
  }

  revalidatePath("/settings");
  revalidatePath(`/users/${user.id}`);
  return { ok: true };
}
