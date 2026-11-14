-- Supabase Cron runs the jobs worker's refresh task once a day (user, 2026-11-14: boards are re-checked daily and
-- roles that disappear are marked closed). One call re-reads 25 boards; 1,664 companies had a board on 2026-11-14,
-- so a call every 2 minutes from 08:00 to 10:58 UTC (90 calls, room for 2,250) covers them with space to grow.
-- fh_claim_refresh hands out only companies not checked in the last 20 hours, so the calls left over once every board
-- is done claim nothing and return at once. The URL is the project's public address, not a secret: a call only
-- re-reads public job boards (the same reasoning as fh-scout's schedule).
--
-- NOT APPLIED. Apply after 20261114120000_foothold_company_cards.sql and after fh-jobs is deployed with the task.
select cron.schedule(
  'fh-jobs-refresh-daily',
  '*/2 8-10 * * *',
  $$
  select net.http_post(
    url := 'https://huhlnktlxocphsejyjpm.supabase.co/functions/v1/fh-jobs',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"task":"refresh","limit":25}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
