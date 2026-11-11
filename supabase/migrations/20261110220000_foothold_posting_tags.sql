-- Skill tags on postings: what a posting is matched on (supabase/functions/fh-jobs/lib/skills.ts). Searching the
-- tags replaces full-text search of the description, which matched nearly every posting and took about 6 seconds
-- on 3,000 rows (measured 2026-11-10). tags_version says which vocabulary a row was tagged with; the worker re-tags
-- rows below the current version.
alter table public.fh_postings
  add column tags text[] not null default '{}',
  add column tags_version smallint not null default 0;
create index fh_postings_tags on public.fh_postings using gin (tags);
create index fh_postings_untagged on public.fh_postings (id) where tags_version = 0;

alter table public.fh_runs drop constraint fh_runs_source_check;
alter table public.fh_runs add constraint fh_runs_source_check check (source in ('yc', 'hn', 'vc', 'ats', 'tag'));

-- Writes the tags the worker worked out for a batch of postings. Only the worker calls it.
create or replace function public.fh_set_tags(version integer, rows jsonb)
returns integer language sql security definer set search_path = public as $$
  with upd as (
    update public.fh_postings p
    set tags = coalesce(array(select jsonb_array_elements_text(r->'tags')), '{}'), tags_version = version
    from jsonb_array_elements(rows) r
    where p.id = (r->>'id')::bigint
    returning 1
  )
  select count(*)::integer from upd;
$$;
revoke all on function public.fh_set_tags(integer, jsonb) from public, anon, authenticated;
grant execute on function public.fh_set_tags(integer, jsonb) to service_role;
