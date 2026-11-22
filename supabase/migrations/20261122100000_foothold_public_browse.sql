-- Foothold: Jobs and Companies open to signed-out visitors (user, 2026-11-21, three questions agreed one at a time;
-- log.md). Lists and company pages are public; what depends on the person's resume (why it fits, the message, saving,
-- who to contact) stays signed-in only. A live numbers strip tops the signed-out Jobs page (borrowed from fastaijobs).
--
-- fh_companies and fh_postings stay readable by signed-in people only. Signed-out visitors (anon) read through these
-- four functions, which are security definer so they can, and which name every column they return: company facts and
-- role titles, places, dates and links. Never a posting's text, emails or author, never fh_people, never anyone's
-- profile, decisions or drafts. fh_companies_list reads the caller's own profile only when they are signed in and ask
-- for the fit order, through fh_company_fit, which filters by the caller's token.
--
-- Review, 2026-11-22: anyone with the publishable key can call these, so every list argument is cut to 20 items, the
-- offset to 10,000 and the text to 100 characters, and any email address in a title or place (Hacker News headers are
-- free text; 0 of 36,981 open postings had one that day) is taken out. fh_roles_filter and fh_company_fit are security
-- invoker, but called from these definer functions they run as the owner, past row-level security on fh_profiles:
-- they stay safe only because each reads the profile by the caller's token, explicitly. Keep that filter in them.
-- The numbers strip counts as the Jobs list does: one role per company and title, posted in the last 60 days.

-- 1. The numbers strip: open roles posted in the last 60 days, roles first seen in the last 7 days, companies hiring.
--    ("Today" read 0 most of the day, since the boards are read once a night; a rolled-back trial, 2026-11-22.)
create function public.fh_public_stats()
returns table (open_roles bigint, added_week bigint, hiring_companies bigint)
language sql stable security definer set search_path = '' as $$
  with fresh as (
    select coalesce(p.company_id::text, 'name:' || lower(p.company_name)) as company_key,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key,
           p.company_id, p.first_seen_at
    from public.fh_postings p
    where p.closed_at is null
      and (p.posted_at >= now() - interval '60 days' or (p.posted_at is null and p.source = 'hn'))
  )
  select count(distinct (f.company_key, f.title_key)),
         count(distinct (f.company_key, f.title_key)) filter (where f.first_seen_at >= now() - interval '7 days'),
         count(distinct f.company_id)
  from fresh f;
$$;

