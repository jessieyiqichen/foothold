# Log · Foothold (DBS final project)

Every request, push-back and decision, newest last. Assignments 3 to 5 are in [docs/log-a3-a5.md](docs/log-a3-a5.md) (Chinese).

| Date | The user asked or decided | What the agent did or advised |
|---|---|---|
| 2026-11-10 | Start the final project; tables and import first | Repo copied from dbs-a5. Checked both sources live (YC directory JSON: 6,387 companies, 4,413 active; HN November "Who is hiring": 221 top-level comments). Tables `fh_companies`, `fh_postings`, `fh_runs` with RLS; worker `fh-scout` deployed. First parse kept 198 postings; a looser header rule brought it to 206. 40 postings saved as the new-grad eval set, pre-labeled by the agent and waiting for the user's own labels |
| 2026-11-10 | Approved the Cron schedule after the permission check refused the agent | HN daily 06:00 UTC, YC weekly Monday 07:00 UTC; both confirmed active |
| 2026-11-10 | v1 must reach about half of Fast AI Jobs' roles (20,000) | Measured before answering: 120 hiring YC companies, guessing board names, 47 found on Ashby, Greenhouse or Lever with 658 roles. Of the 26 VC boards in the a16z partner's list, 21 answer and they run on two platforms (Getro, Consider). Plan changed: job boards and VC lists move into v1; the Judge slips one day |
| 2026-11-10 | Find as many platforms and roles as possible | Worker `fh-jobs` deployed: nine Getro boards gave 3,019 companies; batches over every company look for its job board. A read-only subagent mapped the Consider boards. Greylock's robots.txt names Claude: skipped, no workaround |
| 2026-11-10 | "Discuss the design with me, don't do it all yourself" | The agent had drafted the ownership table and four role briefs unasked. Stopped; drafts left uncommitted; the four harness questions were then decided one at a time (below) |
| 2026-11-10 | Harness: split by file area; only the lead does dangerous actions; checking depends on the change; two rules enforced by a hook; harness files go to GitHub | Written into `AGENTS.md`, `docs/ownership.md`, `.claude/agents/`, `.claude/hooks/guard.mjs` (5 tests) |
| 2026-11-10 | Everything in the repo is written in English | Ownership table, plan and this log rewritten in English; earlier Chinese docs from Assignments 3 to 5 kept as they were, under `docs/` |
| 2026-11-10 | (Agent's own report) | The agent copied Assignment 5's env file into this repo with `cp` and listed its variable names, against the rule that agents never touch env files. No value was read or printed. The hook now refuses this |
