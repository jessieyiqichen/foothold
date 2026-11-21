-- Foothold: the drafts' harness (user, 2026-11-21, three questions agreed one at a time; log.md).
--
-- 1. fh_profiles.pitch: the person's one line about themself, in their own words ("UChicago MA student (econ),
--    interned as a PM on AI assistants; looking for AI product and data roles"). Every draft opens from it. Foothold
--    suggests a first version from the resume; the person edits and saves it. Null until they save one. It is part of
--    the profile row, so the profile's own-row policies, its grants and "delete my resume" (which deletes the row)
--    already cover it: nothing else changes on fh_profiles.
--
-- 2. fh_draft_edits: how the person changes drafts, so the next draft is written more like them. When they press
--    Copy on a draft they changed, their browser saves the draft as written and as they changed it. Only the five
--    newest are kept (the trigger below deletes the rest). Read, added and deleted only by the person, with their own
--    token: the route reads them as the person to write the next draft, and the profile page shows and clears them.
--    No update: an edit is kept as it was. Deleting the resume deletes them (the foreign key), as it does drafts.
--    service_role is revoked, as on fh_profiles and fh_drafts: these quote the resume, and background workers may not
--    read it (user, 2026-11-11). The length limits repeat apps/web/src/lib/connector/constants.ts.

alter table public.fh_profiles
  add column pitch text check (char_length(pitch) between 1 and 300);

create table public.fh_draft_edits (
  id bigint generated always as identity primary key,
  user_id text not null default (auth.jwt() ->> 'sub') references public.fh_profiles (user_id) on delete cascade,
  company_id bigint references public.fh_companies (id) on delete set null,
  before_subject text not null check (char_length(before_subject) between 1 and 300),
  before_body text not null check (char_length(before_body) between 1 and 5000),
  after_subject text not null check (char_length(after_subject) between 1 and 300),
  after_body text not null check (char_length(after_body) between 1 and 5000),
  created_at timestamptz not null default now(),
  -- Only a real change is worth keeping
  constraint fh_draft_edits_changed check (before_subject <> after_subject or before_body <> after_body)
);
create index fh_draft_edits_user_created_idx on public.fh_draft_edits (user_id, created_at desc, id desc);

-- After each insert, the person's edits past the five newest are deleted. Runs as the person (no security definer):
-- the delete policy below lets them delete only their own rows, and the trigger only ever names their own id.
create function public.fh_draft_edits_keep_five() returns trigger
language plpgsql set search_path = '' as $$
begin
  delete from public.fh_draft_edits e
  where e.user_id = new.user_id
    and e.id not in (
      select k.id from public.fh_draft_edits k
      where k.user_id = new.user_id
      order by k.created_at desc, k.id desc
      limit 5
    );
  return null;
end $$;
create trigger fh_draft_edits_keep_five after insert on public.fh_draft_edits
  for each row execute function public.fh_draft_edits_keep_five();
-- The trigger runs the function; nobody calls it directly.
revoke all on function public.fh_draft_edits_keep_five() from public, anon, authenticated;

alter table public.fh_draft_edits enable row level security;
-- Read: a signed-in person sees their own edits and no other.
create policy "Read own draft edits" on public.fh_draft_edits for select to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);
-- Add: only rows carrying their own id.
create policy "Add own draft edits" on public.fh_draft_edits for insert to authenticated
  with check (((select auth.jwt()) ->> 'sub') = user_id);
-- Delete: only their own rows ("Clear" on the profile page, and the trigger's pruning).
create policy "Delete own draft edits" on public.fh_draft_edits for delete to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);
-- No update policy and no update grant. No policy names anon.
revoke all on table public.fh_draft_edits from anon, authenticated, public, service_role;
grant select, delete on table public.fh_draft_edits to authenticated;
-- Insert names only what the browser writes: user_id comes from the token (its default, and the policy checks it),
-- and created_at from the database's clock, so a person cannot date a row to escape or force the pruning (review,
-- 2026-11-21).
grant insert (company_id, before_subject, before_body, after_subject, after_body) on table public.fh_draft_edits to authenticated;
