<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Foothold · DBS final project (focus: AI)

Finds startups that fit a student, judges whether they really hire new grads, finds the student's way in, and names one person to contact. Every judgment quotes its source. v1 is due 2026-11-17, v2 at the project fair on 2026-12-01. Proposal: https://dbs-proposal-xi.vercel.app

## Adding or fixing a data source

Always go through the `add-source` skill in `.claude/skills/`. A new site, a new hiring system, a source that returns fewer rows than expected: that is the skill. Never write a fetcher by hand first; if the skill is not loaded, say so and stop.

## Map

| Path | What it is | Read it when |
|---|---|---|
| `docs/ownership.md` | Who owns which files, what only the lead may do, how a hand-back is checked | Before any work, every time |
| `.claude/agents/` | Briefs for `data-scout`, `judge-eval`, `web-ui`, `reviewer` | You are given that role |
| `docs/v1-plan.md` | This week, day by day, and the user's own tasks | Choosing what to do next |
| `docs/data.md` | The `fh_` tables, the workers, the sources and which are off limits | Touching the database, a worker or a source |
| `scripts/run-jobs.sh` | Drives the jobs worker in batches and prints each batch's result | Running an import |
| `evals/new-grad/` | 40 postings and the labeling rule for the Judge | Working on the Judge |
| `log.md` | Requests and decisions, one dated row each | Making or recording a decision |
| `docs/AGENTS-a3-a5.md` | Rules from the assignments this repo grew from | Building a page (its design rules) or changing job-board code (its board notes) |
| `docs/*-a4.md`, `*-a5.md`, `log-a3-a5.md` | Earlier assignments' notes | Never, unless asked about them |

## Never

- Never touch an env file. A hook blocks it; do not look for a way around.
- Never stage with `git add -A`, a directory, or `git commit -a`. A hook blocks it.
- Never apply a migration, deploy or push unless you are the lead and the user said so in this conversation.
- Never request a site before reading its robots.txt. If it forbids us, skip it.
- Never score the Judge against pre-labels. Only the user's labels count.
- Never put a number in the README, the log or a report that you did not measure.

## Ask before deciding

- A new table, page, or way of splitting work: one question at a time, with a recommendation, then wait.
- A source needs more than a plain request (a session, a cookie, a token): say what it takes and ask.
- A fetch drops rows: say how many, show three, and ask whether that is acceptable.
- A change touches RLS or user data: send it to `reviewer` before handing it to the lead.

## Habits

- English everywhere in the repo.
- Decisions go in `log.md`, one dated row, same day.
- Commits: `<type>: <description>`, files staged by name.
