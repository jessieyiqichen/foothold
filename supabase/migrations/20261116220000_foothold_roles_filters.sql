-- Filters on All roles (/matches) (user, 2026-11-16): kind of work, level, age, a text search, a place, and a sort,
-- with a count beside each option ("Internship 212"). fh_roles replaces fh_matches on that page; fh_matches stays
-- until the page has moved and is dropped later. The ranking is fh_matches' (20261114120000_foothold_company_cards.sql):
-- the same tag weights, open roles only, one row for the same title at the same company, and the HN exception for a
-- missing posted_at.
--
-- NOT APPLIED. The functions read the caller's own profile (fh_profiles, per-person data), so this goes to `reviewer`
-- before the lead applies it. No table, policy or grant on a table changes.
--
-- The family and level ids repeat FAMILIES and LEVELS in packages/core/src/roles.ts (and the checks on fh_postings
-- and fh_profiles in 20261112100000_foothold_matching.sql). Change them together.

-- 1. The caller's filters, cleaned -------------------------------------------------------------------------------

-- One place that turns what the page sends into what the queries use, so fh_roles and fh_roles_facets cannot read the
-- same request two ways. It runs as the caller and reads only the caller's own profile row.
--   families, levels: null = the caller's profile values (the page's default); an empty array = no filter; otherwise
--     those values, with ids that are not a known family or level dropped. A list of only unknown ids is therefore
--     no filter, not "nothing".
--   since: p_days null = any age (null); otherwise now() minus p_days kept inside 1..365.
--   query: matched against title or company name, case-insensitive. place: matched against the location text.
--     Both are trimmed, cut at 100 characters, and have \ % _ escaped, so what the person types is matched as
--     written and never as a pattern; empty = no filter. They come back as ILIKE patterns ('%...%').
--   remote: p_place 'remote' (any case) matches 'remote', 'anywhere' or 'distributed' in the location instead of
--     the word itself. Location is free text with no region field, so this is a text match, not a region.
create function public.fh_roles_filter(
  p_families text[], p_levels text[], p_days integer, p_query text, p_place text,
  out families text[], out levels text[], out since timestamptz, out query text, out place text, out remote boolean
)
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_known_families constant text[] := array['product', 'engineering', 'data', 'research', 'design', 'marketing', 'sales', 'customer', 'operations', 'finance', 'people', 'legal', 'other'];
  v_known_levels constant text[] := array['intern', 'entry', 'unspecified', 'senior', 'management'];
  v_profile_families text[];
  v_profile_levels text[];
  v_place text;
