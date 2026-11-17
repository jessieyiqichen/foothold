-- fh_drafts: the Connector's draft message for one person and one company (user, 2026-11-16: the design in log.md).
-- One row per person and company; writing again replaces it. fh_draft_runs: one row per try, so a person's tries can
-- be capped per day (10 since the start of the UTC day), taken only through fh_take_draft_run below.
--
-- NOT APPLIED. Per-person data: goes to `reviewer`, then the lead applies it.
--
-- user_id is the Clerk user id, read from the signed-in person's token, as in fh_profiles and fh_decisions. Every
-- read and write is made as the signed-in person (their token, the publishable key): the route POST /api/drafts takes
-- a try and calls the model, and the person's own browser saves the draft. Row-level security applies throughout.
-- Both tables hang off the person's profile: "Delete my resume" deletes their drafts, which quote it, and their tries.
-- The length limits and the daily limit repeat apps/web/src/lib/connector/constants.ts; change both together.

create table public.fh_drafts (
  user_id text not null default (auth.jwt() ->> 'sub') references public.fh_profiles (user_id) on delete cascade,
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

-- Delete: only their own rows. Nothing on the page deletes one draft yet; deleting the resume deletes them all
-- (the foreign key on user_id).
create policy "Delete own drafts" on public.fh_drafts for delete to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- No policy names anon. service_role is revoked as on fh_profiles: a draft quotes the resume, and background workers
-- may not read resumes (user, 2026-11-11).
revoke all on table public.fh_drafts from anon, authenticated, public, service_role;
grant select, insert, update, delete on table public.fh_drafts to authenticated;

create table public.fh_draft_runs (
  user_id text not null default (auth.jwt() ->> 'sub') references public.fh_profiles (user_id) on delete cascade,
  company_id bigint not null references public.fh_companies (id) on delete cascade,
  at timestamptz not null default now()
);

-- fh_take_draft_run counts a person's tries since the start of the UTC day on every request.
create index fh_draft_runs_user_at_idx on public.fh_draft_runs (user_id, at);

alter table public.fh_draft_runs enable row level security;

-- Read: a signed-in person sees their own tries.
create policy "Read own draft runs" on public.fh_draft_runs for select to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- No insert, update or delete policy and no such grant, on purpose: a person who could write their own tries could
-- add them without limit or delete them to reset the day. Tries are taken only through fh_take_draft_run.
revoke all on table public.fh_draft_runs from anon, authenticated, public, service_role;
grant select on table public.fh_draft_runs to authenticated;

-- Takes one of today's tries for the signed-in person, or refuses. Race-safe: a transaction-scoped advisory lock on
-- the person serialises their concurrent calls, so 30 parallel requests take at most 10 tries (reviewer, 2026-11-16:
-- the count-then-insert in the route made 22 model calls). security definer, because the person may not insert into
-- fh_draft_runs themself; it only ever writes a row for the caller's own id, read from their token.
-- False when there is no signed-in person, or when today's 10 are used.
create function public.fh_take_draft_run(p_company bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_user text := (select auth.jwt()) ->> 'sub';
begin
  if v_user is null or v_user = '' then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('fh_draft_runs:' || v_user, 0));
  if (
    select count(*) from public.fh_draft_runs r
    where r.user_id = v_user and r.at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
  ) >= 10 then
    return false;
  end if;
  insert into public.fh_draft_runs (user_id, company_id) values (v_user, p_company);
  return true;
end $$;
revoke all on function public.fh_take_draft_run(bigint) from public, anon, authenticated, service_role;
grant execute on function public.fh_take_draft_run(bigint) to authenticated;
