# Foothold v1 plan (November 10 to 17)

Proposal: https://dbs-proposal-xi.vercel.app. This repo was copied from dbs-a5: the same Clerk app and Supabase project, new tables prefixed `fh_`, Assignment 4 and 5 tables untouched.

## The week

| Day | What | Done when |
|---|---|---|
| Mon 11-10 | Repo, README, harness; 40-posting eval set; YC and HN import; jobs worker and VC company lists | Data is in the database (done) |
| Tue 11-11 | Finish the job-board batches; a16z company list; more hiring systems if the count is short of the target | Role count measured against the 20,000 target |
| Wed 11-12 to Thu 11-13 | Judge: yes / maybe / no with the quoted sentence; the quote checked word for word in code; eval script against the 40 labels | An agreement number exists (target 80%) |
| Thu 11-13 | Sign-up and profile: paste resume text, pick interests | A new person has a profile in three minutes |
| Fri 11-14 | Insider ("your way in": one resume line against one company fact) and Connector (the HN poster and their email, the founders' page) | One complete card |
| Sat 11-15 | Team room: each worker step writes a message, Realtime pushes it; cards in New / Saved / Reached out; "I reached out" | The page moves on its own |
| Sun 11-16 | Deploy to Vercel; five classmates sign up; fixes | Real sign-ups |
| Mon 11-17 | Buffer; v1 due | |

## Role-count target (user, 2026-11-10)

v1 reaches about half of Fast AI Jobs' roles: 20,000. Measured on 11-10 before committing to it:

| Source | Measured | Note |
|---|---|---|
| Hiring YC companies, guessing the board name on Ashby, Greenhouse, Lever | 47 of 120 found, 658 roles; about 8,200 across all 1,493 | Assignment 4's board code reused |
| The 26 VC job boards in the a16z partner's list | 21 answer; two platforms: Getro (9 boards, 3,019 companies imported) and Consider (9 boards, 2,368 companies with overlap); a16z's own page lists 692 | robots.txt allows them; Greylock's names Claude and is skipped |

VC boards give company lists only; roles come from each company's own board; the same company is merged by domain.

## Order

The Judge's eval comes before any interface. Without an agreement number on November 17, nothing else counts as done.

## Reused

| From | Used for |
|---|---|
| Assignment 5: worker, Cron, Realtime | The Scout and the agents' message stream |
| Assignment 4: `apps/web/src/lib/jobs` (Greenhouse, Lever, Ashby) | Job boards |
| Assignment 4: goals, entries, reminders | "Reach out to N this week", "I reached out", the seven-day follow-up |

## The user's own tasks

| Task | By |
|---|---|
| Go through `evals/new-grad/review.md` and fill in "Your label" where you disagree | 11-11 |
| Get a Gemini API key from Google AI Studio and put `GEMINI_API_KEY` in the env file | 11-12 |
| Ask five classmates to sign up | 11-16 |
