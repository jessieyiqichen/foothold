-- Foothold: the Judge's signals, part 2 of 3: the roles lists (docs/judge-signals.md, "What reads it"). Decided by the
-- user on 2026-11-22, one question at a time (log.md). Apply after part 1 (20261122200000_foothold_posting_signals.sql)
-- and before part 3 (20261122200200_foothold_signals_companies.sql, the company functions). Applied 2026-11-22 (log.md). These
-- functions read the caller's own profile and serve signed-out visitors, so the file goes to `reviewer` before the
-- lead applies it.
--
-- What changes:
--   fh_roles, fh_public_roles: each role carries `needs_years` and `signals` (fh_signals_json), and five new filters.
--     fh_roles' fit order puts roles that need years after the others; its newest order is unchanged.
--   fh_roles_facets: the same five filters, so the counts agree with the list.
-- A role "needs years" when its text requires 3 years or more: years_required and years_min >= 3 (the eval rule:
-- 0 to 2 years is new grad). A role with no signals row yet needs none.
--
-- The filters (pinned with web-ui, 2026-11-22):
--   p_hide_years: true hides roles that need years; null or false hides nothing, and no profile is read for it. The
--     web app sends true itself when its default is on (a profile whose levels include 'intern' or 'entry' and
--     neither 'senior' nor 'management'), so the database never turns the filter on by itself.
--   p_min_salary (USD a year): only roles with a USD salary whose annual upper bound reaches it: salary_max, or
--     salary_min for a floor-only salary ("$150k+"), times 2,080 when hourly. Roles with no salary, or a salary in
--     another currency, are dropped while it is set. A stored salary that is on-target earnings (salary_ote) counts
--     with its upper bound like any other, so an OTE range can meet a minimum its base would not.
--   p_visa: 'sponsors' keeps only visa = 'sponsors'; 'not_citizens_only' hides only visa = 'citizens_only' (roles
--     that say no sponsorship, or say nothing, stay). Any other value matches nothing.
--   p_equity, p_k401: true keeps only roles that offer it.
--
-- Applying this file before the web deploy hides nothing from the live app: the app live today sends none of the
-- new parameters (so every filter is off) and ignores the new columns. What does change at once, for everyone signed
-- in: once this file and part 3 are applied and the rules task has run, fh_roles' fit order (All roles / Jobs, sorted
-- by fit) lists roles that need years after the others, and Today (fh_company_fit, part 3) ranks companies whose
-- matching roles all need years after the others. That is the agreed "sort them lower" and does not wait for the web
-- deploy; roles are never hidden by it.
--
-- New parameters change the signatures of fh_roles, fh_roles_facets and fh_public_roles, so each old one is dropped
-- and the new one created here. Every existing parameter keeps its name, position and default, and the new ones come
-- last with null defaults, so the live app's calls keep working. Grants are re-issued as before. Each function keeps
-- its security (invoker or definer) and its explicit filter on the caller's token. The public functions strip
-- emails from quotes with fh_strip_emails (part 1), also in disguised forms, and never return pending sentences.

-- 1. All roles (signed in) -------------------------------------------------------------------------------------------

drop function public.fh_roles(text[], text[], integer, text, text, text, integer, integer);

create function public.fh_roles(
  p_families text[] default null, p_levels text[] default null, p_days integer default 60, p_query text default null,
  p_place text default null, p_sort text default 'fit', p_limit integer default 50, p_offset integer default 0,
  p_hide_years boolean default null, p_visa text default null, p_min_salary integer default null,
  p_equity boolean default null, p_k401 boolean default null
)
returns table (
  id bigint, title text, company_name text, url text, locations text[], posted_at timestamptz,
  family text, level text, shared text[], score numeric, total bigint, needs_years boolean, signals jsonb
)
language plpgsql stable security invoker
set search_path = ''
set plan_cache_mode = 'force_custom_plan'
as $$
#variable_conflict use_column
declare
  v_tags text[];
  v_all bigint;
  v_families text[];
  v_levels text[];
  v_since timestamptz;
  v_query text;
  v_place text;
  v_remote boolean;
  v_newest boolean := p_sort = 'newest';
  v_hide boolean;
  v_visa text;
  v_min_salary integer;
  v_equity boolean;
  v_k401 boolean;
