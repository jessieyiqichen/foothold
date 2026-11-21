-- Foothold: one page per company (user, 2026-11-21). Today, All roles and Saved all lead to it; saving and writing
-- happen there. The v1 test showed the card too long and All roles leading nowhere (docs/v1-user-tests.md).
--
-- fh_company: one company as the caller sees it, by the company's id or by one of its postings' ids (All roles links
-- a role to its company's page this way, with that role chosen). Same columns as fh_saved, and:
--   roles: every open role at the company posted in the last 180 days (an HN post with no date kept, and the asked
--          role whatever its age), one per title, up to 30, each with the skills it shares. Where a title has several
--          postings, the asked role and then the best role stand for it, so both are always listed (review,
--          2026-11-21). Order: the best role first, then the most skills shared, then newest.
--   best_role: the role fh_company_fit puts first (the card's best match), or null when none fits the caller.
--   decision, decided_at: the caller's own decision on the company, or null.
-- No such company, or a posting with no company: no row. security invoker: fh_companies and fh_postings are readable
-- by every signed-in person; fh_decisions and fh_profiles are read through their own-row policies, and the explicit
-- user filter keeps the answer to the caller even so. Nothing is written.

create function public.fh_company(p_company bigint default null, p_role bigint default null)
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
           coalesce(lower(btrim(p.title)), 'id:' || p.id::text) as title_key
    from public.fh_postings p
    cross join my_tags mt
    where p.company_id = (select t.id from target t)
      and p.closed_at is null
      and (p.posted_at >= now() - interval '180 days' or (p.posted_at is null and p.source = 'hn') or p.id = p_role)
  ),
  one_per_title as (
    select distinct on (o.title_key) o.*
    from open_roles o
    order by o.title_key, (o.id = p_role) desc, (o.id = (select b.id from best b)) desc,
             cardinality(o.shared) desc, o.posted_at desc nulls last, o.id
  ),
  shown as (
    select o.* from one_per_title o
    order by (o.id = p_role) desc, (o.id = (select b.id from best b)) desc,
             cardinality(o.shared) desc, o.posted_at desc nulls last, o.id
    limit 30
  )
  select c.id, c.name, c.one_liner, c.website, c.team_size, c.batch, c.stage, c.lists,
         f.last_posted_at, coalesce(f.recent_roles, 0), coalesce(f.shared, '{}'), coalesce(f.score, 0),
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'id', s.id, 'title', s.title, 'url', s.url, 'posted_at', s.posted_at,
                    'family', s.family, 'level', s.level, 'shared', to_jsonb(s.shared)
                  ) order by (s.id = (select b.id from best b)) desc, cardinality(s.shared) desc, s.posted_at desc nulls last, s.id)
           from shown s), '[]'::jsonb),
         (select b.id from best b),
         public.fh_company_person(c.id), d.decision, d.decided_at, public.fh_founders_url(c.source, c.source_url, c.slug)
  from public.fh_companies c
  left join fit f on f.company_id = c.id
  left join public.fh_decisions d on d.company_id = c.id and d.user_id = (select m.user_id from me m)
  where c.id = (select t.id from target t);
$$;
revoke all on function public.fh_company(bigint, bigint) from public, anon, authenticated, service_role;
grant execute on function public.fh_company(bigint, bigint) to authenticated;