-- 2. Jobs for a signed-out visitor: the same filters as fh_roles (cleaned by fh_roles_filter, with every list given, so
--    no profile is read), newest first, one row per company and title. No skills, no score: those need a resume.
create function public.fh_public_roles(
  p_families text[] default '{}', p_levels text[] default '{}', p_days integer default 60, p_query text default null,
  p_place text default null, p_limit integer default 50, p_offset integer default 0
)
returns table (
  id bigint, title text, company_id bigint, company_name text, url text, locations text[], posted_at timestamptz,
  family text, level text, total bigint
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
begin
  select r.families, r.levels, r.since, r.q_pattern, r.place_pattern, r.remote
    into v_families, v_levels, v_since, v_query, v_place, v_remote
  from public.fh_roles_filter((coalesce(p_families, '{}'))[1:20], (coalesce(p_levels, '{}'))[1:20], p_days, p_query, p_place) r;

  return query
  with picked as (
    select p.id, p.title, p.company_id, p.company_name, p.url, p.location, p.posted_at, p.family, p.level,
           coalesce(p.company_id::text, 'name:' || lower(p.company_name)) as company_key,
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    where p.closed_at is null
      and (v_since is null or p.posted_at >= v_since or (p.posted_at is null and p.source = 'hn'))
      and (cardinality(v_families) = 0 or p.family = any (v_families))
      and (cardinality(v_levels) = 0 or p.level = any (v_levels))
      and (v_query is null or p.title ilike v_query escape '\' or p.company_name ilike v_query escape '\')
      and (v_place is null or p.location ilike v_place escape '\')
      and (not v_remote or p.location ~* 'remote|anywhere|distributed')
  ),
  ranked as (
    select k.*, row_number() over (partition by k.company_key, k.title_key order by k.posted_at desc nulls last, k.id) as pick,
           max(k.posted_at) over (partition by k.company_key, k.title_key) as newest,
           array_agg(k.location) over (partition by k.company_key, k.title_key) as places
    from picked k
  )
  select r.id, regexp_replace(r.title, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g'), r.company_id, r.company_name, r.url,
         array(select distinct regexp_replace(l.place, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g')
               from unnest(r.places) as l(place) where l.place is not null order by 1),
         r.newest, r.family, r.level, count(*) over ()
  from ranked r
  where r.pick = 1
  order by r.newest desc nulls last, r.id
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
  offset least(greatest(coalesce(p_offset, 0), 0), 10000);
end $$;

-- 3. One company's page for a signed-out visitor, by the company or by one of its roles: its facts, its open roles
--    (as fh_company lists them, the asked role always kept, no skills), and the founders' YC page. No person.
create function public.fh_public_company(p_company bigint default null, p_role bigint default null)
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
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    where p.company_id = (select t.id from target t)
      and p.closed_at is null
      and (p.posted_at >= now() - interval '180 days' or (p.posted_at is null and p.source = 'hn') or p.id = p_role)
  ),
  one_per_title as (
    select distinct on (o.title_key) o.*
    from open_roles o
    order by o.title_key, (o.id = p_role) desc, o.posted_at desc nulls last, o.id
  ),
  shown as (
    select o.* from one_per_title o
    order by (o.id = p_role) desc, o.posted_at desc nulls last, o.id
    limit 30
  )
  select c.id, c.name, c.one_liner, c.website, c.team_size, c.batch, c.stage, c.lists,
         (select max(s.posted_at) from shown s),
         (select count(*)::integer from open_roles o where o.posted_at >= now() - interval '60 days'),
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'id', s.id, 'title', regexp_replace(s.title, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g'),
                    'url', s.url, 'posted_at', s.posted_at, 'family', s.family, 'level', s.level, 'shared', '[]'::jsonb
                  ) order by (s.id = p_role) desc, s.posted_at desc nulls last, s.id)
           from shown s), '[]'::jsonb),
         public.fh_founders_url(c.source, c.source_url, c.slug)
  from public.fh_companies c
  where c.id = (select t.id from target t);
$$;

-- 4. Companies, for everyone: search (name or one line), stage codes, lists ('yc' means any YC batch), only those
--    hiring now (an open role in the last 60 days). Sorted by the newest role ('recent', the default), by open roles
--    ('roles'), or, for a signed-in person, by fit ('fit', fh_company_fit's score for them; anyone else gets 'recent').
--    total is the number matching, the same on every row.
create function public.fh_companies_list(
  p_query text default null, p_stages text[] default '{}', p_lists text[] default '{}', p_hiring boolean default true,
  p_sort text default 'recent', p_limit integer default 50, p_offset integer default 0
)
returns table (
  company_id bigint, name text, one_liner text, stage text, batch text, investors text[], open_roles integer,
  last_posted_at timestamptz, score numeric, total bigint
)
language plpgsql stable security definer
set search_path = ''
set plan_cache_mode = 'force_custom_plan'
as $$
#variable_conflict use_column
declare
  v_query text := nullif(left(btrim(coalesce(p_query, ''), E' \t\r\n'), 100), '');
  v_pattern text;
  v_fit boolean := p_sort = 'fit' and coalesce((select auth.jwt()) ->> 'sub', '') <> '';
  v_stages text[] := (coalesce(p_stages, '{}'))[1:20];
  v_yc boolean := 'yc' = any ((coalesce(p_lists, '{}'))[1:20]);
  v_lists text[] := array(select l from unnest((coalesce(p_lists, '{}'))[1:20]) as l where l <> 'yc');
begin
  v_pattern := case when v_query is null then null
    else '%' || replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_') || '%' end;

  return query
  with hiring as (
    select p.company_id, count(*)::integer as n, max(p.posted_at) as newest
    from public.fh_postings p
    where p.company_id is not null and p.closed_at is null
      and (p.posted_at >= now() - interval '60 days' or (p.posted_at is null and p.source = 'hn'))
    group by p.company_id
  ),
  fit as (
    select f.company_id, f.score from public.fh_company_fit(60, null) f where v_fit
  ),
  matched as (
    select c.id, c.name, c.one_liner, c.stage, c.batch, c.lists, coalesce(h.n, 0) as n, h.newest, fi.score
    from public.fh_companies c
    left join hiring h on h.company_id = c.id
    left join fit fi on fi.company_id = c.id
    where (not coalesce(p_hiring, true) or h.n > 0)
      and (v_pattern is null or c.name ilike v_pattern escape '\' or c.one_liner ilike v_pattern escape '\')
      and (cardinality(v_stages) = 0 or c.stage = any (v_stages))
      and ((cardinality(v_lists) = 0 and not v_yc) or c.lists && v_lists or (v_yc and c.batch is not null))
  )
  select m.id, m.name, m.one_liner, m.stage, m.batch, m.lists, m.n, m.newest, m.score, count(*) over ()
  from matched m
  order by
    (case when v_fit then m.score end) desc nulls last,
    (case when p_sort = 'roles' then m.n end) desc nulls last,
    m.newest desc nulls last, m.id
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
  offset least(greatest(coalesce(p_offset, 0), 0), 10000);
end $$;

revoke all on function public.fh_public_stats() from public, anon, authenticated, service_role;
revoke all on function public.fh_public_roles(text[], text[], integer, text, text, integer, integer) from public, anon, authenticated, service_role;
revoke all on function public.fh_public_company(bigint, bigint) from public, anon, authenticated, service_role;
revoke all on function public.fh_companies_list(text, text[], text[], boolean, text, integer, integer) from public, anon, authenticated, service_role;
grant execute on function public.fh_public_stats() to anon, authenticated;
grant execute on function public.fh_public_roles(text[], text[], integer, text, text, integer, integer) to anon, authenticated;
grant execute on function public.fh_public_company(bigint, bigint) to anon, authenticated;
grant execute on function public.fh_companies_list(text, text[], text[], boolean, text, integer, integer) to anon, authenticated;