begin
  select f.tags into v_tags from public.fh_profiles f where f.user_id = ((select auth.jwt()) ->> 'sub');
  if not found or coalesce(cardinality(v_tags), 0) = 0 then
    return;
  end if;
  select r.families, r.levels, r.since, r.q_pattern, r.place_pattern, r.remote
    into v_families, v_levels, v_since, v_query, v_place, v_remote
  from public.fh_roles_filter(p_families, p_levels, p_days, p_query, p_place) r;
  select x.hide_years, x.visa, x.min_salary, x.equity, x.k401 into v_hide, v_visa, v_min_salary, v_equity, v_k401
  from public.fh_signals_filter(p_hide_years, p_visa, p_min_salary, p_equity, p_k401, false) x;
  select count(*) into v_all from public.fh_postings;

  return query
  with weights as materialized (
    select t.tag, coalesce(ln(greatest(v_all::numeric / c.n, 1)), 0) as w
    from (select distinct u.tag from unnest(v_tags) as u(tag) where u.tag is not null) t
    left join public.fh_tag_counts c on c.tag = t.tag
  ),
  scored as (
    select p.id, p.title, p.company_name, p.url, p.location, p.posted_at, p.family, p.level, s.shared, s.score,
           coalesce(g.years_required and g.years_min >= 3, false) as needs_years,
           coalesce(p.company_id::text, 'name:' || lower(p.company_name)) as company_key,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    left join public.fh_posting_signals g on g.posting_id = p.id
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
      and (v_query is null or p.title ilike v_query escape '\' or p.company_name ilike v_query escape '\')
      and (v_place is null or p.location ilike v_place escape '\')
      and (not v_remote or p.location ~* 'remote|anywhere|distributed')
      and (not v_hide or not coalesce(g.years_required and g.years_min >= 3, false))
      and (v_visa is null or (v_visa = 'sponsors' and g.visa = 'sponsors')
           or (v_visa = 'not_citizens_only' and g.visa is distinct from 'citizens_only'))
      and (v_min_salary is null or (g.salary_currency = 'USD'
           and coalesce(g.salary_max, g.salary_min) * (case when g.salary_period = 'hour' then 2080 else 1 end) >= v_min_salary))
      and (not v_equity or coalesce(g.equity, false))
      and (not v_k401 or coalesce(g.k401, false))
  ),
  ranked as (
    select s.id, s.title, s.company_name, s.url, s.family, s.level, s.shared, s.score, s.needs_years,
           row_number() over (partition by s.company_key, s.title_key
                              order by s.score desc, s.posted_at desc nulls last, s.id) as pick,
           max(s.posted_at) over (partition by s.company_key, s.title_key) as newest,
           array_agg(s.location) over (partition by s.company_key, s.title_key) as places
    from scored s
  ),
  page as (
    select r.id, r.title, r.company_name, r.url, r.places, r.newest, r.family, r.level, r.shared, r.score, r.needs_years,
           count(*) over () as total
    from ranked r
    where r.pick = 1
    order by (case when v_newest then r.newest end) desc nulls last, (case when not v_newest then r.needs_years end),
             r.score desc, r.newest desc nulls last, r.id
    limit least(greatest(coalesce(p_limit, 50), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select pg.id, pg.title, pg.company_name, pg.url,
         array(select distinct l.place from unnest(pg.places) as l(place) where l.place is not null order by 1) as locations,
         pg.newest as posted_at, pg.family, pg.level, pg.shared, pg.score, pg.total, pg.needs_years,
         public.fh_signals_json(g, false) as signals
  from page pg
  left join public.fh_posting_signals g on g.posting_id = pg.id
  order by (case when v_newest then pg.newest end) desc nulls last, (case when not v_newest then pg.needs_years end),
           pg.score desc, pg.newest desc nulls last, pg.id;
end $$;
revoke all on function public.fh_roles(text[], text[], integer, text, text, text, integer, integer, boolean, text, integer, boolean, boolean) from public, anon, authenticated, service_role;
grant execute on function public.fh_roles(text[], text[], integer, text, text, text, integer, integer, boolean, text, integer, boolean, boolean) to authenticated;

-- 2. The counts beside each option (signed in) -------------------------------------------------------------------------

drop function public.fh_roles_facets(text[], text[], integer, text, text);

create function public.fh_roles_facets(
  p_families text[] default null, p_levels text[] default null, p_days integer default 60, p_query text default null,
  p_place text default null,
  p_hide_years boolean default null, p_visa text default null, p_min_salary integer default null,
  p_equity boolean default null, p_k401 boolean default null
)
returns table (facet text, value text, n bigint)
language plpgsql stable security invoker
set search_path = ''
set plan_cache_mode = 'force_custom_plan'
as $$
#variable_conflict use_column
declare
  v_tags text[];
  v_families text[];
  v_levels text[];
  v_since timestamptz;
  v_query text;
  v_place text;
  v_remote boolean;
  v_hide boolean;
  v_visa text;
  v_min_salary integer;
  v_equity boolean;
  v_k401 boolean;
begin
  select f.tags into v_tags from public.fh_profiles f where f.user_id = ((select auth.jwt()) ->> 'sub');
  if not found or coalesce(cardinality(v_tags), 0) = 0 then
    return;
  end if;
  select r.families, r.levels, r.since, r.q_pattern, r.place_pattern, r.remote
    into v_families, v_levels, v_since, v_query, v_place, v_remote
  from public.fh_roles_filter(p_families, p_levels, p_days, p_query, p_place) r;
  select x.hide_years, x.visa, x.min_salary, x.equity, x.k401 into v_hide, v_visa, v_min_salary, v_equity, v_k401
  from public.fh_signals_filter(p_hide_years, p_visa, p_min_salary, p_equity, p_k401, false) x;

  return query
  with base as materialized (
    select coalesce(p.company_id::text, 'name:' || lower(p.company_name)) as ck,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as tk,
           p.family, p.level, p.posted_at, p.source = 'hn' and p.posted_at is null as undated_hn,
           (cardinality(v_families) = 0 or p.family = any (v_families)) as fam_ok,
           (cardinality(v_levels) = 0 or p.level = any (v_levels)) as lvl_ok,
           (v_since is null or p.posted_at >= v_since or (p.posted_at is null and p.source = 'hn')) as day_ok
    from public.fh_postings p
    left join public.fh_posting_signals g on g.posting_id = p.id
    where p.tags && v_tags
      and p.closed_at is null
      and (v_query is null or p.title ilike v_query escape '\' or p.company_name ilike v_query escape '\')
      and (v_place is null or p.location ilike v_place escape '\')
      and (not v_remote or p.location ~* 'remote|anywhere|distributed')
      and (not v_hide or not coalesce(g.years_required and g.years_min >= 3, false))
      and (v_visa is null or (v_visa = 'sponsors' and g.visa = 'sponsors')
           or (v_visa = 'not_citizens_only' and g.visa is distinct from 'citizens_only'))
      and (v_min_salary is null or (g.salary_currency = 'USD'
           and coalesce(g.salary_max, g.salary_min) * (case when g.salary_period = 'hour' then 2080 else 1 end) >= v_min_salary))
      and (not v_equity or coalesce(g.equity, false))
      and (not v_k401 or coalesce(g.k401, false))
  )
  select 'family'::text, b.family, count(distinct (b.ck, b.tk))
  from base b where b.lvl_ok and b.day_ok and b.family is not null group by b.family
  union all
  select 'level'::text, b.level, count(distinct (b.ck, b.tk))
  from base b where b.fam_ok and b.day_ok and b.level is not null group by b.level
  union all
  select 'days'::text, d.v, count(distinct (b.ck, b.tk))
  from (values ('7', 7), ('30', 30), ('60', 60), ('any', null)) as d(v, days)
  join base b on b.fam_ok and b.lvl_ok
    and (d.days is null or b.undated_hn or b.posted_at >= now() - make_interval(days => d.days))
  group by d.v;
end $$;
revoke all on function public.fh_roles_facets(text[], text[], integer, text, text, boolean, text, integer, boolean, boolean) from public, anon, authenticated, service_role;
grant execute on function public.fh_roles_facets(text[], text[], integer, text, text, boolean, text, integer, boolean, boolean) to authenticated;

-- 3. Jobs for a signed-out visitor ---------------------------------------------------------------------------------------

drop function public.fh_public_roles(text[], text[], integer, text, text, integer, integer);

create function public.fh_public_roles(
  p_families text[] default '{}', p_levels text[] default '{}', p_days integer default 60, p_query text default null,
  p_place text default null, p_limit integer default 50, p_offset integer default 0,
  p_hide_years boolean default null, p_visa text default null, p_min_salary integer default null,
  p_equity boolean default null, p_k401 boolean default null
)
returns table (
  id bigint, title text, company_id bigint, company_name text, url text, locations text[], posted_at timestamptz,
  family text, level text, total bigint, needs_years boolean, signals jsonb
)
language plpgsql stable security definer
set search_path = ''
set plan_cache_mode = 'force_custom_plan'
as $$
#variable_conflict use_column
declare
  v_families text[];
  v_levels text[];
  v_since timestamptz;
  v_query text;
  v_place text;
  v_remote boolean;
  v_hide boolean;
  v_visa text;
  v_min_salary integer;
  v_equity boolean;
  v_k401 boolean;
begin
  select r.families, r.levels, r.since, r.q_pattern, r.place_pattern, r.remote
    into v_families, v_levels, v_since, v_query, v_place, v_remote
  from public.fh_roles_filter((coalesce(p_families, '{}'))[1:20], (coalesce(p_levels, '{}'))[1:20], p_days, p_query, p_place) r;
  -- No profile is read here: a null p_hide_years means off
  select x.hide_years, x.visa, x.min_salary, x.equity, x.k401 into v_hide, v_visa, v_min_salary, v_equity, v_k401
  from public.fh_signals_filter(p_hide_years, left(p_visa, 100), p_min_salary, p_equity, p_k401, false) x;

  return query
  with picked as (
    select p.id, p.title, p.company_id, p.company_name, p.url, p.location, p.posted_at, p.family, p.level,
           coalesce(g.years_required and g.years_min >= 3, false) as needs_years,
           coalesce(p.company_id::text, 'name:' || lower(p.company_name)) as company_key,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    left join public.fh_posting_signals g on g.posting_id = p.id
    where p.closed_at is null
      and (v_since is null or p.posted_at >= v_since or (p.posted_at is null and p.source = 'hn'))
      and (cardinality(v_families) = 0 or p.family = any (v_families))
      and (cardinality(v_levels) = 0 or p.level = any (v_levels))
      and (v_query is null or p.title ilike v_query escape '\' or p.company_name ilike v_query escape '\')
      and (v_place is null or p.location ilike v_place escape '\')
      and (not v_remote or p.location ~* 'remote|anywhere|distributed')
      and (not v_hide or not coalesce(g.years_required and g.years_min >= 3, false))
      and (v_visa is null or (v_visa = 'sponsors' and g.visa = 'sponsors')
           or (v_visa = 'not_citizens_only' and g.visa is distinct from 'citizens_only'))
      and (v_min_salary is null or (g.salary_currency = 'USD'
           and coalesce(g.salary_max, g.salary_min) * (case when g.salary_period = 'hour' then 2080 else 1 end) >= v_min_salary))
      and (not v_equity or coalesce(g.equity, false))
      and (not v_k401 or coalesce(g.k401, false))
  ),
  ranked as (
    select k.*, row_number() over (partition by k.company_key, k.title_key order by k.posted_at desc nulls last, k.id) as pick,
           max(k.posted_at) over (partition by k.company_key, k.title_key) as newest,
           array_agg(k.location) over (partition by k.company_key, k.title_key) as places
    from picked k
  ),
  page as (
    select r.id, r.title, r.company_id, r.company_name, r.url, r.places, r.newest, r.family, r.level, r.needs_years,
           count(*) over () as total
    from ranked r
    where r.pick = 1
    order by r.newest desc nulls last, r.id
    limit least(greatest(coalesce(p_limit, 50), 1), 100)
    offset least(greatest(coalesce(p_offset, 0), 0), 10000)
  )
  select pg.id, regexp_replace(pg.title, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g'), pg.company_id, pg.company_name, pg.url,
         array(select distinct regexp_replace(l.place, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g')
               from unnest(pg.places) as l(place) where l.place is not null order by 1),
         pg.newest, pg.family, pg.level, pg.total, pg.needs_years, public.fh_signals_json(g, true)
  from page pg
  left join public.fh_posting_signals g on g.posting_id = pg.id
  order by pg.newest desc nulls last, pg.id;
end $$;
revoke all on function public.fh_public_roles(text[], text[], integer, text, text, integer, integer, boolean, text, integer, boolean, boolean) from public, anon, authenticated, service_role;
grant execute on function public.fh_public_roles(text[], text[], integer, text, text, integer, integer, boolean, text, integer, boolean, boolean) to anon, authenticated;
