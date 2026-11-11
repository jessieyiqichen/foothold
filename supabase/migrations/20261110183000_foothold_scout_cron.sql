-- Supabase Cron calls the Scout: the HN "Who is hiring" thread grows all month, so daily; the YC list changes with
-- each batch, so weekly. The URL is the project's public address, not a secret: a call only re-reads public lists
-- (the same reasoning as board-worker's schedule).
select cron.schedule(
  'fh-scout-hn-daily',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://huhlnktlxocphsejyjpm.supabase.co/functions/v1/fh-scout',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"source":"hn"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
select cron.schedule(
  'fh-scout-yc-weekly',
  '0 7 * * 1',
  $$
  select net.http_post(
    url := 'https://huhlnktlxocphsejyjpm.supabase.co/functions/v1/fh-scout',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"source":"yc"}'::jsonb,
    timeout_milliseconds := 180000
  );
  $$
);
