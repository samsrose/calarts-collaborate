export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
}

export interface Attachment {
  id: string;
  uploader_id: string;
  question_id: string | null;
  answer_id: string | null;
  bucket_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface Question {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  author_id: string;
  question_id: string | null;
  answer_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

// List rows intentionally omit `body` — the home feed never renders it, and
// skipping it keeps the query payload and RSC serialization small.
export interface QuestionListItem extends Omit<Question, "body" | "updated_at"> {
  author: Pick<Profile, "id" | "display_name" | "avatar_path">;
  schools: School[];
  answer_count: number;
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}
