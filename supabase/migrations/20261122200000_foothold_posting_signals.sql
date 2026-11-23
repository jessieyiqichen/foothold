-- Foothold: the Judge's signals, part 1 of 3: the table and the worker's two functions (docs/judge-signals.md).
-- Five signals read from fh_postings.text (years of experience, salary, visa, equity, 401(k)), each stored with the
-- sentence it comes from, copied character for character, 1 to 400 characters. Decided by the user on 2026-11-22,
-- one question at a time (log.md). Parts 2 and 3 (20261122200100_foothold_signals_reads.sql,
-- 20261122200200_foothold_signals_companies.sql) change the functions the pages read; apply the three in order. Three
-- files rather than one only to keep each under 400 lines.
--
-- Applied 2026-11-22 (log.md). It creates a table with row-level security and two service-role-only definer functions, so it
-- goes to `reviewer` before the lead applies it. No policy or grant on any existing table changes.
--
-- The values repeated here and in supabase/functions/fh-signals/lib/ (the visa ids, the salary bounds, the quote and
-- years limits, the 3-year threshold) are checked against each other by lib/migration.test.ts. Change them together.

-- 1. The worker's run rows --------------------------------------------------------------------------------------------

alter table public.fh_runs drop constraint fh_runs_source_check;
alter table public.fh_runs add constraint fh_runs_source_check
  check (source in ('yc', 'hn', 'vc', 'ats', 'tag', 'roles', 'refresh', 'people', 'hn-companies', 'signals', 'signals-model'));

-- 2. The table ---------------------------------------------------------------------------------------------------------

-- One row a posting, deleted with it. A value without its quote, or a quote without its value, is refused here, so
-- nothing can be stored unquoted whatever the worker sends. equity and k401 are true or absent, never false.
-- text_md5: md5 of the text the row was read from; checked_at: when that was last compared with the posting's text
-- (fh-jobs bumps fh_postings.updated_at on every refresh, so the hash decides whether the text really changed).
-- pending: sentences the rules could not settle, waiting for the model ([{kind, sentence, value?}], value = years).
-- model_tries: failed model requests for this row since it was last written; at 3, fh_signals_model_failed clears
-- pending and the rules' values stand (review, 2026-11-22: a batch whose reply always fails must not block the queue).
create table public.fh_posting_signals (
  posting_id bigint primary key references public.fh_postings (id) on delete cascade,
  version integer not null check (version >= 1),
  text_md5 text not null check (text_md5 ~ '^[0-9a-f]{32}$'),
  years_min integer check (years_min between 0 and 40),
  years_required boolean,
  years_quote text check (char_length(years_quote) between 1 and 400),
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  salary_currency text check (salary_currency ~ '^[A-Z]{3}$'),
  salary_period text check (salary_period in ('year', 'hour')),
  salary_ote boolean,
  salary_quote text check (char_length(salary_quote) between 1 and 400),
  visa text check (visa in ('sponsors', 'no_sponsorship', 'citizens_only')),
  visa_quote text check (char_length(visa_quote) between 1 and 400),
  equity boolean check (equity),
  equity_quote text check (char_length(equity_quote) between 1 and 400),
  k401 boolean check (k401),
  k401_quote text check (char_length(k401_quote) between 1 and 400),
  pending jsonb check (pending is null or (jsonb_typeof(pending) = 'array' and jsonb_array_length(pending) between 1 and 20)),
  settled_by text not null check (settled_by = 'rules' or settled_by ~ '^gemini-[a-z0-9.-]{1,60}$'),
  extracted_at timestamptz not null default now(),
  checked_at timestamptz not null default now(),
  model_tries smallint not null default 0 check (model_tries between 0 and 3),
  constraint fh_posting_signals_years_quoted check (
    (years_min is null) = (years_quote is null) and (years_min is null) = (years_required is null)),
  constraint fh_posting_signals_salary_quoted check (
    (salary_min is null) = (salary_quote is null) and (salary_min is null) = (salary_currency is null)
    and (salary_min is null) = (salary_period is null) and (salary_min is null) = (salary_ote is null)
    and (salary_min is not null or salary_max is null)),
  constraint fh_posting_signals_salary_bounds check (
    salary_min is null
    or (salary_period = 'year' and salary_min between 15000 and 1000000 and (salary_max is null or salary_max between salary_min and 1000000))
    or (salary_period = 'hour' and salary_min between 10 and 500 and (salary_max is null or salary_max between salary_min and 500))),
  constraint fh_posting_signals_visa_quoted check ((visa is null) = (visa_quote is null)),
  constraint fh_posting_signals_equity_quoted check ((equity is null) = (equity_quote is null)),
  constraint fh_posting_signals_k401_quoted check ((k401 is null) = (k401_quote is null))
);

