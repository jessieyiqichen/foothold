# Data (Foothold)

One Supabase project, shared with Assignments 4 and 5. Foothold's tables start with `fh_`; the earlier tables are not touched. Migrations: `supabase/migrations/*foothold*`.

## Tables

| Table | One row is | Key columns | Written by |
|---|---|---|---|
| `fh_companies` | A company on one list | `source` (yc, hn, vc) + `source_id`; `domain` (for merging the same company across lists); `one_liner`, `tags`, `team_size`, `is_hiring`; `lists` (the VC boards naming it); `ats`, `ats_slug`, `ats_jobs`, `ats_checked_at` once its job board has been looked for | Workers only |
| `fh_postings` | A posting | `source` (hn: a "Who is hiring" comment; ats: a role on the company's own board) + `source_id`; `company_id`; `title`, `location`, `text` (cut at 6,000 characters for ats); `url`; `emails`, `author` (hn) | Workers only |
| `fh_runs` | A worker run | `source`, `ok`, `rows_written`, `error` | Workers only |

Row-level security is on for all three. Signed-in people read companies and postings; nobody but the workers (the secret key) writes; `fh_runs` is not readable from the app. Per-person tables (profiles, cards, messages) are not built yet and will be each person's own.

## Workers

| Function | Call | Does |
|---|---|---|
| `fh-scout` | `{"source":"yc"}` weekly, `{"source":"hn"}` daily (Cron) | Reads the YC directory JSON (active companies only) or the newest HN "Who is hiring" thread; upserts on `(source, source_id)`; links HN postings to YC companies of the same name |
| `fh-jobs` | `{"task":"vc","board":"accel"}` | Reads one VC board's company list (Getro) into `fh_companies`, one row per domain |
| `fh-jobs` | `{"task":"ats","limit":25}` | Claims the next unchecked companies (hiring ones first), tries each one's likely board names on Ashby, Greenhouse and Lever, writes the roles found. At most 300 roles a company |

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

## Measured (2026-11-10, read from the database while the last batches were still running)

| What | Number |
|---|---|
| Postings | 35,757: 35,551 from company job boards, 206 from the HN November thread |
| Companies | 7,144: 4,413 active YC companies and 2,731 from the nine Getro boards after merging by domain |
| Companies checked for a job board | 5,820 of 7,144 |
| Companies with a board found, guessing its name | 1,589: Ashby 987 (18,324 roles), Greenhouse 460 (15,745), Lever 142 (3,464) |
| Companies cut off at 300 roles | 14 |
| Database size | 208 MB of the free tier's 500 MB; `fh_postings` is 139 MB |

Known gaps:
- One company's roles were refused by the database ("invalid input syntax for type json", most likely a character Postgres does not accept in JSON). Its roles are missing and the parser does not yet strip such characters.
- The roles include large companies from the VC lists and roles outside the US. The count says nothing yet about how many suit a new grad; the Judge will.

Row counts change with every run; read them from the database, not from this file.
