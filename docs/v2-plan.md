# Plan for v2 (draft, to be finished from the v1 user tests)

The brief asks to start from what people did with v1. The first section is filled in only from `docs/v1-user-tests.md`; the rest is what is already known, ranked, and is reordered once the tests are in.

## 1. What people did with v1

To fill in from the tests: where people got stuck, what they expected, which cards they would act on.

| Seen in the tests | How many of the testers | What it means for v2 |
|---|---|---|
| | | |

## 2. Already known before the tests

| Gap | Why it matters | Evidence |
|---|---|---|
| No model in the loop yet (Connector draft is a placeholder) | The project is assessed on AI; the draft is the step that turns a card into an action | `docs/architecture.md`, card section |
| Most cards have no person | "One company, one person" is the promise; 20 companies have a contact a poster published | log.md, 2026-11-15 |
| Level comes from the title only; about half of roles say none | People cannot tell which roles are open to them | log.md, 2026-11-12 |
| Roles before the daily refresh began may be closed | The refresh closes them going forward | log.md, 2026-11-15 |
| The workers are public, with no shared secret | A stranger can use up the free quota | Security review, 2026-11-16 |

## 3. Proposed order (to confirm with the tests)

| Order | What | Why first |
|---|---|---|
| 1 | Connector: a short draft per card, quoting the resume line and the company line it rests on; the user sends it | The core action, and the AI focus |
| 2 | Judge: level and hard requirements read from the posting's text, each with the sentence it comes from, scored against the user's 40 labels | Makes "is this for me" answerable; the eval set is ready once labelled |
| 3 | More people: SEC Form D related persons, company team pages | More cards with a real way in |
| 4 | Follow-up: saved, reached out, replied, with Nudge's reminders | Progress counts outreach, not applications |
| 5 | Shared secret on the workers, persistent rate limits, a content security policy | Hardening before the project fair |

## 4. What waits

- More hiring systems: measured gains were small (log.md, 2026-11-11).
- A team-room view of the four roles: after Connector and Judge exist, so the room has real work to show.
