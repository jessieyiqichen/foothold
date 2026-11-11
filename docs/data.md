# Data (Foothold)

One Supabase project, shared with Assignments 4 and 5. Foothold's tables start with `fh_`; the earlier tables are not touched. Migrations: `supabase/migrations/*foothold*`.

## Tables

| Table | One row is | Key columns | Written by |
|---|---|---|---|
| `fh_companies` | A company on one list | `source` (yc, hn, vc) + `source_id`; `domain` (for merging the same company across lists); `one_liner`, `tags`, `team_size`, `is_hiring`; `lists` (the VC boards naming it); `ats`, `ats_slug`, `ats_jobs`, `ats_checked_at` once its job board has been looked for | Workers only |
| `fh_postings` | A posting | `source` (hn: a "Who is hiring" comment; ats: a role on the company's own board) + `source_id`; `company_id`; `title`, `location`, `text` (cut at 6,000 characters for ats); `url`; `emails`, `author` (hn) | Workers only |
| `fh_runs` | A worker run | `source`, `ok`, `rows_written`, `error` | Workers only |

`fh_postings.tags` holds a posting's skill tags and `tags_version` the vocabulary version they came from (see Matching below).

Row-level security is on for all three. Signed-in people read companies and postings; nobody but the workers (the secret key) writes; `fh_runs` is not readable from the app. Per-person tables (profiles, cards, messages) are not built yet and will be each person's own.

## Workers

| Function | Call | Does |
|---|---|---|
| `fh-scout` | `{"source":"yc"}` weekly, `{"source":"hn"}` daily (Cron) | Reads the YC directory JSON (active companies only) or the newest HN "Who is hiring" thread; upserts on `(source, source_id)`; links HN postings to YC companies of the same name |
| `fh-jobs` | `{"task":"vc","board":"accel"}` | Reads one VC board's company list (Getro) into `fh_companies`, one row per domain |
| `fh-jobs` | `{"task":"ats","limit":25}` | Claims the next unchecked companies (hiring ones first), tries each one's likely board names on Ashby, Greenhouse and Lever, writes the roles found. At most 300 roles a company |
| `fh-jobs` | `{"task":"tag","limit":300}` | Tags the next postings whose tags are older than the current vocabulary. `scripts/run-jobs.sh tag` runs it until none is left |

## Matching a person to postings

A posting is matched on skill tags, not on its full text. The vocabulary is `supabase/functions/fh-jobs/lib/skills.ts`: about 170 rows of group, tag and pattern. `tagsOf(title, text)` in `lib/tags.ts` tags a posting and, later, a resume with the same function, so both sides use the same words. To change the vocabulary: edit a row, raise `SKILLS_VERSION`, redeploy, run `scripts/run-jobs.sh tag`.

Why tags (measured 2026-11-10): full-text search of the descriptions matched 2,828 of 3,000 sampled postings for a seven-word query and took 5.9 seconds on those 3,000, because every match has to be re-analysed to be ranked; storing the analysis would need about 170 MB. Searching tags for twelve skills over all 36,551 postings took 101 ms, and the index is 4.4 MB.

Version 2 (2026-11-10) fixed version 1's worst fault, tags firing on benefits and legal boilerplate: tagging stops at the first benefits, perks or equal-opportunity heading (`jobPart`), and eight patterns were narrowed. Counted over all 36,551 postings:

| Tag | Version 1 | Version 2 |
|---|---|---|
| healthcare | 14,107 | 6,184 |
| insurance | 9,756 | 584 |
| finance | 10,702 | 5,762 |
| legal | 9,143 | 1,700 |
| recruiting | 8,274 | 3,205 |
| education | 5,420 | 421 |
| operations | 14,205 | 3,594 |
| compliance | 9,606 | 9,217 |
| experimentation | 1,933 | 2,279 |

Still doubtful, not yet checked by reading samples: `compliance` (9,217, a quarter of all postings) and `healthcare` (6,184); benefits written without a heading are not cut. 304 postings have no tag at all. The user has not reviewed the vocabulary yet.

## Sources

| Source | Access | robots.txt |
|---|---|---|
| YC directory | `yc-oss.github.io/api/companies/all.json` (community JSON) | Not applicable |
| Hacker News "Who is hiring" | HN Algolia API | Public API |
| Getro boards (Accel, General Catalyst, Khosla, Thrive, Lux, Insight, 8VC, Menlo, Notable) | `api.getro.com` company search, company lists only | Allowed |
| Ashby, Greenhouse, Lever | Each system's public job board endpoint, no key | Public API |
| Consider boards (Sequoia and eight more), a16z | Mapped by a read-only subagent on 2026-11-10; not imported, waiting for the user's decision | Allowed; Consider needs a browser session and a CSRF token |
| Greylock | Not used | Names Claude: forbidden |
| LinkedIn, Wellfound, Fast AI Jobs | Never | By design |

## Rules for sources

- LinkedIn, Wellfound and Fast AI Jobs are never crawled. A card links out instead.
- A site whose robots.txt forbids us is skipped, with no route to its data through another site.
- A VC job board gives the company list only. Roles come from each company's own board.
- Foothold never sends a message for the user. It names the person and the reason; the user writes and sends.

Adding a source goes through the `add-source` skill.

## Measured (2026-11-10, read from the database after the import finished)

| What | Number |
|---|---|
| Postings | 36,551: 36,345 from company job boards, 206 from the HN November thread |
| Companies | 7,144: 4,413 active YC companies and 2,731 from the nine Getro boards after merging by domain |
| Companies checked for a job board | 6,941. The other 203 are VC-list rows whose domain YC also lists; the YC row was checked instead |
| Companies with a board found, guessing its name | 1,664 (24% of those checked; 38% among the first 975, which were the ones marked as hiring) |
| Database size | 228 MB of the free tier's 500 MB, after adding tags |

Known gaps:
- 14 companies were cut off at 300 roles (counted when 5,820 companies had been checked).
- One company's roles were refused by the database ("invalid input syntax for type json"). The cause, half an emoji left by cutting the text at 6,000 characters, is fixed and tested in `lib/parse.ts`; that company's roles are still missing until it is checked again.
- The roles include large companies from the VC lists and roles outside the US. The count says nothing yet about how many suit a new grad; the Judge will.

Row counts change with every run; read them from the database, not from this file.
