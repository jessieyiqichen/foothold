-- fh_profiles: a person can correct their own skill tags (user, 2026-11-11: the first real resume got a wrong tag,
-- and the page gave no way to see or add what was missing).
--
-- NOT APPLIED. Touches user data: goes to `reviewer`, then the lead applies it.
--
-- tags_added holds the vocabulary tags the person put on their profile, tags_removed the ones they took off. `tags`
-- stays what roles are matched on: found in the resume text, plus tags_added, minus tags_removed, still at most
-- MAX_TAGS (60, checked by the first migration). The page computes it (src/lib/profile/tagEdits.ts); the database
-- only stores the three lists. Keeping the two lists is what lets a correction survive a replaced resume.
--
-- The 200 is MAX_TAG_EDITS in src/lib/profile/constants.ts: above the size of the vocabulary, so it only stops a row
-- that did not come from the page. Change both together.
--
-- No policy or grant changes: the four "own profile" policies and the table's grants already cover every column.
-- Rows saved before this migration get two empty lists.
alter table public.fh_profiles
  add column tags_added text[] not null default '{}' check (cardinality(tags_added) <= 200),
  add column tags_removed text[] not null default '{}' check (cardinality(tags_removed) <= 200);
