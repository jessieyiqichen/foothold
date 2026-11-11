<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Foothold · DBS final project (focus: AI)

For students curious about startups whose background isn't a direct match: an agent finds startups that fit, judges whether they really hire new grads, finds the student's way in, and names one person to contact. Every judgment quotes its source. v1 is due 2026-11-17, v2 at the project fair on 2026-12-01. Proposal: https://dbs-proposal-xi.vercel.app

## Map

| Path | What it is | Read it when |
|---|---|---|
| `docs/ownership.md` | Who owns which files, what only the lead may do, how a hand-back is checked | Before any work, every time |
| `.claude/agents/` | Briefs for `data-scout`, `judge-eval`, `web-ui`, `reviewer` | You are given that role |
| `docs/v1-plan.md` | This week, day by day, and the user's own tasks | Choosing what to do next |
| `docs/data.md` | The `fh_` tables, the sources, what each worker writes | Touching the database or a worker |
| `supabase/functions/fh-scout/`, `fh-jobs/` | Workers: YC and Hacker News; VC company lists and company job boards | Adding or fixing a source |
| `evals/new-grad/` | 40 postings and the labeling rule for the Judge | Working on the Judge |
| `log.md` | Requests and decisions, one dated row each | Making or recording a decision |
| `docs/AGENTS-a3-a5.md` | Rules from the assignments this repo grew from | Building a page (its design rules) or changing job-board code (its board notes); otherwise never |
| `docs/*-a4.md`, `*-a5.md`, `log-a3-a5.md` | Earlier assignments' notes | Never, unless asked about them |

## Never

- Never crawl LinkedIn, Wellfound or Fast AI Jobs; a card links out. A site whose robots.txt forbids us is skipped, with no way around through another site.
- Never take roles from a VC job board. It gives the company list; roles come from the company's own board.
- Never send a message for the user. Foothold names the person and the reason; the user writes and sends.
- Never invent an interview, a quote, a label or a number. A quote counts only if it is in the posting or the resume word for word. Pre-labels in `evals/new-grad` are not the user's labels.
- Never touch an env file, and never stage with `git add -A`, a directory, or `git commit -a`. A hook blocks both; do not look for a way around.
- Never apply a migration, deploy, push, or change Cron, RLS or keys unless you are the lead and the user said so in this conversation.

## Ask before deciding

- The shape of something (a table, a page, how agents split work, how something is measured): put it to the user as one question at a time, with a recommendation, and wait.
- A source's robots.txt or terms are unclear, or reaching it needs more than a plain request: say what it takes and ask.
- A change touches RLS, permissions, user data or keys: it goes through `reviewer` before it is applied.
- A number is about to go in the README, the page or a report and was not measured: measure it or ask.

## Habits

- Everything in this repo is in English: code, docs, the log, commit messages.
- Test first, on saved real responses; tests never call a paid or rate-limited model API.
- Every request and decision goes in `log.md` the same day.
- Commits are small: `<type>: <description>`, files staged by name.
