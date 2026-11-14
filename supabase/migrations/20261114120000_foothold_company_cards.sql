-- Company cards (user, 2026-11-14, docs/architecture.md and the last rows of log.md): a card is one company, one
-- person, one message. This migration is the database side: roles can be closed, matching keeps open roles posted in
-- the last 60 days, a person's save / reached out / skip, the people a card may name, and the two functions the
-- pages read (today's companies, and the saved ones). The pages are built against these columns at the same time.
--
-- NOT APPLIED. It creates a per-person table (fh_decisions) and functions that read the caller's own profile, so it
-- goes to `reviewer` before the lead applies it. No policy or grant on fh_profiles changes.

-- 1. Closed roles, and matching on open, recent roles ---------------------------------------------------------------

-- null = open. The jobs worker's refresh task sets it when a role leaves its board and clears it if the role comes
-- back; nothing else writes it. A closed role is never deleted.
alter table public.fh_postings add column closed_at timestamptz;

alter table public.fh_runs drop constraint fh_runs_source_check;
alter table public.fh_runs add constraint fh_runs_source_check
  check (source in ('yc', 'hn', 'vc', 'ats', 'tag', 'roles', 'refresh', 'people'));

-- fh_matches as in 20261112100000_foothold_matching.sql (its comment explains the rules and the cost), with two
-- changes: only open roles (closed_at is null), and p_days. p_days keeps roles first posted in that many days;
-- null keeps every age (the full list behind the page's switch). A role with no posted_at counts as recent only on
-- HN, where the comment is the posting; a job board that gives no date is not assumed fresh.
-- Adding a parameter makes a new function, so the old one is dropped first: two of them would make every call with
-- only p_limit and p_offset ambiguous. Those calls keep working and now get the 60-day default.
drop function public.fh_matches(integer, integer);

create function public.fh_matches(p_limit integer default 50, p_offset integer default 0, p_days integer default 60)
returns table (
  id bigint, title text, company_name text, url text, locations text[], posted_at timestamptz,
  family text, level text, shared text[], score numeric, total bigint
)
language plpgsql stable security invoker
set search_path = ''
set plan_cache_mode = 'force_custom_plan'
as $$
#variable_conflict use_column
declare
  v_tags text[];
  v_families text[];
  v_levels text[];
  v_all bigint;
  v_since timestamptz;
begin
  select f.tags, f.families, f.levels into v_tags, v_families, v_levels
  from public.fh_profiles f
  where f.user_id = ((select auth.jwt()) ->> 'sub');
  if not found or coalesce(cardinality(v_tags), 0) = 0 then
    return;
  end if;
  select count(*) into v_all from public.fh_postings;
  v_since := case when p_days is null then null else now() - make_interval(days => greatest(p_days, 1)) end;

  return query
  with weights as materialized (
    select t.tag, coalesce(ln(greatest(v_all::numeric / c.n, 1)), 0) as w
    from (select distinct u.tag from unnest(v_tags) as u(tag) where u.tag is not null) t
    left join public.fh_tag_counts c on c.tag = t.tag
  ),
  scored as (
    select p.id, p.title, p.company_name, p.url, p.location, p.posted_at, p.family, p.level, s.shared, s.score,
           coalesce(p.company_id::text, 'name:' || lower(p.company_name)) as company_key,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    cross join lateral (
      select array_agg(w.tag order by w.w desc, w.tag) as shared, round(coalesce(sum(w.w), 0), 4) as score
      from weights w
      where w.tag = any (p.tags)
    ) s
    where p.tags && v_tags
      and p.closed_at is null
      and (v_since is null or p.posted_at >= v_since or (p.posted_at is null and p.source = 'hn'))
      and (cardinality(v_families) = 0 or p.family = any (v_families))
      and (cardinality(v_levels) = 0 or p.level = any (v_levels))
  ),
  ranked as (
    select s.id, s.title, s.company_name, s.url, s.family, s.level, s.shared, s.score,
           row_number() over (partition by s.company_key, s.title_key
                              order by s.score desc, s.posted_at desc nulls last, s.id) as pick,
           max(s.posted_at) over (partition by s.company_key, s.title_key) as newest,
           array_agg(s.location) over (partition by s.company_key, s.title_key) as places
    from scored s
  )
  select r.id, r.title, r.company_name, r.url,
         array(select distinct l.place from unnest(r.places) as l(place) where l.place is not null order by 1) as locations,
         r.newest as posted_at, r.family, r.level, r.shared, r.score,
         count(*) over () as total
  from ranked r
  where r.pick = 1
  order by r.score desc, r.newest desc nulls last, r.id
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end $$;
revoke all on function public.fh_matches(integer, integer, integer) from public, anon, authenticated, service_role;
grant execute on function public.fh_matches(integer, integer, integer) to authenticated;

-- 2. Decisions: save, reached out, skip ----------------------------------------------------------------------------

-- One row a person and company: the latest decision. user_id is the Clerk id from the caller's token, as in
-- fh_profiles. Deleting a company deletes the decisions on it.
create table public.fh_decisions (
  user_id text not null default (auth.jwt() ->> 'sub'),
  company_id bigint not null references public.fh_companies (id) on delete cascade,
  decision text not null check (decision in ('saved', 'reached_out', 'skipped')),
  decided_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

-- decided_at is the database's clock: changing a decision (saved, then reached out) moves it to the top of the
-- saved list. The page cannot backdate it.
create function public.fh_decisions_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.decided_at = now();
  return new;
end $$;
create trigger fh_decisions_touch before insert or update on public.fh_decisions
  for each row execute function public.fh_decisions_touch();
revoke all on function public.fh_decisions_touch() from public, anon, authenticated;

alter table public.fh_decisions enable row level security;

-- Read: a signed-in person sees their own decisions and no other.
create policy "Read own decisions" on public.fh_decisions for select to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- Add: a signed-in person may create only rows carrying their own id.
create policy "Add own decisions" on public.fh_decisions for insert to authenticated
  with check (((select auth.jwt()) ->> 'sub') = user_id);

-- Change: only their own rows (using), still theirs afterwards (with check).
create policy "Change own decisions" on public.fh_decisions for update to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id)
  with check (((select auth.jwt()) ->> 'sub') = user_id);

-- Delete: only their own rows (undoing a decision).
create policy "Delete own decisions" on public.fh_decisions for delete to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- No policy names anon. service_role is revoked too (user, 2026-11-14: workers may not read user data); it bypasses
-- RLS and Supabase grants it every new public table by default.
revoke all on table public.fh_decisions from anon, authenticated, public, service_role;
grant select, insert, update, delete on table public.fh_decisions to authenticated;

-- 3. People a card may name --------------------------------------------------------------------------------------

-- Only routes the person published themself: an address written in their own HN post, a related person on a SEC
-- Form D, a founder on a YC page, a company's own team page. Never a guessed or looked-up address. source_url is
-- where it was published, seen_at when (for HN, the post's date). name is null when the person did not give one.
create table public.fh_people (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.fh_companies (id) on delete cascade,
  name text check (char_length(name) between 1 and 200),
  role text check (char_length(role) between 1 and 200),
  contact_kind text not null check (contact_kind in ('email', 'url')),
  contact text not null check (
    char_length(contact) between 3 and 2000
    and ((contact_kind = 'email' and contact ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$')
      or (contact_kind = 'url' and contact ~* '^https://\S+$'))
  ),
  source text not null check (source in ('hn', 'sec', 'yc', 'site')),
  source_url text not null check (source_url ~* '^https://\S+$' and char_length(source_url) <= 2000),
  seen_at timestamptz not null default now(),
  unique (company_id, source, contact)
);

-- Not readable as a whole table by anyone signed in (reviewer, 2026-11-14): a list of every contact is what Foothold
-- must never hand out. A card gets its one person through fh_company_person below, one company at a time. RLS is on
-- with no policy, and only the workers (service_role) hold any privilege on the table.
alter table public.fh_people enable row level security;
revoke all on table public.fh_people from public, anon, authenticated;
grant select, insert, update, delete on table public.fh_people to service_role;

-- 4. The daily re-check of boards: which companies are due --------------------------------------------------------

-- Hands the refresh task the companies with a board, checked longest ago first, and stamps them so the next call
-- gets others. A company checked in the last 20 hours is not due, so a schedule that calls more often than needed
-- gets nothing back instead of checking the same boards twice in a day.
-- Rate (reviewer, 2026-11-14): at most 25 companies stamped in any 2 minutes, whoever calls: the companies stamped
-- in the last 2 minutes (by this task or the ats task) are taken off what a call may claim. At most 5 Workable
-- companies a claim, since Workable refuses after about six requests a minute.
-- The 100 rows locked first are a pool to choose from; a row locked and not chosen is released at the end of the
-- statement.
create index fh_companies_refresh on public.fh_companies (ats_checked_at) where ats is not null;

create or replace function public.fh_claim_refresh(n integer)
returns table (id bigint, name text, ats text, ats_slug text)
language sql security definer set search_path = '' as $$
  update public.fh_companies c
  set ats_checked_at = now()
  where c.id in (
    select e.id
    from (
      select d.id, d.ats, d.ats_checked_at,
             row_number() over (partition by d.ats = 'workable' order by d.ats_checked_at nulls first, d.id) as k
      from (
        select x.id, x.ats, x.ats_checked_at from public.fh_companies x
        where x.ats is not null and x.ats_slug is not null
          and (x.ats_checked_at is null or x.ats_checked_at < now() - interval '20 hours')
        order by x.ats_checked_at nulls first, x.id
        limit 100
        for update skip locked
      ) d
    ) e
    where e.ats <> 'workable' or e.k <= 5
    order by e.ats_checked_at nulls first, e.id
    limit greatest(0, least(greatest(n, 1), 25) - (
      select count(*) from public.fh_companies r where r.ats_checked_at > now() - interval '2 minutes'
    ))
  )
  returning c.id, c.name, c.ats, c.ats_slug;
$$;
revoke all on function public.fh_claim_refresh(integer) from public, anon, authenticated;
grant execute on function public.fh_claim_refresh(integer) to service_role;

-- What is stored for one company's job-board roles, for the refresh task to compare with a fresh answer and write
-- only what is new or changed. The text is compared by its SHA-256 (hex, of the UTF-8 bytes), so the worker never
-- downloads the texts it already has. Only the worker calls it.
create or replace function public.fh_stored_roles(p_company bigint)
returns table (id bigint, source_id text, closed_at timestamptz, title text, posted_at timestamptz, text_sha256 text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.source_id, p.closed_at, p.title, p.posted_at, encode(sha256(convert_to(p.text, 'UTF8')), 'hex')
  from public.fh_postings p
  where p.company_id = p_company and p.source = 'ats';
$$;
revoke all on function public.fh_stored_roles(bigint) from public, anon, authenticated;
grant execute on function public.fh_stored_roles(bigint) to service_role;

-- 5. Ranking companies for the caller ------------------------------------------------------------------------------

-- One row a company that has at least one open role matching the caller's profile (same rules as fh_matches: shared
-- tags, the person's families and levels) and posted in the last p_days (null: any age). p_companies, when given,
-- limits it to those companies (the saved list). Used by fh_today and fh_saved; signed-in people may call it, and it
-- only ever reads the caller's own profile.
--
-- A role is one title at one company, as in fh_matches: the same title in several cities counts once, and keeps its
-- best-scoring posting.
--
-- Company score = the best role's tag score
--               + 0.5 for each further matching role, at most 4 of them (+2.0)
--               + up to 1.0 for recency: 1.0 for a role posted today, falling in a straight line to 0 at 60 days
--                 (a date in the future counts as today; a role with no date adds nothing).
-- Why: the tag score is what says the company fits, so it leads, and the best role counts rather than the sum, so
-- a company posting forty near-identical roles does not win on volume. The bonuses CAN lift a weaker fit over a
-- stronger one: a company whose best role scores 4.0, with one more matching role and a role posted today, scores
-- 4.0 + 0.5 + 1.0 = 5.5 and ranks above a company whose single role scores 4.5 but was posted 59 days ago
-- (4.5 + 0.02). That is meant: more ways in and a live opening are worth up to 3.0, less than one shared uncommon
-- tag (a tag on 1,000 of 36,551 postings weighs ln(36.6) = 3.6, one on 100 weighs 5.9), so a much stronger fit
-- still wins. The weights 0.5 and 1.0 are a first guess, not tuned on anyone's judgment yet.
--
-- shared: the person's tags across the company's matching roles, rarest first. roles: the top two roles, best score
-- first, then newest. last_posted_at: the newest matching role. recent_roles: how many matching roles.
create function public.fh_company_fit(p_days integer default 60, p_companies bigint[] default null)
returns table (
  company_id bigint, last_posted_at timestamptz, recent_roles integer, shared text[], score numeric, roles jsonb
)
language plpgsql stable security invoker
set search_path = ''
set plan_cache_mode = 'force_custom_plan'
as $$
#variable_conflict use_column
declare
  v_tags text[];
  v_families text[];
  v_levels text[];
  v_all bigint;
  v_since timestamptz;
begin
  select f.tags, f.families, f.levels into v_tags, v_families, v_levels
  from public.fh_profiles f
  where f.user_id = ((select auth.jwt()) ->> 'sub');
  if not found or coalesce(cardinality(v_tags), 0) = 0 then
    return;
  end if;
  select count(*) into v_all from public.fh_postings;
  v_since := case when p_days is null then null else now() - make_interval(days => greatest(p_days, 1)) end;

  return query
  with weights as materialized (
    select t.tag, coalesce(ln(greatest(v_all::numeric / c.n, 1)), 0) as w
    from (select distinct u.tag from unnest(v_tags) as u(tag) where u.tag is not null) t
    left join public.fh_tag_counts c on c.tag = t.tag
  ),
  scored as (
    select p.id, p.company_id, p.title, p.url, p.posted_at, p.family, p.level, s.shared, s.score,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    cross join lateral (
      select array_agg(w.tag order by w.w desc, w.tag) as shared, round(coalesce(sum(w.w), 0), 4) as score
      from weights w
      where w.tag = any (p.tags)
    ) s
    where p.tags && v_tags
      and p.company_id is not null
      and p.closed_at is null
      and (p_companies is null or p.company_id = any (p_companies))
      and (v_since is null or p.posted_at >= v_since or (p.posted_at is null and p.source = 'hn'))
      and (cardinality(v_families) = 0 or p.family = any (v_families))
      and (cardinality(v_levels) = 0 or p.level = any (v_levels))
  ),
  one_per_title as (
    select distinct on (s.company_id, s.title_key) s.*
    from scored s
    order by s.company_id, s.title_key, s.score desc, s.posted_at desc nulls last, s.id
  ),
  numbered as (
    select o.*, row_number() over (partition by o.company_id order by o.score desc, o.posted_at desc nulls last, o.id) as n
    from one_per_title o
  ),
  tag_sets as (
    select x.company_id, array_agg(distinct t.tag) as tags
    from numbered x cross join lateral unnest(x.shared) as t(tag)
    group by x.company_id
  ),
  companies as (
    select k.company_id,
           max(k.posted_at) as last_posted_at,
           count(*)::integer as recent_roles,
           max(k.score) as best,
           jsonb_agg(jsonb_build_object(
             'id', k.id, 'title', k.title, 'url', k.url, 'posted_at', k.posted_at,
             'family', k.family, 'level', k.level, 'shared', to_jsonb(k.shared)
           ) order by k.n) filter (where k.n <= 2) as roles
    from numbered k
    group by k.company_id
  )
  select c.company_id, c.last_posted_at, c.recent_roles,
         coalesce(array(select w.tag from weights w where w.tag = any (ts.tags) order by w.w desc, w.tag), '{}') as shared,
         round(
           c.best
           + 0.5 * least(c.recent_roles - 1, 4)
           + coalesce(least(1, greatest(0, 1 - extract(epoch from (now() - c.last_posted_at)) / 86400 / 60)), 0)::numeric,
           4) as score,
         c.roles
  from companies c
  left join tag_sets ts on ts.company_id = c.company_id;
end $$;
revoke all on function public.fh_company_fit(integer, bigint[]) from public, anon, authenticated, service_role;
grant execute on function public.fh_company_fit(integer, bigint[]) to authenticated;

-- The one person a card names for a company: HN first (the poster asked to be contacted there), then one who gave a
-- name or role over a team inbox, then the most recently seen. null when there is nobody.
-- security definer, because fh_people is not readable by signed-in people (section 3): this function is the only
-- way in, and it answers one company at a time with at most one row.
create function public.fh_company_person(p_company bigint)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
           'name', pe.name, 'role', pe.role, 'contact_kind', pe.contact_kind, 'contact', pe.contact,
           'source', pe.source, 'source_url', pe.source_url, 'seen_at', pe.seen_at)
  from public.fh_people pe
  where pe.company_id = p_company
  order by (pe.source = 'hn') desc, (pe.name is not null or pe.role is not null) desc, pe.seen_at desc, pe.id
  limit 1;
$$;
revoke all on function public.fh_company_person(bigint) from public, anon, authenticated, service_role;
grant execute on function public.fh_company_person(bigint) to authenticated;

-- 6. Today's companies, and the saved ones --------------------------------------------------------------------------

-- The caller's best companies today: one row a company, best first, leaving out every company the caller has
-- decided on (saved, reached out or skipped), and only companies with a matching open role posted in the last 60
-- days. p_limit is kept inside 1..50. investors is fh_companies.lists (the VC boards that list the company).
-- No profile, or a profile with no tags: no rows.
create function public.fh_today(p_limit integer default 5)
returns table (
  company_id bigint, name text, one_liner text, website text, team_size integer, batch text, stage text,
  investors text[], last_posted_at timestamptz, recent_roles integer, shared text[], score numeric, roles jsonb,
  person jsonb
)
language sql stable security invoker set search_path = '' as $$
  select c.id, c.name, c.one_liner, c.website, c.team_size, c.batch, c.stage, c.lists,
         f.last_posted_at, f.recent_roles, f.shared, f.score, f.roles,
         public.fh_company_person(c.id)
  from public.fh_company_fit(60, null) f
  join public.fh_companies c on c.id = f.company_id
  where not exists (
    select 1 from public.fh_decisions d
    where d.company_id = c.id and d.user_id = ((select auth.jwt()) ->> 'sub')
  )
  order by f.score desc, f.last_posted_at desc nulls last, c.id
  limit least(greatest(coalesce(p_limit, 5), 1), 50);
$$;
revoke all on function public.fh_today(integer) from public, anon, authenticated, service_role;
grant execute on function public.fh_today(integer) to authenticated;

-- The caller's saved and reached-out companies, newest decision first, with the same columns as fh_today. A saved
-- company stays on the list after its roles close or age: then recent_roles is 0, roles is [], shared is {},
-- score is 0 and last_posted_at is null.
create function public.fh_saved()
returns table (
  company_id bigint, name text, one_liner text, website text, team_size integer, batch text, stage text,
  investors text[], last_posted_at timestamptz, recent_roles integer, shared text[], score numeric, roles jsonb,
  person jsonb, decision text, decided_at timestamptz
)
language sql stable security invoker set search_path = '' as $$
  with mine as (
    select d.company_id, d.decision, d.decided_at
    from public.fh_decisions d
    where d.user_id = ((select auth.jwt()) ->> 'sub') and d.decision in ('saved', 'reached_out')
  )
  select c.id, c.name, c.one_liner, c.website, c.team_size, c.batch, c.stage, c.lists,
         f.last_posted_at, coalesce(f.recent_roles, 0), coalesce(f.shared, '{}'), coalesce(f.score, 0), coalesce(f.roles, '[]'::jsonb),
         public.fh_company_person(c.id), m.decision, m.decided_at
  from mine m
  join public.fh_companies c on c.id = m.company_id
  left join public.fh_company_fit(60, array(select mi.company_id from mine mi)) f on f.company_id = c.id
  order by m.decided_at desc, c.id;
$$;
revoke all on function public.fh_saved() from public, anon, authenticated, service_role;
grant execute on function public.fh_saved() to authenticated;
