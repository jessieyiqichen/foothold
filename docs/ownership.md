# Ownership (Foothold)

When more than one agent or session works in this repo, read this table before starting. If you are not on it, or your row is wrong, fix the table. It is the only source of truth.

The four design decisions were made with the user on 2026-11-10, one at a time: split by file area; only the lead does dangerous actions; checking depends on the kind of change; two rules are enforced by a hook.

## Who owns which files

| Role | Brief | May change only | Does not touch |
|---|---|---|---|
| lead (the session talking to the user) | `AGENTS.md` | `docs/`, `README.md`, `AGENTS.md`, `log.md`, `.claude/`, `scripts/` | Code owned by another role, unless that role is not running |
| data-scout | `.claude/agents/data-scout.md` | `supabase/functions/fh-scout/`, `supabase/functions/fh-jobs/`, `supabase/functions/fh-roles/`, `supabase/migrations/*foothold*` (migrations that only change `fh_profiles` are web-ui's; one that spans both, like matching, is data-scout's and always goes to `reviewer`) | `apps/web/src/`, `evals/` |
| judge-eval | `.claude/agents/judge-eval.md` | `supabase/functions/fh-judge/`, `evals/`, `apps/web/src/lib/judge/` | Data workers, pages |
| web-ui | `.claude/agents/web-ui.md` | `apps/web/src/app/`, `apps/web/src/components/`, `apps/web/src/lib/` (not `apps/web/src/lib/judge/`), `apps/web/e2e/` | `supabase/` |
| (shared) | none | `packages/core/` belongs to the lead: the vocabulary is reviewed by the user, and a change there re-tags every posting and every profile. Another role proposes a change, the lead makes it | |
| reviewer | `.claude/agents/reviewer.md` | Nothing: it reads and reports | Any write |

## Only the lead does these

| Action | Why |
|---|---|
| Apply a database migration, deploy an Edge Function | All agents share one Supabase project (with Assignments 4 and 5 in it); a deploy replaces the whole function |
| `git push`, deploy to Vercel | The user looks at interface changes locally before they go live |
| Change Cron, keys or RLS rules | Standing rules and permissions: the user must know |
| Tell the user what an agent found | An agent's report is not proof: the lead checks the diff and the tests first |

## Any agent may

Read the database, read logs, run the tests. Read-only, without going through the lead.

## Checking a hand-back

| What came back | How it is checked |
|---|---|
| Read-only research | The lead spot-checks the key numbers and tells the user which were re-checked and which are only the agent's |
| Ordinary code | The lead runs the tests and reads the diff |
| Anything touching RLS, permissions, user data or keys | `reviewer` first, then the lead, then it is applied |

## Enforced by a hook (`.claude/hooks/guard.mjs`)

| Rule | Where it comes from |
|---|---|
| No tool and no shell command touches an env file | 2026-11-10: the lead copied a whole env file with `cp`; the Read/Edit deny rules did not stop it |
| Staging names files one by one: no `git add -A`, `git add .`, a directory, or `git commit -a` | The user's multi-session rule: a session once carried off another session's uncommitted work |

## Handing work over

| Rule | How |
|---|---|
| One task, one agent | The brief states the goal, the paths it may change, what done looks like, and what not to do |
| Test first | Logic lives in `lib/`; vitest runs on saved real responses; tests pass before the hand-back |
| Commits | Each agent stages only its own files, by name; `git status --short` first to see whose changes are in the tree |
| The hand-back | Files changed, the test output as printed, what is not done, what the lead must apply or deploy |
| Running in parallel | Only when two agents' paths do not overlap; otherwise they queue |
| Three states of done | Committed, pushed, deployed and checked: reported separately |

## Running now

| Date | Role | Doing | State |
|---|---|---|---|
| 2026-11-10 | lead | Jobs worker (fh-jobs): batches over every company | In progress |
| 2026-11-11 | ci-baseline (one-off session, branch `chore/ci-baseline`) | CI workflow, `typecheck` script, README "Checks"; touches `.github/`, `package.json`, `README.md`, `apps/web/src/lib/harness/guard.test.ts` | Committed, not pushed |
