-- Foothold: the Judge's signals, part 3 of 3: companies (docs/judge-signals.md, "What reads it"). Decided by the user
-- on 2026-11-22, one question at a time (log.md). Apply after parts 1 and 2 (20261122200000_foothold_posting_signals.sql,
-- 20261122200100_foothold_signals_reads.sql). Applied 2026-11-22 (log.md). These functions read the caller's own profile and
-- serve signed-out visitors, so the file goes to `reviewer` before the lead applies it.
--
-- Same signatures and columns as now, so each is replaced in place and keeps its grants (re-issued below as before):
--   fh_company_fit (20261114120000_foothold_company_cards.sql): a company's best role, its extra-role bonus and its
--     recency come from its roles that do not need years when it has any. A company whose matching roles all need
--     years scores FIT_YEARS_PENALTY (1000) less, which is more than any score reaches (the best role's tag score plus
--     at most 3.0), so it ranks after every other company on Today and Companies by fit, in its own fit order. Roles
--     that need years come after the others among the two it returns, and each role carries needs_years and signals.
--     last_posted_at, recent_roles and shared still count every matching role.
--   fh_company (20261121100000_foothold_company_page.sql) and fh_public_company (20261122100000_foothold_public_browse.sql):
--     each role in `roles` carries needs_years and signals (emails taken out of the quotes in the public one), and
--     roles that need years are listed after the others, after the asked role and the best role.
-- A role "needs years" when its text requires 3 years or more (years_required and years_min >= 3), as in part 2.
-- Security and the explicit filters on the caller's token are as before: fh_company_fit and fh_company are invoker,
-- fh_public_company is definer and reads no profile.

-- 1. Ranking companies for the caller --------------------------------------------------------------------------------

create or replace function public.fh_company_fit(p_days integer default 60, p_companies bigint[] default null)
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
           coalesce(g.years_required and g.years_min >= 3, false) as needs_years,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    left join public.fh_posting_signals g on g.posting_id = p.id
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
    order by s.company_id, s.title_key, s.needs_years, s.score desc, s.posted_at desc nulls last, s.id
  ),
  flagged as (
    select o.*, bool_or(not o.needs_years) over (partition by o.company_id) as has_open
    from one_per_title o
  ),
  numbered as (
    select f.*, (not f.needs_years or not f.has_open) as counts,
           row_number() over (partition by f.company_id order by f.needs_years, f.score desc, f.posted_at desc nulls last, f.id) as n
    from flagged f
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
           bool_or(k.has_open) as has_open,
           max(k.score) filter (where k.counts) as best,
           count(*) filter (where k.counts) as counted,
           max(k.posted_at) filter (where k.counts) as counted_newest,
           jsonb_agg(jsonb_build_object(
             'id', k.id, 'title', k.title, 'url', k.url, 'posted_at', k.posted_at,
             'family', k.family, 'level', k.level, 'shared', to_jsonb(k.shared), 'needs_years', k.needs_years,
             'signals', (select public.fh_signals_json(x, false) from public.fh_posting_signals x where x.posting_id = k.id)
           ) order by k.n) filter (where k.n <= 2) as roles
    from numbered k
    group by k.company_id
  )
  select c.company_id, c.last_posted_at, c.recent_roles,
         coalesce(array(select w.tag from weights w where w.tag = any (ts.tags) order by w.w desc, w.tag), '{}') as shared,
         round(
           c.best
           + 0.5 * least(c.counted - 1, 4)
           + coalesce(least(1, greatest(0, 1 - extract(epoch from (now() - c.counted_newest)) / 86400 / 60)), 0)::numeric
           - (case when c.has_open then 0 else 1000 end),
           4) as score,
         c.roles
  from companies c
  left join tag_sets ts on ts.company_id = c.company_id;
end $$;
revoke all on function public.fh_company_fit(integer, bigint[]) from public, anon, authenticated, service_role;
grant execute on function public.fh_company_fit(integer, bigint[]) to authenticated;

-- 2. One company's page (signed in) ----------------------------------------------------------------------------------

