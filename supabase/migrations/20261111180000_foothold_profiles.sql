-- fh_profiles: one row a person, holding their resume as text and the skill tags found in it (user, 2026-11-11:
-- store the raw text in the person's own row, readable and writable only by them, with a one-click delete). The PDF
-- is parsed in the browser and never uploaded; only the text the person checked is written here.
--
-- NOT APPLIED. Touches user data: goes to `reviewer`, then the lead applies it.
--
-- user_id is the Clerk user id (`user_...`, text, not a uuid), read from the signed-in person's token, as in every
-- other per-person table of this project (goals, companies, saves). Sign-in is Clerk, not Supabase Auth, so there is
-- no auth.users row to reference and auth.uid() cannot be used: it casts the id to uuid and fails on a Clerk id.
-- The text and name limits repeat src/lib/profile/constants.ts; change both together. The 60 on tags is MAX_TAGS
-- in supabase/functions/fh-jobs/lib/tags.ts (the most tags tagsOf ever returns) and must change with it.
create table public.fh_profiles (
  user_id text primary key default (auth.jwt() ->> 'sub'),
  resume_text text not null check (char_length(resume_text) between 1 and 50000),
  resume_name text check (char_length(resume_name) between 1 and 200),
  tags text[] not null default '{}' check (cardinality(tags) <= 60),
  tags_version smallint not null check (tags_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at is the database's clock, not the browser's: the page shows it as "Saved ...".
create function public.fh_profiles_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.created_at = old.created_at;
  return new;
end $$;

create trigger fh_profiles_touch before update on public.fh_profiles
  for each row execute function public.fh_profiles_touch();

-- The trigger runs the function; nobody calls it directly.
revoke all on function public.fh_profiles_touch() from public, anon, authenticated;

alter table public.fh_profiles enable row level security;

-- Read: a signed-in person sees their own row and no other.
create policy "Read own profile" on public.fh_profiles for select to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- Add: a signed-in person may create only the row carrying their own id.
create policy "Add own profile" on public.fh_profiles for insert to authenticated
  with check (((select auth.jwt()) ->> 'sub') = user_id);

-- Change: only their own row (using), and it must still be theirs afterwards (with check), so a row can never be
-- handed to another id.
create policy "Change own profile" on public.fh_profiles for update to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id)
  with check (((select auth.jwt()) ->> 'sub') = user_id);

-- Delete: only their own row. This is "Delete my resume": the text, the name and the tags go together.
create policy "Delete own profile" on public.fh_profiles for delete to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- No policy names anon, and anon holds no privilege on the table: a signed-out visitor reaches nothing.
--
-- service_role is revoked too (user, 2026-11-11: background workers may not read resumes). It bypasses RLS, and
-- Supabase grants it every new public table by default, so without this line any Edge Function holding the service
-- key could read every resume. A feature that needs the text reads it with the person's own token. If a worker ever
-- needs it, that is a new migration and a new decision in log.md.
revoke all on table public.fh_profiles from anon, authenticated, public, service_role;
grant select, insert, update, delete on table public.fh_profiles to authenticated;
