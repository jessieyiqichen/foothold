-- Matching a person to postings, the database side (user, 2026-11-12, last rows of log.md): a person picks up to
-- three kinds of work (families) and, if they like, levels; a posting's family and level are read from its title by
-- familyOf and levelOf in packages/core/src/roles.ts; roles are ranked family first, then by the skill tags they
-- share with the person, a rare tag counting for more; the same role posted in several cities is one row; the level
-- is a label and a filter the person sets, never something hidden from them.
--
-- Reviewed, then applied by the lead on 2026-11-12. It adds two columns to fh_profiles (a per-person table) and a function that reads the caller's own
-- profile, so it goes to `reviewer` before the lead applies it. No policy and no grant on fh_profiles changes.
--
-- The family and level ids below repeat FAMILIES and LEVELS in packages/core/src/roles.ts, four times. Change them
-- together; supabase/functions/fh-roles/lib/batch.test.ts fails when they differ.

-- 1. Postings: family, level and the version of the title rules they came from ----------------------------------

-- Null until the roles worker has labelled the row; roles_version 0 means "not labelled yet". The worker re-labels
-- rows below the current ROLES_VERSION.
alter table public.fh_postings
  add column family text
    constraint fh_postings_family_check check (family in ('product', 'engineering', 'data', 'research', 'design', 'marketing', 'sales', 'customer', 'operations', 'finance', 'people', 'legal', 'other')),
  add column level text
    constraint fh_postings_level_check check (level in ('intern', 'entry', 'unspecified', 'senior', 'management')),
  add column roles_version smallint not null default 0;

-- Serves "family in (...) and tags && ...": the planner fetches the chosen families' rows through this index, or
-- combines it with the existing GIN index fh_postings_tags (two bitmaps, ANDed). A single GIN index over
-- (family, tags) would need the btree_gin extension and does no better: GIN keeps each column's keys apart and
-- intersects them, which is the same work as ANDing two bitmaps. level is the second column so that a family plus a
-- level filter narrows inside the index, before any row is fetched.
-- No index for the worker's "roles_version < N order by id": it walks the primary key and skips labelled rows, at
-- worst 36,551 index entries a call.
create index fh_postings_family on public.fh_postings (family, level);

alter table public.fh_runs drop constraint fh_runs_source_check;
alter table public.fh_runs add constraint fh_runs_source_check check (source in ('yc', 'hn', 'vc', 'ats', 'tag', 'roles'));

-- Writes the family and level the worker read from each title: rows of {id, family, level}. A value outside the
-- lists above fails the whole batch, loudly; a row missing either key is skipped, not stamped as labelled with
-- nothing in it. Only the worker calls it.
create or replace function public.fh_set_roles(version integer, rows jsonb)
returns integer language sql security definer set search_path = '' as $$
  with upd as (
    update public.fh_postings p
    set family = r->>'family', level = r->>'level', roles_version = version
    from jsonb_array_elements(rows) r
    where p.id = (r->>'id')::bigint and r ? 'family' and r ? 'level'
    returning 1
  )
  select count(*)::integer from upd;
$$;
revoke all on function public.fh_set_roles(integer, jsonb) from public, anon, authenticated;
grant execute on function public.fh_set_roles(integer, jsonb) to service_role;

-- 2. How many postings carry each tag -----------------------------------------------------------------------------

-- What makes a rare tag worth more than a common one (`ai` is on 24,166 of 36,551 postings and separates nothing).
-- Rebuilt by fh_refresh_tag_counts, not kept current row by row: it is a few hundred rows, and a count that is a
-- day old ranks the same. Signed-in people read it; only the worker writes it.
create table public.fh_tag_counts (
  tag text primary key check (char_length(tag) between 1 and 100),
  n integer not null check (n > 0)
);
alter table public.fh_tag_counts enable row level security;
create policy "signed-in read tag counts" on public.fh_tag_counts for select to authenticated using (true);
revoke all on table public.fh_tag_counts from public, anon, authenticated;
grant select on table public.fh_tag_counts to authenticated;
grant select, insert, update, delete on table public.fh_tag_counts to service_role;

-- Recounts every tag from fh_postings and returns how many tags there are. One statement, so a reader sees either
-- the old counts or the new ones. The delete has a real condition (tags no posting carries any more) because the
-- API's connections refuse a delete without a where. Only the worker calls it.
create or replace function public.fh_refresh_tag_counts()
returns integer language sql security definer set search_path = '' as $$
  with counts as (
    select t.tag, count(distinct p.id)::integer as n
    from public.fh_postings p cross join lateral unnest(p.tags) as t(tag)
    where t.tag is not null and t.tag <> ''
    group by t.tag
  ),
  gone as (
    delete from public.fh_tag_counts c
    where not exists (select 1 from counts k where k.tag = c.tag)
    returning 1
  ),
  put as (
    insert into public.fh_tag_counts as c (tag, n)
    select k.tag, k.n from counts k
    on conflict (tag) do update set n = excluded.n
    returning 1
  )
  select count(*)::integer from put;
