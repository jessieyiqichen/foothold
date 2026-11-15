-- Supabase Cron runs the jobs worker's refresh task once a day (user, 2026-11-14: boards are re-checked daily and
-- roles that disappear are marked closed). fh_claim_refresh hands out at most 25 companies in any 2 minutes, whoever
-- calls, so the schedule calls every minute from 08:00 to 10:59 UTC: a call that comes while the last 2 minutes'
-- 25 are still counted claims nothing, returns at once and writes no run row, and the next one takes the next 25.
-- That is room for about 2,250 boards in the three hours; 1,664 companies had a board when last counted
-- (2026-11-10, docs/data.md). Companies checked in the last 20 hours are not handed out, so the calls left over once
-- every board is done claim nothing either. The URL is the project's public address, not a secret: a call only
-- re-reads public job boards (the same reasoning as fh-scout's schedule).
--
-- NOT APPLIED. Apply after 20261114120000_foothold_company_cards.sql and after fh-jobs is deployed with the task.
select cron.schedule(
  'fh-jobs-refresh-daily',
  '* 8-10 * * *',
  $$
  select net.http_post(
    url := 'https://huhlnktlxocphsejyjpm.supabase.co/functions/v1/fh-jobs',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"task":"refresh","limit":25}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
