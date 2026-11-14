# Foothold architecture (re-centred 2026-11-14)

Positioning, unchanged: from your own resume, Foothold finds the startups, the roles and the people that fit you, and every judgment quotes its source. The first users are students.

What changed: the product had drifted into a board of job postings (log.md, 2026-11-14). The primary object is now the **company**; roles are the evidence that a company fits, a person is the way in, and the plan is today's cards. Competitor study behind this: `docs/competitors.md`.

## The card (approved by the user, 2026-11-14)

One card is one company, one person, one message.

| Part | Content | Source | Needs a model |
|---|---|---|---|
| Why it fits you | One line from your resume and one line from the company, quoted | `fh_profiles`, `fh_companies` | No for v1 (shared skills); yes for the quoted pairing |
| How the company is doing | Funding with a link to its source, team size, how long ago it last posted a role | `fh_companies`, SEC Form D, `fh_postings` | No |
| Roles to apply to | One or two, newest and best matched first | `fh_postings`, `fh_matches` | No |
| Who to contact | One person, only through a route they published themself, with the source and the date it was seen | HN posts, SEC Form D, YC page on request | No |
| A short draft | Read in a minute, says why you fit this company, one ask | Resume plus company | Yes (Gemini, waiting for the key) |
| Actions | Save, Reached out, Skip | `fh_decisions` (new) | No |

Today's five are five such cards. Progress counts outreach (saved, reached out, replied), not applications.

## Layers

| Layer | Object | Does | State |
|---|---|---|---|
| You | Profile | Resume, skills, directions, levels; first visit at `/start` | Built |
| Scout | Company | Ranks companies for you: shared skills on their recent roles, directions, levels, freshness | Roles ranked; company ranking to build |
| Judge | Role | Reads a posting: level and hard requirements, each with the quoted sentence | Not started (eval set waits for the user's labels) |
| Insider | Person | Finds who to contact at a company, from sources Foothold may use | Not started |
| Connector | Message | Drafts the first message; the user sends it | Not started (needs the model key) |
| Cards | Today's five | One company, one person, one message; save, reached out, skip | Not started |
| Follow-up | Saved, reached out, replied | Later: Nudge's reminders | Not started |

## Rules the layers keep

- **Freshness.** Recommendations use roles first posted in the last 60 days (proposed; see log.md). Older roles are not deleted: they stay in the full list behind a switch, with their age shown. A company whose only roles are old is not recommended. Boards are re-checked daily and roles that disappear are marked closed (a cron, the user's decision).
- **People.** In this order: HN "Who is hiring" posters through the official API; SEC Form D related persons; YC founders, one page at a time when the person asks for that company; company team pages where robots.txt and terms allow. Never guess or verify emails, never harvest contacts, never LinkedIn, never send for the user.
- **Quotes, not scores.** A match is explained by the lines it rests on. No bare percentages, no facts the resume does not contain.
- **Agents as named owners, one view.** A card can say which layer did what (Scout found it, Insider found the person), but every decision stays on the main screen.

## Order of work for v1 (due 2026-11-17)

1. Company ranking in the database, with the freshness rule.
2. Decisions table (save, reached out, skip), reviewed before it is applied.
3. People from HN posts already stored; SEC Form D through the `add-source` skill.
4. Today's five as company cards, replacing the role list as the front door.
5. Daily re-check of boards, if the user agrees.
6. Drafts, when the model key exists.
