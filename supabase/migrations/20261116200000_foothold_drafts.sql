-- fh_drafts: the Connector's draft message for one person and one company (user, 2026-11-16: the design in log.md).
-- One row per person and company; writing again replaces it. fh_draft_runs: one row per generation, so a person's
-- drafts can be capped per day (10 since the start of the UTC day, counted by POST /api/drafts).
--
-- NOT APPLIED. Per-person data: goes to `reviewer`, then the lead applies it.
--
-- user_id is the Clerk user id, read from the signed-in person's token, as in fh_profiles and fh_decisions. Both
-- tables are written by the page's own server route as the signed-in person (their token, the publishable key), so
-- row-level security applies to every read and write. The length limits repeat apps/web/src/lib/connector/
-- constants.ts; change both together.

create table public.fh_drafts (
  user_id text not null default (auth.jwt() ->> 'sub'),
  company_id bigint not null references public.fh_companies (id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 300),
  body text not null check (char_length(body) between 1 and 5000),
  resume_quote text not null check (char_length(resume_quote) between 1 and 1000),
  company_quote text not null check (char_length(company_quote) between 1 and 1000),
  model text not null check (char_length(model) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

-- updated_at is the database's clock, not the browser's or the server's.
create function public.fh_drafts_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.created_at = old.created_at;
  return new;
end $$;

create trigger fh_drafts_touch before update on public.fh_drafts
  for each row execute function public.fh_drafts_touch();

-- The trigger runs the function; nobody calls it directly.
revoke all on function public.fh_drafts_touch() from public, anon, authenticated;

alter table public.fh_drafts enable row level security;

-- Read: a signed-in person sees their own drafts and no other.
create policy "Read own drafts" on public.fh_drafts for select to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- Add: a signed-in person may create only rows carrying their own id.
create policy "Add own drafts" on public.fh_drafts for insert to authenticated
  with check (((select auth.jwt()) ->> 'sub') = user_id);

-- Change: only their own rows (using), and they must still be theirs afterwards (with check), so a draft can never
-- be handed to another id. Writing again for the same company is an upsert, which needs this.
create policy "Change own drafts" on public.fh_drafts for update to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id)
  with check (((select auth.jwt()) ->> 'sub') = user_id);

-- Delete: only their own rows. Nothing deletes a draft yet; deleting the resume does not either (a later decision).
create policy "Delete own drafts" on public.fh_drafts for delete to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- No policy names anon. service_role is revoked as on fh_profiles: a draft quotes the resume, and background workers
-- may not read resumes (user, 2026-11-11).
revoke all on table public.fh_drafts from anon, authenticated, public, service_role;
grant select, insert, update, delete on table public.fh_drafts to authenticated;

create table public.fh_draft_runs (
  user_id text not null default (auth.jwt() ->> 'sub'),
  company_id bigint not null,
  at timestamptz not null default now()
);

-- The route counts a person's runs since the start of the UTC day on every request.
create index fh_draft_runs_user_at_idx on public.fh_draft_runs (user_id, at);

alter table public.fh_draft_runs enable row level security;

-- Read: a signed-in person sees their own runs, so the route can count them.
create policy "Read own draft runs" on public.fh_draft_runs for select to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- Add: a signed-in person may record only runs carrying their own id.
create policy "Add own draft runs" on public.fh_draft_runs for insert to authenticated
  with check (((select auth.jwt()) ->> 'sub') = user_id);

-- No update or delete policy, on purpose: a person who could change or delete their own runs could reset the daily
-- limit. Without a policy, RLS refuses both.
revoke all on table public.fh_draft_runs from anon, authenticated, public, service_role;
grant select, insert on table public.fh_draft_runs to authenticated;