begin
  select f.families, f.levels into v_profile_families, v_profile_levels
  from public.fh_profiles f
  where f.user_id = ((select auth.jwt()) ->> 'sub');
  families := coalesce(
    case when p_families is null then v_profile_families
         else array(select distinct x from unnest(p_families) as u(x) where x = any (v_known_families)) end,
    '{}');
  levels := coalesce(
    case when p_levels is null then v_profile_levels
         else array(select distinct x from unnest(p_levels) as u(x) where x = any (v_known_levels)) end,
    '{}');
  since := case when p_days is null then null else now() - make_interval(days => least(greatest(p_days, 1), 365)) end;
  query := nullif(left(btrim(coalesce(p_query, '')), 100), '');
  query := '%' || replace(replace(replace(query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  v_place := nullif(left(btrim(coalesce(p_place, '')), 100), '');
  remote := lower(coalesce(v_place, '')) = 'remote';
  place := case when remote then null
                else '%' || replace(replace(replace(v_place, '\', '\\'), '%', '\%'), '_', '\_') || '%' end;
end $$;
revoke all on function public.fh_roles_filter(text[], text[], integer, text, text) from public, anon, authenticated, service_role;
grant execute on function public.fh_roles_filter(text[], text[], integer, text, text) to authenticated;

-- 2. The roles -------------------------------------------------------------------------------------------------------

-- The signed-in person's roles with the page's filters, best first or newest first. Same columns as fh_matches.
-- p_sort 'newest': newest first (no date last), then score; anything else is 'fit': score, then newest. Then id, so
-- the order is stable for paging. p_limit is kept inside 1..100, p_offset at 0 or more. total is the number of roles
-- that match the filters, the same on every row. No profile, or a profile with no tags: no rows.
-- plpgsql with plan_cache_mode = force_custom_plan, as fh_matches, so each call is planned with the filter values in
-- hand and "empty list or family = any (...)" folds away.
create function public.fh_roles(
  p_families text[] default null, p_levels text[] default null, p_days integer default 60, p_query text default null,
  p_place text default null, p_sort text default 'fit', p_limit integer default 50, p_offset integer default 0
)
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
  v_all bigint;
  v_families text[];
  v_levels text[];
  v_since timestamptz;
  v_query text;
  v_place text;
  v_remote boolean;
  v_newest boolean := p_sort = 'newest';
begin
  select f.tags into v_tags from public.fh_profiles f where f.user_id = ((select auth.jwt()) ->> 'sub');
  if not found or coalesce(cardinality(v_tags), 0) = 0 then
    return;
  end if;
  select r.families, r.levels, r.since, r.query, r.place, r.remote
    into v_families, v_levels, v_since, v_query, v_place, v_remote
  from public.fh_roles_filter(p_families, p_levels, p_days, p_query, p_place) r;
  select count(*) into v_all from public.fh_postings;

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
      and (v_query is null or p.title ilike v_query or p.company_name ilike v_query)
      and (v_place is null or p.location ilike v_place)
      and (not v_remote or p.location ~* 'remote|anywhere|distributed')
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
  order by (case when v_newest then r.newest end) desc nulls last, r.score desc, r.newest desc nulls last, r.id
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end $$;
revoke all on function public.fh_roles(text[], text[], integer, text, text, text, integer, integer) from public, anon, authenticated, service_role;
grant execute on function public.fh_roles(text[], text[], integer, text, text, text, integer, integer) to authenticated;

-- 3. The counts beside each option ---------------------------------------------------------------------------------

-- How many roles (one a company and title, as fh_roles counts them) each option would show:
--   facet 'family', value a family id: every filter applied except the families;
--   facet 'level',  value a level id:  every filter applied except the levels;
--   facet 'days',   value '7', '30', '60' or 'any': every filter applied except the age. An HN post with no date
--     counts in every one, as fh_roles keeps it.
-- An option with no role has no row (the page shows 0). Roles not yet labelled with a family or level are left out of
-- those two facets. One read of fh_postings: the matching open postings, filtered by query and place, are kept once
-- with a flag for each of the three filters, and the counts are taken from that. No scores are computed.
-- Same parameters and the same cleaning as fh_roles (fh_roles_filter). No profile, or no tags: no rows.
create function public.fh_roles_facets(
  p_families text[] default null, p_levels text[] default null, p_days integer default 60, p_query text default null,
  p_place text default null
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
begin
  select f.tags into v_tags from public.fh_profiles f where f.user_id = ((select auth.jwt()) ->> 'sub');
  if not found or coalesce(cardinality(v_tags), 0) = 0 then
    return;
  end if;
  select r.families, r.levels, r.since, r.query, r.place, r.remote
    into v_families, v_levels, v_since, v_query, v_place, v_remote
  from public.fh_roles_filter(p_families, p_levels, p_days, p_query, p_place) r;

  return query
  with base as materialized (
    select coalesce(p.company_id::text, 'name:' || lower(p.company_name)) || '|' || coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as k,
           p.family, p.level, p.posted_at, p.source = 'hn' and p.posted_at is null as undated_hn,
           (cardinality(v_families) = 0 or p.family = any (v_families)) as fam_ok,
           (cardinality(v_levels) = 0 or p.level = any (v_levels)) as lvl_ok,
           (v_since is null or p.posted_at >= v_since or (p.posted_at is null and p.source = 'hn')) as day_ok
    from public.fh_postings p
    where p.tags && v_tags
      and p.closed_at is null
      and (v_query is null or p.title ilike v_query or p.company_name ilike v_query)
      and (v_place is null or p.location ilike v_place)
      and (not v_remote or p.location ~* 'remote|anywhere|distributed')
  )
  select 'family'::text, b.family, count(distinct b.k)
  from base b where b.lvl_ok and b.day_ok and b.family is not null group by b.family
  union all
  select 'level'::text, b.level, count(distinct b.k)
  from base b where b.fam_ok and b.day_ok and b.level is not null group by b.level
  union all
  select 'days'::text, d.v, count(distinct b.k)
  from (values ('7', 7), ('30', 30), ('60', 60), ('any', null)) as d(v, days)
  join base b on b.fam_ok and b.lvl_ok
    and (d.days is null or b.undated_hn or b.posted_at >= now() - make_interval(days => d.days))
  group by d.v;
end $$;
revoke all on function public.fh_roles_facets(text[], text[], integer, text, text) from public, anon, authenticated, service_role;
grant execute on function public.fh_roles_facets(text[], text[], integer, text, text) to authenticated;