create or replace function public.fh_company(p_company bigint default null, p_role bigint default null)
returns table (
  company_id bigint, name text, one_liner text, website text, team_size integer, batch text, stage text,
  investors text[], last_posted_at timestamptz, recent_roles integer, shared text[], score numeric, roles jsonb,
  best_role bigint, person jsonb, decision text, decided_at timestamptz, founders_url text
)
language sql stable security invoker set search_path = '' as $$
  with me as (
    select ((select auth.jwt()) ->> 'sub') as user_id
  ),
  target as (
    select coalesce(p_company, (select p.company_id from public.fh_postings p where p.id = p_role)) as id
  ),
  fit as (
    select f.* from public.fh_company_fit(60, array[(select t.id from target t)]) f
  ),
  best as (
    select nullif((select f.roles -> 0 ->> 'id' from fit f), '')::bigint as id
  ),
  my_tags as (
    select coalesce((select f.tags from public.fh_profiles f where f.user_id = (select m.user_id from me m)), '{}') as tags
  ),
  open_roles as (
    select p.id, p.title, p.url, p.posted_at, p.family, p.level,
           array(select t.tag from unnest(p.tags) as t(tag) where t.tag = any (mt.tags) order by t.tag) as shared,
           coalesce(g.years_required and g.years_min >= 3, false) as needs_years,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    cross join my_tags mt
    left join public.fh_posting_signals g on g.posting_id = p.id
    where p.company_id = (select t.id from target t)
      and p.closed_at is null
      and (p.posted_at >= now() - interval '180 days' or (p.posted_at is null and p.source = 'hn') or p.id = p_role)
  ),
  one_per_title as (
    select distinct on (o.title_key) o.*
    from open_roles o
    order by o.title_key, (o.id = p_role) desc, (o.id = (select b.id from best b)) desc, o.needs_years,
             cardinality(o.shared) desc, o.posted_at desc nulls last, o.id
  ),
  shown as (
    select o.* from one_per_title o
    order by (o.id = p_role) desc, (o.id = (select b.id from best b)) desc, o.needs_years,
             cardinality(o.shared) desc, o.posted_at desc nulls last, o.id
    limit 30
  )
  select c.id, c.name, c.one_liner, c.website, c.team_size, c.batch, c.stage, c.lists,
         f.last_posted_at, coalesce(f.recent_roles, 0), coalesce(f.shared, '{}'), coalesce(f.score, 0),
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'id', s.id, 'title', s.title, 'url', s.url, 'posted_at', s.posted_at,
                    'family', s.family, 'level', s.level, 'shared', to_jsonb(s.shared), 'needs_years', s.needs_years,
                    'signals', public.fh_signals_json(g, false)
                  ) order by (s.id = (select b.id from best b)) desc, s.needs_years, cardinality(s.shared) desc, s.posted_at desc nulls last, s.id)
           from shown s
           left join public.fh_posting_signals g on g.posting_id = s.id), '[]'::jsonb),
         (select b.id from best b),
         public.fh_company_person(c.id), d.decision, d.decided_at, public.fh_founders_url(c.source, c.source_url, c.slug)
  from public.fh_companies c
  left join fit f on f.company_id = c.id
  left join public.fh_decisions d on d.company_id = c.id and d.user_id = (select m.user_id from me m)
  where c.id = (select t.id from target t);
$$;
revoke all on function public.fh_company(bigint, bigint) from public, anon, authenticated, service_role;
grant execute on function public.fh_company(bigint, bigint) to authenticated;

-- 3. One company's page for a signed-out visitor -----------------------------------------------------------------------

create or replace function public.fh_public_company(p_company bigint default null, p_role bigint default null)
returns table (
  company_id bigint, name text, one_liner text, website text, team_size integer, batch text, stage text,
  investors text[], last_posted_at timestamptz, recent_roles integer, roles jsonb, founders_url text
)
language sql stable security definer set search_path = '' as $$
  with target as (
    select coalesce(p_company, (select p.company_id from public.fh_postings p where p.id = p_role)) as id
  ),
  open_roles as (
    select p.id, p.title, p.url, p.posted_at, p.family, p.level,
           coalesce(g.years_required and g.years_min >= 3, false) as needs_years,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    left join public.fh_posting_signals g on g.posting_id = p.id
    where p.company_id = (select t.id from target t)
      and p.closed_at is null
      and (p.posted_at >= now() - interval '180 days' or (p.posted_at is null and p.source = 'hn') or p.id = p_role)
  ),
  one_per_title as (
    select distinct on (o.title_key) o.*
    from open_roles o
    order by o.title_key, (o.id = p_role) desc, o.needs_years, o.posted_at desc nulls last, o.id
  ),
  shown as (
    select o.* from one_per_title o
    order by (o.id = p_role) desc, o.needs_years, o.posted_at desc nulls last, o.id
    limit 30
  )
  select c.id, c.name, c.one_liner, c.website, c.team_size, c.batch, c.stage, c.lists,
         (select max(s.posted_at) from shown s),
         (select count(*)::integer from open_roles o where o.posted_at >= now() - interval '60 days'),
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'id', s.id, 'title', regexp_replace(s.title, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g'),
                    'url', s.url, 'posted_at', s.posted_at, 'family', s.family, 'level', s.level, 'shared', '[]'::jsonb,
                    'needs_years', s.needs_years, 'signals', public.fh_signals_json(g, true)
                  ) order by (s.id = p_role) desc, s.needs_years, s.posted_at desc nulls last, s.id)
           from shown s
           left join public.fh_posting_signals g on g.posting_id = s.id), '[]'::jsonb),
         public.fh_founders_url(c.source, c.source_url, c.slug)
  from public.fh_companies c
  where c.id = (select t.id from target t);
$$;
revoke all on function public.fh_public_company(bigint, bigint) from public, anon, authenticated, service_role;
grant execute on function public.fh_public_company(bigint, bigint) to anon, authenticated;