$$;
revoke all on function public.fh_refresh_tag_counts() from public, anon, authenticated;
grant execute on function public.fh_refresh_tag_counts() to service_role;

-- 3. Profiles: the kinds of work and the levels a person wants ----------------------------------------------------

-- families: at most three, each one of the family ids. levels: each one of the level ids. Both empty means "no
-- filter". `<@` is false for a null element, so a null cannot be stored. No policy or grant changes: the four
-- "own profile" policies and the table's grants already cover every column; service_role and anon stay revoked.
-- Rows saved before this migration get two empty lists.
alter table public.fh_profiles
  add column families text[] not null default '{}'
    constraint fh_profiles_families_check check (cardinality(families) <= 3 and families <@ array['product', 'engineering', 'data', 'research', 'design', 'marketing', 'sales', 'customer', 'operations', 'finance', 'people', 'legal', 'other']::text[]),
  add column levels text[] not null default '{}'
    constraint fh_profiles_levels_check check (cardinality(levels) <= 5 and levels <@ array['intern', 'entry', 'unspecified', 'senior', 'management']::text[]);

-- 4. The match query ----------------------------------------------------------------------------------------------

-- The signed-in person's roles, best first. security invoker: it runs as the caller, so the profile it reads is the
-- one row RLS lets that person see. The explicit user_id condition says the same thing again, so that a role which
-- bypasses RLS (the SQL editor) gets no rows instead of somebody's profile. There is no user id parameter.
--
-- Rules:
--   - only postings sharing at least one tag with the profile (an empty tag list, or no profile row: no rows);
--   - profile.families not empty: only those families; profile.levels not empty: only those levels. A posting the
--     worker has not labelled yet has neither, so it shows only while the person has set no filter;
--   - the same role in several cities is one row: grouped by company (company_id, or the lower-cased name where a
--     posting has no company row) and lower-cased, trimmed title. A posting without a title (a HN comment) is its
--     own group. The row shown is the group's best-scoring posting (then newest, then lowest id): its id, title,
--     url, family, level, shared and score. locations lists the cities of the group's postings that matched (a same-titled
--     posting sharing no tag with the person is not in it), posted_at is the newest of those;
--   - score = sum over the shared tags of ln(all postings / postings carrying the tag), rounded to 4 places. A tag
--     missing from fh_tag_counts (counts never refreshed) weighs 0, so the order falls back to newest first;
--   - shared: the person's tags the posting carries, rarest first;
--   - total: how many roles matched, the same on every row. A page past the end returns no rows and so no total;
--   - order: score, then newest, then id. p_limit is kept inside 1..100, p_offset at 0 or more.
--
-- Cost (36,551 postings; nothing here was run, see the hand-back):
--   - No families chosen: a profile of about 20 tags shares a tag with about 30,000 postings (29,887 measured for
--     the one real profile on 2026-11-12). No index helps a condition four rows in five satisfy; the planner reads
--     the whole table once (the lead measured 101 ms for a twelve-tag search over all rows), then scores about
--     30,000 rows against at most 60 weights each, sorts them once by group and once by score. An estimate, not measured: a few
--     hundred ms. A posting's `text` is never read; the long ones (over about 2 KB) are stored apart from the row
--     and are not even passed over.
--   - Families chosen (what the profile page asks for): fh_postings_family narrows the read to those families'
--     rows before any tag is compared, and everything after it shrinks with it. A small family (product, design)
--     is a few thousand rows; engineering is large enough that the planner may still read the whole table.
--   - The index is only usable if the planner sees the profile's actual lists, because "families is empty OR
--     family = any (families)" cannot use an index while the list is unknown. That is why this is plpgsql with the
--     lists in variables and plan_cache_mode = force_custom_plan: every call is planned with the values in hand,
--     and the OR folds away. The cost of planning each call was not measured.
--   - count(*) of fh_postings on every call: an index-only scan of 36,551 entries; not measured.
--   - Paging re-does all of it for each page; fine at 50 a page, and the place to add a cache if it ever is not.
create or replace function public.fh_matches(p_limit integer default 50, p_offset integer default 0)
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
begin
  select f.tags, f.families, f.levels into v_tags, v_families, v_levels
  from public.fh_profiles f
  where f.user_id = ((select auth.jwt()) ->> 'sub');
  if not found or coalesce(cardinality(v_tags), 0) = 0 then
    return;
  end if;
  select count(*) into v_all from public.fh_postings;

  return query
  with weights as materialized (
    -- One row a profile tag: ln(all postings / postings carrying it). Never below 0, even on stale counts.
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
-- Supabase grants execute on a new public function to anon, authenticated and service_role by default: take all of
-- it back, then give it to signed-in people only. The worker has no use for it and cannot read fh_profiles anyway.
revoke all on function public.fh_matches(integer, integer) from public, anon, authenticated, service_role;
grant execute on function public.fh_matches(integer, integer) to authenticated;
