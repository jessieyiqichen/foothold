-- Three more hiring systems whose public job boards the jobs worker reads: Workable, Rippling and Gem.
-- Only the allowed values of fh_companies.ats grow. Row-level security and who may write are unchanged.
alter table public.fh_companies drop constraint fh_companies_ats_check;
alter table public.fh_companies add constraint fh_companies_ats_check
  check (ats in ('ashby', 'greenhouse', 'lever', 'workable', 'rippling', 'gem'));