-- The model task reads the rows still waiting for it. The rules task's claim walks fh_postings and this table by their
-- primary keys, in id order, and needs no other index.
create index fh_posting_signals_pending on public.fh_posting_signals (posting_id) where pending is not null;

-- Signed-in people read it, as they read postings. anon reads nothing directly: signed-out visitors see signals only
-- through the public definer functions of parts 2 and 3, with emails taken out of the quotes. Only the worker writes.
alter table public.fh_posting_signals enable row level security;
create policy "signed-in read posting signals" on public.fh_posting_signals for select to authenticated using (true);
revoke all on table public.fh_posting_signals from public, anon, authenticated;
grant select on table public.fh_posting_signals to authenticated;
grant select, insert, update, delete on table public.fh_posting_signals to service_role;

-- 3. The rules task's claim ------------------------------------------------------------------------------------------

-- The next n (1..500) open postings, in id order, that have no row, a row from an older version, or a posting updated
-- since its row was last compared. For each: its id, the md5 of its text, and its text; text is null when the md5 is
-- the stored one and the version is current. Those unchanged rows are stamped checked here, so they are not handed
-- out again until the posting is updated again; their text is never sent and never re-read. Fewer rows than n means
-- none are left. Only the worker calls it.
create function public.fh_claim_signals(n integer, p_version integer)
returns table (posting_id bigint, text_md5 text, text text)
language sql volatile security definer set search_path = '' as $$
  with due as (
    select p.id, p.text, s.text_md5 as stored_md5, coalesce(s.version = p_version, false) as same_version
    from public.fh_postings p
    left join public.fh_posting_signals s on s.posting_id = p.id
    where p.closed_at is null
      and (s.posting_id is null or s.version < p_version or p.updated_at > s.checked_at)
    order by p.id
    limit least(greatest(coalesce(n, 1), 1), 500)
  ),
  hashed as (
    select d.id, d.text, md5(d.text) as md5, d.same_version and d.stored_md5 = md5(d.text) as unchanged
    from due d
  ),
  stamped as (
    update public.fh_posting_signals s set checked_at = now()
    from hashed h
    where s.posting_id = h.id and h.unchanged
    returning s.posting_id
  )
  select h.id, h.md5, case when h.unchanged then null else h.text end
  from hashed h
  order by h.id;
$$;
revoke all on function public.fh_claim_signals(integer, integer) from public, anon, authenticated;
grant execute on function public.fh_claim_signals(integer, integer) to service_role;

-- 4. The write -------------------------------------------------------------------------------------------------------

