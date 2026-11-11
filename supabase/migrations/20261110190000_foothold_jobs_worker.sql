-- The jobs worker: companies from VC job boards join fh_companies (source 'vc', one row per domain, the boards that
-- list it in `lists`), and each company remembers which public job board it was found on.
alter table public.fh_companies drop constraint fh_companies_source_check;
alter table public.fh_companies add constraint fh_companies_source_check check (source in ('yc', 'hn', 'vc'));
alter table public.fh_companies
  add column lists text[] not null default '{}',
  add column ats text check (ats in ('ashby', 'greenhouse', 'lever')),
  add column ats_slug text check (char_length(ats_slug) <= 200),
  add column ats_jobs integer not null default 0 check (ats_jobs >= 0),
  add column ats_checked_at timestamptz;
create index fh_companies_unchecked on public.fh_companies (is_hiring desc, id) where ats_checked_at is null;

alter table public.fh_runs drop constraint fh_runs_source_check;
alter table public.fh_runs add constraint fh_runs_source_check check (source in ('yc', 'hn', 'vc', 'ats'));

-- Adds one board's companies. A company already there (same domain) only gains the board in `lists`.
create or replace function public.fh_upsert_vc_companies(board text, rows jsonb)
returns integer language sql security definer set search_path = public as $$
  with ins as (
    insert into public.fh_companies (source, source_id, name, domain, website, one_liner, team_size, stage, tags, is_hiring, lists)
    select 'vc', r->>'domain', left(r->>'name', 200), r->>'domain', 'https://' || (r->>'domain'), left(r->>'oneLiner', 1000),
           (r->>'teamSize')::integer, left(r->>'stage', 40),
           coalesce(array(select jsonb_array_elements_text(r->'tags')), '{}'), coalesce((r->>'isHiring')::boolean, false), array[board]
    from jsonb_array_elements(rows) r
    on conflict (source, source_id) do update
      set lists = array(select distinct unnest(public.fh_companies.lists || excluded.lists)),
          is_hiring = public.fh_companies.is_hiring or excluded.is_hiring,
          updated_at = now()
    returning 1
  )
  select count(*)::integer from ins;
$$;

-- Hands the worker the next companies whose job board has not been looked for, hiring ones first, and stamps them
-- so the next call gets different ones. A VC-list company that YC also lists (same domain) is left to its YC row.
create or replace function public.fh_claim_companies(n integer)
returns table (id bigint, name text, slug text, domain text)
language sql security definer set search_path = public as $$
  update public.fh_companies c
  set ats_checked_at = now()
  where c.id in (
    select x.id from public.fh_companies x
    where x.ats_checked_at is null
      and not (x.source = 'vc' and exists (select 1 from public.fh_companies y where y.source = 'yc' and y.domain = x.domain))
    order by x.is_hiring desc, x.id
    limit least(greatest(n, 1), 50)
    for update skip locked
  )
  returning c.id, c.name, c.slug, c.domain;
$$;

revoke all on function public.fh_upsert_vc_companies(text, jsonb), public.fh_claim_companies(integer) from public, anon, authenticated;
grant execute on function public.fh_upsert_vc_companies(text, jsonb), public.fh_claim_companies(integer) to service_role;
