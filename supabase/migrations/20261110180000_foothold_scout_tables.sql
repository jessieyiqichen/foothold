-- Foothold (final project): the Scout's tables. Nudge (A4) and Builder's Board (A5) tables are not touched.
-- Companies and postings are the same for everyone: signed-in people read them, only the Scout worker writes them
-- (with the secret key, which bypasses RLS, so there are no write policies). Per-person tables come in later migrations.

-- fh_companies: one row per company per list it was read from (YC directory now; a HN post names a company too).
-- The same company on two lists is merged later by domain or name; both rows stay.
create table public.fh_companies (
  id bigint generated always as identity primary key,
  source text not null check (source in ('yc', 'hn')),
  source_id text not null check (char_length(source_id) between 1 and 200),
  name text not null check (char_length(name) between 1 and 200),
  slug text check (char_length(slug) <= 200),
  website text check (website ~* '^https?://' and char_length(website) <= 2000),
  domain text check (char_length(domain) <= 200),          -- host without www, for merging
  one_liner text check (char_length(one_liner) <= 1000),
  description text check (char_length(description) <= 20000),
  tags text[] not null default '{}',
  industries text[] not null default '{}',
  locations text[] not null default '{}',
  team_size integer check (team_size >= 0),
  batch text check (char_length(batch) <= 20),
  stage text check (char_length(stage) <= 40),
  status text check (char_length(status) <= 20),
  is_hiring boolean not null default false,
  source_url text check (source_url ~* '^https?://' and char_length(source_url) <= 2000),
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);
create index fh_companies_domain on public.fh_companies (domain);
create index fh_companies_name_lower on public.fh_companies (lower(name));
create index fh_companies_hiring on public.fh_companies (is_hiring) where is_hiring;

-- fh_postings: one job posting. A "Who is hiring" comment is one posting even when it lists several roles.
create table public.fh_postings (
  id bigint generated always as identity primary key,
  source text not null check (source in ('hn', 'yc', 'ats')),
  source_id text not null check (char_length(source_id) between 1 and 200),
  company_id bigint references public.fh_companies (id) on delete set null,
  company_name text not null check (char_length(company_name) between 1 and 200),
  title text check (char_length(title) <= 300),
  location text check (char_length(location) <= 300),
  text text not null check (char_length(text) between 1 and 20000),
  url text not null check (url ~* '^https://' and char_length(url) <= 2000),
  links text[] not null default '{}',
  emails text[] not null default '{}',
  author text check (char_length(author) <= 100),
  thread_id text check (char_length(thread_id) <= 50),
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);
create index fh_postings_company on public.fh_postings (company_id);
create index fh_postings_name_lower on public.fh_postings (lower(company_name));
create index fh_postings_posted on public.fh_postings (posted_at desc);

-- fh_runs: one row per Scout run (the page's freshness line, and where failures are read).
create table public.fh_runs (
  id bigint generated always as identity primary key,
  source text not null check (source in ('yc', 'hn')),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  ok boolean not null,
  rows_written integer not null default 0 check (rows_written >= 0),
  error text check (char_length(error) <= 500)
);

-- Links a HN posting to the YC company of the same name (exact, case-insensitive). Only the worker calls it.
create or replace function public.fh_link_postings()
returns integer
language sql
security definer
set search_path = public
as $$
  with linked as (
    update public.fh_postings p
    set company_id = c.id
    from public.fh_companies c
    where p.company_id is null
      and c.source = 'yc'
      and lower(p.company_name) = lower(c.name)
    returning p.id
  )
  select count(*)::integer from linked;
$$;
revoke all on function public.fh_link_postings() from public, anon, authenticated;
grant execute on function public.fh_link_postings() to service_role;

-- Reading: signed-in people see every company and posting; nobody but the worker sees runs.
alter table public.fh_companies enable row level security;
alter table public.fh_postings enable row level security;
alter table public.fh_runs enable row level security;
create policy "signed-in read companies" on public.fh_companies for select to authenticated using (true);
create policy "signed-in read postings" on public.fh_postings for select to authenticated using (true);
revoke all on table public.fh_companies, public.fh_postings, public.fh_runs from anon, authenticated;
grant select on table public.fh_companies, public.fh_postings to authenticated;
grant select, insert, update, delete on table public.fh_companies, public.fh_postings, public.fh_runs to service_role;
grant usage, select on all sequences in schema public to service_role;