-- Writes the worker's rows (at most 500) and returns how many were written with their values. A row is:
--   skipped when its posting is gone, or its text no longer has the md5 the row was read from (it changed since the
--     claim: the next claim hands it out again with the new md5), or the stored row comes from a newer version;
--   written EMPTY (no values, no pending, checked now) when any quote or pending sentence is not a substring of the
--     posting's current text (so no quote can be made up), or a pending entry is not {kind: 'years', sentence,
--     value: 0..40} or {kind: 'visa', sentence}. Writing it empty, rather than skipping it, is what moves it out of
--     the claim's queue (review, 2026-11-22): a row skipped for good would come back at the head of every claim and
--     the rules task would never reach done.
-- Returns {"written": rows written with their values, "emptied": rows written empty, "skipped": rows not written}.
-- Every write sets model_tries back to 0.
-- Anything else the table's checks refuse fails the whole call, which the worker reports. Only the worker calls it.
create function public.fh_set_signals(version integer, rows jsonb)
returns jsonb
language sql volatile security definer set search_path = '' as $$
  with input as (
    select distinct on (r.posting_id) r.*
    from jsonb_to_recordset(case when jsonb_typeof(rows) = 'array' and jsonb_array_length(rows) <= 500 then rows else '[]'::jsonb end) as r(
      posting_id bigint, text_md5 text, years_min integer, years_required boolean, years_quote text,
      salary_min numeric, salary_max numeric, salary_currency text, salary_period text, salary_ote boolean, salary_quote text,
      visa text, visa_quote text, equity boolean, equity_quote text, k401 boolean, k401_quote text, pending jsonb, settled_by text)
    order by r.posting_id
  ),
  checked as (
    select i.*, (
      (i.years_quote is null or strpos(p.text, i.years_quote) > 0)
      and (i.salary_quote is null or strpos(p.text, i.salary_quote) > 0)
      and (i.visa_quote is null or strpos(p.text, i.visa_quote) > 0)
      and (i.equity_quote is null or strpos(p.text, i.equity_quote) > 0)
      and (i.k401_quote is null or strpos(p.text, i.k401_quote) > 0)
      and (i.pending is null or (jsonb_typeof(i.pending) = 'array' and not exists (
        select 1 from jsonb_array_elements(i.pending) e
        where jsonb_typeof(e) is distinct from 'object'
          or jsonb_typeof(e -> 'sentence') is distinct from 'string'
          or e ->> 'kind' is null
          or char_length(e ->> 'sentence') not between 1 and 400
          or strpos(p.text, e ->> 'sentence') = 0
          or not (
            (e ->> 'kind' = 'visa')
            or (e ->> 'kind' = 'years' and case when jsonb_typeof(e -> 'value') = 'number'
                                                then (e ->> 'value')::numeric between 0 and 40 else false end))
      )))
    ) as ok
    from input i
    join public.fh_postings p on p.id = i.posting_id
    where md5(p.text) = i.text_md5
  ),
  written as (
    insert into public.fh_posting_signals as t (
      posting_id, version, text_md5, years_min, years_required, years_quote,
      salary_min, salary_max, salary_currency, salary_period, salary_ote, salary_quote,
      visa, visa_quote, equity, equity_quote, k401, k401_quote, pending, settled_by, extracted_at, checked_at)
    select c.posting_id, fh_set_signals.version, c.text_md5,
           case when c.ok then c.years_min end, case when c.ok then c.years_required end, case when c.ok then c.years_quote end,
           case when c.ok then c.salary_min end, case when c.ok then c.salary_max end, case when c.ok then c.salary_currency end,
           case when c.ok then c.salary_period end, case when c.ok then c.salary_ote end, case when c.ok then c.salary_quote end,
           case when c.ok then c.visa end, case when c.ok then c.visa_quote end,
           case when c.ok then c.equity end, case when c.ok then c.equity_quote end,
           case when c.ok then c.k401 end, case when c.ok then c.k401_quote end,
           case when c.ok then c.pending end, case when c.ok then c.settled_by else 'rules' end, now(), now()
    from checked c
    on conflict (posting_id) do update set
      version = excluded.version, text_md5 = excluded.text_md5,
      years_min = excluded.years_min, years_required = excluded.years_required, years_quote = excluded.years_quote,
      salary_min = excluded.salary_min, salary_max = excluded.salary_max, salary_currency = excluded.salary_currency,
      salary_period = excluded.salary_period, salary_ote = excluded.salary_ote, salary_quote = excluded.salary_quote,
      visa = excluded.visa, visa_quote = excluded.visa_quote, equity = excluded.equity, equity_quote = excluded.equity_quote,
      k401 = excluded.k401, k401_quote = excluded.k401_quote, pending = excluded.pending, settled_by = excluded.settled_by,
      extracted_at = excluded.extracted_at, checked_at = excluded.checked_at, model_tries = 0
    where t.version <= excluded.version
    returning t.posting_id
  )
  select jsonb_build_object(
    'written', count(*) filter (where c.ok),
    'emptied', count(*) filter (where not coalesce(c.ok, false)),
    'skipped', (select count(*) from input) - count(*))
  from written w join checked c on c.posting_id = w.posting_id;
$$;
revoke all on function public.fh_set_signals(integer, jsonb) from public, anon, authenticated;
grant execute on function public.fh_set_signals(integer, jsonb) to service_role;

-- A failed model request for these rows (at most 500 ids): each row still waiting gets one more try counted; a row
-- that reaches 3 has its pending cleared, so the rules' values stand and the model task stops asking. Returns how many
-- rows were given up. Only the worker calls it.
create function public.fh_signals_model_failed(ids bigint[])
returns integer
language sql volatile security definer set search_path = '' as $$
  with bumped as (
    update public.fh_posting_signals s
    set model_tries = least(s.model_tries + 1, 3),
        pending = case when s.model_tries + 1 >= 3 then null else s.pending end
    where s.posting_id = any (ids[1:500]) and s.pending is not null
    returning s.pending is null as gave_up
  )
  select (count(*) filter (where b.gave_up))::integer from bumped b;
$$;
revoke all on function public.fh_signals_model_failed(bigint[]) from public, anon, authenticated;
grant execute on function public.fh_signals_model_failed(bigint[]) to service_role;

-- 5. Helpers for the read functions of parts 2 and 3 -------------------------------------------------------------------------

