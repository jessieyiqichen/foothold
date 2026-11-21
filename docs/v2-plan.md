# Plan for v2 (project fair, 2026-12-01)

The brief asks to start from what people did with v1. Section 1 is filled in only from `docs/v1-user-tests.md`; the order in section 3 is confirmed or changed by it.

## 1. What people did with v1

From the session on 2026-11-17 (`docs/v1-user-tests.md`):

| Seen in the tests | How many of the testers | What it means for v2 |
|---|---|---|
| The card is too long | Reported for the two-person session (per person: to add) | A card shows everything at once: why it fits, how the company is doing, roles, contact and the message. It should show one screen, the reason and the next step, with the rest on demand |
| All roles and the cards are not connected | Reported for the two-person session (per person: to add) | A role found in All roles only links out to the posting: from there a person cannot save the company, see its card or write to anyone. Today and All roles are two separate products |
| The flow is not smooth | Reported for the two-person session (per person: to add) | There is no single path from "find" to "reach out". The company should be the one unit: every role opens its company's card, and the card is where saving and writing happen, whichever way the person came in |

## 2. Where v1 stands

v1 works end to end: sign in, add a resume, get five companies a day with the roles that fit and why, browse every role with filters, and write a first message to someone there with Gemini. Every claim on a card comes from a source it names.

What I saw myself while using it on 2026-11-17:

| Seen | What it means |
|---|---|
| The first real draft called me "a product manager" and opened with "reaching out because I have long admired" | A prompt alone does not hold the model to the truth or to a voice. Fixed for v1 with checks in code that refuse a claimed title, stock phrases and a referral ask, and make the model rewrite |
| The next draft read like a student introducing themself, not someone after a role | Drafts now name one open role, open with a one-line introduction and ask only for a 15 minute chat |
| A card said Figma had "5 people" | A VC board's size band was shown as a head count, on 2,617 companies. Fixed: facts are shown only when they mean what they say |
| A card ran to 2.3 screens | Shortened by about a fifth: the company in one sentence, five skills, the rest behind More |
| Most cards have no person to write to | "One company, one person" is the promise, and it is mostly unkept |

## 3. Order for v2

| Order | What | Why |
|---|---|---|
| 1 | **One flow, one card.** The company is the unit: a role in All roles opens its company's card, where the person saves it and writes; Saved holds companies from either way in. The card opens as one screen (why it fits, the best role, Write a message) with the rest behind a tap. Designed question by question with the user before it is built | The first thing the test showed, and it blocks everything else: the AI draft only helps if people reach it |
| 2 | **A harness for the drafts.** Standing rules plus the user's own one-line introduction and goal, loaded every time; each role's posting text read when needed; two steps (a plan that picks the role, the angle and the resume line, checked against the sources, then the email); the checks that already refuse bad drafts; and a memory of how the user edits drafts, fed back into the next one | The draft is the AI step that turns a card into an action, and v1 showed that one prompt is not enough |
| 3 | **An eval for the drafts.** A fixed set of real cards, run on every change: the code checks (true quotes, the role named, no claimed title, no stock phrases), a model grader for "does this read like someone after this role", and my own labels on a sample | Without it, each prompt change is judged on one Figma draft |
| 4 | **Alumni and people to write to.** On each card, people at the company from the user's schools, found through a search API (Brave), shown as name, title and a link; nothing stored, no emails guessed | The empty "Who to contact" is the biggest gap in the core promise |
| 5 | **Judge.** Level and hard requirements read from the posting's text, each with the sentence it comes from, scored against my 40 labels | "Level not in the title" on half the roles leaves people unsure what is open to them |
| 6 | **Follow-up.** Saved, reached out, replied, with reminders | Progress should count outreach, not applications |
| 7 | **Hardening.** A shared secret on the workers, persistent rate limits, a content security policy | Before strangers use it at the fair |

## 4. What waits

- More hiring systems: measured gains were small (log.md, 2026-11-11).
- A full redesign of the front end: after the harness and the people search, so the design is of real content.
- Builder's Board (A5) as a signal, not a page (user asked, 2026-11-21): a "just launched on Hacker News or Product Hunt" line on a card, and a ready opening for the draft. Waits because the overlap is small: from 2026-10-31 to 11-17 the board's 2,163 HN items matched 31 Foothold companies by domain, and its Product Hunt and GitHub links point at those sites, not the companies. Needs Product Hunt's API for each product's own website, and fits best once the harness looks for an angle. Later still: Product Hunt launches as a source of new companies, through data-scout.
