import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AnswerForm } from "@/components/forum/answer-form";
import { AttachmentList } from "@/components/forum/attachment-list";
import { CommentForm } from "@/components/forum/comment-form";
import {
  DeleteAnswerButton,
  DeleteCommentButton,
  DeleteQuestionButton,
} from "@/components/forum/delete-buttons";
import { LiveThread } from "@/components/forum/live-thread";
import { Markdown } from "@/components/forum/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth";
import { avatarPublicUrl } from "@/lib/avatar";
import { getAttachmentSignedUrls } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { Attachment, Comment, Profile, School } from "@/lib/types";

interface QuestionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export default async function QuestionPage({
  params,
  searchParams,
}: QuestionPageProps) {
  const { id } = await params;
  const { sort } = await searchParams;
  const answerSort = sort === "oldest" ? "oldest" : "newest";
  const supabase = await createClient();

  // Question, answers, and viewer identity are independent — fetch in parallel.
  const [user, { data: question }, { data: answers }] = await Promise.all([
    getCurrentUser(),
    supabase
      .from("questions")
      .select(
        `
        *,
        author:profiles!questions_author_id_fkey (*),
        question_schools ( school:schools (*) ),
        attachments (*),
        comments (*, author:profiles!comments_author_id_fkey (*))
      `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("answers")
      .select(
        `
        *,
        author:profiles!answers_author_id_fkey (*),
        attachments (*),
        comments (*, author:profiles!comments_author_id_fkey (*))
      `,
      )
      .eq("question_id", id)
      .order("created_at", { ascending: answerSort === "oldest" }),
  ]);

  if (!question) notFound();

  const schools =
    (
      question.question_schools as { school: School | null }[] | null
    )?.flatMap((qs) => (qs.school ? [qs.school] : [])) ?? [];

  const questionAttachments = (question.attachments as Attachment[]) ?? [];
  const answerList = answers ?? [];
  const allAttachmentMeta = [
    ...questionAttachments,
    ...answerList.flatMap((a) => (a.attachments as Attachment[]) ?? []),
  ].map((a) => ({ id: a.id, bucket_path: a.bucket_path }));

  const urls = await getAttachmentSignedUrls(allAttachmentMeta);
  const author = unwrapOne(question.author as Profile | Profile[] | null);
  const questionComments = (question.comments as (Comment & { author: Profile })[]) ?? [];

  return (
    <LiveThread questionId={id}>
      <article className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-heading text-3xl tracking-tight">
              {question.title}
            </h1>
            {user?.id === question.author_id ? (
              <DeleteQuestionButton questionId={question.id} />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {schools.map((school) => (
              <Badge key={school.id} variant="secondary">
                {school.name}
              </Badge>
            ))}
          </div>
          <AuthorRow author={author} at={question.created_at} />
          <Markdown content={question.body} />
          <AttachmentList attachments={questionAttachments} urls={urls} />
          <CommentSection
            comments={questionComments}
            currentUserId={user?.id}
            threadQuestionId={id}
            questionId={id}
          />
        </div>

        <Separator />

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl">
              {answerList.length}{" "}
              {answerList.length === 1 ? "Answer" : "Answers"}
            </h2>
            <div className="flex gap-2 text-sm">
              <Link
                href={`/questions/${id}?sort=newest`}
                className={
                  answerSort === "newest"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                Newest
              </Link>
              <Link
                href={`/questions/${id}?sort=oldest`}
                className={
                  answerSort === "oldest"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                Oldest
              </Link>
            </div>
          </div>

          <ul className="flex flex-col gap-6">
            {answerList.map((answer) => {
              const answerAuthor = unwrapOne(
                answer.author as Profile | Profile[] | null,
              );
              const answerAttachments =
                (answer.attachments as Attachment[]) ?? [];
              const comments =
                (answer.comments as (Comment & { author: Profile })[]) ?? [];

              return (
                <li
                  key={answer.id}
                  className="rounded-xl border border-border/70 bg-card/40 p-4 sm:p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <AuthorRow author={answerAuthor} at={answer.created_at} />
                    {user?.id === answer.author_id ? (
                      <DeleteAnswerButton
                        answerId={answer.id}
                        questionId={id}
                      />
                    ) : null}
                  </div>
                  <Markdown content={answer.body} />
                  <AttachmentList attachments={answerAttachments} urls={urls} />
                  <CommentSection
                    comments={comments}
                    currentUserId={user?.id}
                    threadQuestionId={id}
                    answerId={answer.id}
                  />
                </li>
              );
            })}
          </ul>

          <div className="rounded-xl border border-border/70 bg-background/60 p-4 sm:p-5">
            <AnswerForm questionId={id} />
          </div>
        </section>
      </article>
    </LiveThread>
  );
}

function CommentSection({
  comments,
  currentUserId,
  threadQuestionId,
  questionId,
  answerId,
}: {
  comments: (Comment & { author: Profile | Profile[] | null })[];
  currentUserId?: string;
  threadQuestionId: string;
  questionId?: string;
  answerId?: string;
}) {
  return (
    <div className="mt-4 border-t border-border/50 pt-3">
      <ul className="flex flex-col gap-2">
        {comments.map((comment) => {
          const author = unwrapOne(comment.author);
          return (
            <li
              key={comment.id}
              className="flex items-start justify-between gap-2 text-sm text-muted-foreground"
            >
              <p>
                <span className="font-medium text-foreground">
                  {author?.display_name ?? "User"}
                </span>
                : {comment.body}
              </p>
              {currentUserId === comment.author_id ? (
                <DeleteCommentButton
                  commentId={comment.id}
                  questionId={threadQuestionId}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      <CommentForm
        threadQuestionId={threadQuestionId}
        questionId={questionId}
        answerId={answerId}
      />
    </div>
  );
}

function AuthorRow({
  author,
  at,
}: {
  author: Profile | null;
  at: string;
}) {
  const avatar = avatarPublicUrl(author?.avatar_path);
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Avatar className="size-6">
        {avatar ? (
          <AvatarImage src={avatar} alt={author?.display_name ?? ""} />
        ) : null}
        <AvatarFallback className="text-[10px]">
          {(author?.display_name ?? "U").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <Link
        href={author ? `/users/${author.id}` : "#"}
        className="font-medium text-foreground hover:underline"
      >
        {author?.display_name ?? "Unknown"}
      </Link>
      <span aria-hidden>·</span>
      <time dateTime={at}>
        {formatDistanceToNow(new Date(at), { addSuffix: true })}
      </time>
    </div>
  );
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