-- Email addresses taken out of a quote shown to signed-out visitors (review, 2026-11-22), the one place every public
-- quote goes through. Three patterns, each case-insensitive, applied in turn:
--   1. a plain address: jobs@acme.com (the pattern the public functions use for titles);
--   2. "at" in brackets, then a domain with dots or "dot": jane (at) acme.com, jane [at] acme dot com, jane {at} acme(dot)io;
--   3. a bare "at" with a "dot" word ending in a common top-level domain: jane at acme dot com.
-- Text like "meet us at Acme in Boston" or "look at the dot plot" is left alone. lib/migration.test.ts runs these three
-- patterns over those cases (the patterns use no word-boundary escape, so they read the same in JavaScript).
create function public.fh_strip_emails(p text)
returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(regexp_replace(regexp_replace(p,
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'gi'),
    '[A-Za-z0-9._%+-]+\s*[\(\[\{]\s*at\s*[\)\]\}]\s*[A-Za-z0-9-]+(\.[A-Za-z0-9-]+|\s*[\(\[\{]\s*dot\s*[\)\]\}]\s*[A-Za-z0-9-]+|\s+dot\s+[A-Za-z0-9-]+)+', '', 'gi'),
    '[A-Za-z0-9._%+-]+\s+at\s+[A-Za-z0-9-]+((\s+dot\s+|\s*[\(\[\{]\s*dot\s*[\)\]\}]\s*)[A-Za-z0-9-]+)*(\s+dot\s+|\s*[\(\[\{]\s*dot\s*[\)\]\}]\s*)(com|org|net|io|ai|co|dev|edu|gov|app|me|us|uk)(?![A-Za-z0-9])', '', 'gi');
$$;
revoke all on function public.fh_strip_emails(text) from public, anon, authenticated, service_role;
grant execute on function public.fh_strip_emails(text) to authenticated;

-- One posting's signals as the pages read them, keys absent when unknown:
--   {"years":{"min","required","quote"},"salary":{"min","max","currency","period","ote","quote"},
--    "visa":{"value","quote"},"equity":{"quote"},"k401":{"quote"}}
-- p_strip_emails takes email addresses out of the quotes (the public functions) with fh_strip_emails.
-- No row (a posting not read yet) gives {}. Reads only its argument; pending is never returned.
create function public.fh_signals_json(s public.fh_posting_signals, p_strip_emails boolean default false)
returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'years', case when s.years_min is not null then jsonb_build_object(
      'min', s.years_min, 'required', s.years_required, 'quote', q.years) end,
    'salary', case when s.salary_min is not null then jsonb_build_object(
      'min', s.salary_min, 'max', s.salary_max, 'currency', s.salary_currency, 'period', s.salary_period,
      'ote', s.salary_ote, 'quote', q.salary) end,
    'visa', case when s.visa is not null then jsonb_build_object('value', s.visa, 'quote', q.visa) end,
    'equity', case when s.equity then jsonb_build_object('quote', q.equity) end,
    'k401', case when s.k401 then jsonb_build_object('quote', q.k401) end))
  from (
    select case when p_strip_emails then public.fh_strip_emails(s.years_quote) else s.years_quote end as years,
           case when p_strip_emails then public.fh_strip_emails(s.salary_quote) else s.salary_quote end as salary,
           case when p_strip_emails then public.fh_strip_emails(s.visa_quote) else s.visa_quote end as visa,
           case when p_strip_emails then public.fh_strip_emails(s.equity_quote) else s.equity_quote end as equity,
           case when p_strip_emails then public.fh_strip_emails(s.k401_quote) else s.k401_quote end as k401
  ) q;
$$;
revoke all on function public.fh_signals_json(public.fh_posting_signals, boolean) from public, anon, authenticated, service_role;
grant execute on function public.fh_signals_json(public.fh_posting_signals, boolean) to authenticated;

-- The signal filters a page sends, cleaned, in one place, so the list and its counts cannot read them two ways:
--   hide_years: p_hide_years, or p_default when it is null (every caller passes false: null means off).
--   visa: null = no filter; 'sponsors' or 'not_citizens_only'; anything else becomes '(none)', which matches nothing
--     (a wrong id must not silently show everything, as in fh_roles_filter).
--   min_salary: null when not given or not above 0; otherwise kept at 1,000,000 at most (USD a year).
--   equity, k401: true = only roles that offer it; null or false = no filter.
create function public.fh_signals_filter(
  p_hide_years boolean, p_visa text, p_min_salary integer, p_equity boolean, p_k401 boolean, p_default boolean,
  out hide_years boolean, out visa text, out min_salary integer, out equity boolean, out k401 boolean
)
language sql immutable set search_path = '' as $$
  select coalesce(p_hide_years, p_default, false),
         case when nullif(btrim(coalesce(p_visa, '')), '') is null then null
              when p_visa in ('sponsors', 'not_citizens_only') then p_visa else '(none)' end,
         case when p_min_salary is null or p_min_salary <= 0 then null else least(p_min_salary, 1000000) end,
         coalesce(p_equity, false),
         coalesce(p_k401, false);
$$;
revoke all on function public.fh_signals_filter(boolean, text, integer, boolean, boolean, boolean) from public, anon, authenticated, service_role;
grant execute on function public.fh_signals_filter(boolean, text, integer, boolean, boolean, boolean) to authenticated;
