-- fh_claim_refresh's rate cap counted every company stamped in the last 2 minutes, including the rows the
-- hn-companies task stamps when it creates them and the companies the ats task claims, so right after hn-companies
-- (50 rows on 2026-11-14) a refresh claimed nothing. The cap now counts only rows the refresh itself would claim:
-- a board (ats and ats_slug set) on a company not made from an HN post. Everything else is as in
-- 20261114120000_foothold_company_cards.sql: at most 25 in any 2 minutes, at most 5 Workable a claim, companies
-- checked in the last 20 hours are not due.
-- One gap stays: a company the ats task finds a board for in the last 2 minutes now has ats set and counts, though
-- the refresh did not claim it. That only makes a refresh call wait at most 2 minutes more.
--
-- Applied by the lead on 2026-11-15.
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
        where x.ats is not null and x.ats_slug is not null and x.source <> 'hn'
          and (x.ats_checked_at is null or x.ats_checked_at < now() - interval '20 hours')
        order by x.ats_checked_at nulls first, x.id
        limit 100
        for update skip locked
      ) d
    ) e
    where e.ats <> 'workable' or e.k <= 5
    order by e.ats_checked_at nulls first, e.id
    limit greatest(0, least(greatest(n, 1), 25) - (
      select count(*) from public.fh_companies r
      where r.ats_checked_at > now() - interval '2 minutes'
        and r.ats is not null and r.ats_slug is not null and r.source <> 'hn'
    ))
  )
  returning c.id, c.name, c.ats, c.ats_slug;
$$;
revoke all on function public.fh_claim_refresh(integer) from public, anon, authenticated;
grant execute on function public.fh_claim_refresh(integer) to service_role;
