-- Foothold: a role's posting text for signed-out visitors (user, 2026-11-24: "未登录也要能看到 what they ask for").
-- The role page shows "What they ask for" (up to three asks, read by rules in the browser) and the full posting on
-- demand. Signed-in people read fh_postings directly; signed-out visitors (anon) could not, by the rule in
-- 20261122100000_foothold_public_browse.sql ("never a posting's text"). This file changes that rule for one posting at
-- a time: the text and place of an open role that has a company page, which is what the company already published on
-- its job board. Still never emails, author, links, thread or tags, never fh_people, never anyone's profile.
-- Hacker News posts are left out (review, 2026-11-24): they are free text written by a person, often naming
-- themselves and giving contact details in forms the email strip misses ("jane [at] acme dot com", phone numbers).
-- Their page keeps the link to the original comment.
--
-- Security definer, so anon can read it past row-level security; it names every column it returns. One posting per
-- call, by id. Any email address is taken out of the text and the place, as fh_public_company does for titles. The text
-- is cut to 30,000 characters. Anyone with the publishable key can loop over ids and read every open board posting's
-- text; accepted (review, 2026-11-24): it is what the companies publish themselves, and fh_public_company lists the ids.
-- Reviewed 2026-11-24 (HN left out after it); applied 2026-11-24 on the user's word (log.md).

create function public.fh_public_posting(p_role bigint)
returns table (text text, location text)
language sql stable security definer set search_path = '' as $$
  select left(regexp_replace(coalesce(p.text, ''), '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g'), 30000),
         regexp_replace(p.location, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g')
  from public.fh_postings p
  where p.id = p_role
    and p.closed_at is null
    and p.company_id is not null
    and p.source <> 'hn';
$$;

revoke all on function public.fh_public_posting(bigint) from public, anon, authenticated, service_role;
grant execute on function public.fh_public_posting(bigint) to anon, authenticated;
