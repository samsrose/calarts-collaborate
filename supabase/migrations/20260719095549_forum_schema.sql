-- CalArts Collaborate forum schema

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Schools
create table public.schools (
  id text primary key,
  name text not null unique
);

insert into public.schools (id, name) values
  ('art', 'Art'),
  ('critical_studies', 'Critical Studies'),
  ('dance', 'Dance'),
  ('film_video', 'Film/Video'),
  ('music', 'Music'),
  ('theater', 'Theater');

create table public.profile_schools (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  school_id text not null references public.schools (id) on delete cascade,
  primary key (profile_id, school_id)
);

-- Questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create index questions_last_activity_at_idx on public.questions (last_activity_at desc);
create index questions_created_at_idx on public.questions (created_at desc);
create index questions_author_id_idx on public.questions (author_id);

create table public.question_schools (
  question_id uuid not null references public.questions (id) on delete cascade,
  school_id text not null references public.schools (id) on delete cascade,
  primary key (question_id, school_id)
);

-- Answers
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index answers_question_id_idx on public.answers (question_id);
create index answers_author_id_idx on public.answers (author_id);

-- Comments (exactly one parent)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid references public.questions (id) on delete cascade,
  answer_id uuid references public.answers (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_parent_xor check (
    (question_id is not null and answer_id is null)
    or (question_id is null and answer_id is not null)
  )
);

create index comments_question_id_idx on public.comments (question_id);
create index comments_answer_id_idx on public.comments (answer_id);
create index comments_author_id_idx on public.comments (author_id);

-- Attachments (exactly one parent)
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid references public.questions (id) on delete cascade,
  answer_id uuid references public.answers (id) on delete cascade,
  bucket_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now(),
  constraint attachments_parent_xor check (
    (question_id is not null and answer_id is null)
    or (question_id is null and answer_id is not null)
  )
);

create index attachments_question_id_idx on public.attachments (question_id);
create index attachments_answer_id_idx on public.attachments (answer_id);

-- Updated_at helper
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger questions_set_updated_at
before update on public.questions
for each row execute function private.set_updated_at();

create trigger answers_set_updated_at
before update on public.answers
for each row execute function private.set_updated_at();

create trigger comments_set_updated_at
before update on public.comments
for each row execute function private.set_updated_at();

-- Profile on signup
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_name text;
begin
  chosen_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (new.id, chosen_name);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Bump question activity
create or replace function private.bump_question_activity_from_answer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.questions
  set last_activity_at = now()
  where id = new.question_id;
  return new;
end;
$$;

create trigger answers_bump_activity
after insert or update on public.answers
for each row execute function private.bump_question_activity_from_answer();

create or replace function private.bump_question_activity_from_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  qid uuid;
begin
  if new.question_id is not null then
    qid := new.question_id;
  else
    select a.question_id into qid from public.answers a where a.id = new.answer_id;
  end if;

  if qid is not null then
    update public.questions set last_activity_at = now() where id = qid;
  end if;

  return new;
end;
$$;

create trigger comments_bump_activity
after insert or update on public.comments
for each row execute function private.bump_question_activity_from_comment();

-- RLS
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.profile_schools enable row level security;
alter table public.questions enable row level security;
alter table public.question_schools enable row level security;
alter table public.answers enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;

create policy "Authenticated read profiles"
on public.profiles for select to authenticated using (true);

create policy "Users update own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "Authenticated read schools"
on public.schools for select to authenticated using (true);

create policy "Authenticated read profile_schools"
on public.profile_schools for select to authenticated using (true);

create policy "Users manage own profile_schools"
on public.profile_schools for all to authenticated
using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "Authenticated read questions"
on public.questions for select to authenticated using (true);

create policy "Authenticated insert questions"
on public.questions for insert to authenticated
with check (author_id = auth.uid());

create policy "Authors update own questions"
on public.questions for update to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "Authors delete own questions"
on public.questions for delete to authenticated
using (author_id = auth.uid());

create policy "Authenticated read question_schools"
on public.question_schools for select to authenticated using (true);

create policy "Authors manage question_schools"
on public.question_schools for all to authenticated
using (
  exists (
    select 1 from public.questions q
    where q.id = question_id and q.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.questions q
    where q.id = question_id and q.author_id = auth.uid()
  )
);

create policy "Authenticated read answers"
on public.answers for select to authenticated using (true);

create policy "Authenticated insert answers"
on public.answers for insert to authenticated
with check (author_id = auth.uid());

create policy "Authors update own answers"
on public.answers for update to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "Authors delete own answers"
on public.answers for delete to authenticated
using (author_id = auth.uid());

create policy "Authenticated read comments"
on public.comments for select to authenticated using (true);

create policy "Authenticated insert comments"
on public.comments for insert to authenticated
with check (author_id = auth.uid());

create policy "Authors update own comments"
on public.comments for update to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "Authors delete own comments"
on public.comments for delete to authenticated
using (author_id = auth.uid());

create policy "Authenticated read attachments"
on public.attachments for select to authenticated using (true);

create policy "Authenticated insert attachments"
on public.attachments for insert to authenticated
with check (uploader_id = auth.uid());

create policy "Uploaders delete own attachments"
on public.attachments for delete to authenticated
using (uploader_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table public.questions;
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.comments;

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'attachments',
    'attachments',
    false,
    10485760,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-wav',
      'application/zip', 'application/x-zip-compressed'
    ]
  )
on conflict (id) do nothing;

-- Avatars: authenticated read (public bucket URLs still work without listing)
create policy "Avatar authenticated read"
on storage.objects for select to authenticated
using (bucket_id = 'avatars');

create policy "Avatar owner insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Avatar owner update"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Avatar owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Attachments: authenticated read, owner write
create policy "Attachments authenticated read"
on storage.objects for select to authenticated
using (bucket_id = 'attachments');

create policy "Attachments owner insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Attachments owner update"
on storage.objects for update to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Attachments owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);
