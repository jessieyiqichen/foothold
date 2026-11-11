---
name: add-source
description: Add or fix a data source for Foothold (a company list, a job board, a hiring system, a VC board). Use whenever the task is to fetch companies or postings from a new site or API, to change how an existing source is parsed, or to find out why a source returns fewer rows than expected.
---

# Add a source

Get one site's companies or postings into the `fh_` tables, with the losses known and the rules of the site respected. Six steps, in order. Do not write a fetcher before step 3.

## 1. Read the site's rules first

Before any other request to the site:

1. Fetch its `robots.txt` and read the whole body.
2. Check `docs/data.md`, section Sources: is the site already listed as never used?

| What you find | Do |
|---|---|
| Our path is disallowed, or the file names Claude or AI agents | Stop. Report it. No request to that site, and no route to its data through another site |
| Allowed, and a plain request returns the data | Go on |
| Allowed, but the data needs a session, a cookie, a token or a browser-like header | Stop and ask the user, saying exactly what it takes |
| The site is LinkedIn, Wellfound or Fast AI Jobs | Stop. These are never crawled |

A VC job board gives a company list only. Roles come from each company's own board.

## 2. Save a small real response

Make one request. Save the response, cut to two or three rows, under the worker's `fixtures/`. Cut long text fields. No keys, cookies or tokens in a fixture.

Note what the response really contains: the page size it actually returns (not the one you asked for), how it pages, which fields can be missing.

## 3. Write the test, then the parser

In the worker's `lib/`, with no Deno or Node imports, so the same code runs in vitest and in the Edge Function.

- The test reads the fixture and checks the fields a card needs.
- Add a test for bad input: a row with no id, no name, no link, a wrong type, `null`, and a response that is not the expected shape. Each must be dropped, not thrown.
- Every outside value is checked before use. Only `https` links are kept. Text is cut to the limits in `docs/data.md`.
- A test that fails because the site differs from what you assumed means the assumption was wrong: fix the parser or the expectation to match the real response, and say which in the report.

Run `npx vitest run supabase/functions`. All tests pass before step 4.

## 4. Measure what is lost

Run the parser on one full real response, locally, without writing to the database.

Report: rows in, rows kept, rows dropped, and three dropped rows as examples.

| Dropped | Do |
|---|---|
| Under 5%, and the examples are not real companies or postings | Go on |
| More, or the examples are real ones in a format the parser missed | Stop and ask the user whether to extend the parser or accept the loss |

## 5. Write the migration and the worker change; do not apply them

- A new column, table or allowed value: a migration file in `supabase/migrations/`, named `*foothold*`. Row-level security stays on; only the workers write.
- The fetch: in the worker, with a timeout, an honest `User-Agent`, and the headers step 2 showed are needed.
- A change that touches RLS, permissions or user data goes to `reviewer` before the lead.

You do not apply the migration, deploy the function, or push. The lead does.

## 6. Hand back

In this order, nothing else:

1. The site, its robots.txt verdict, and what a request needs.
2. Files changed.
3. The test output as printed.
4. Step 4's numbers and the three examples.
5. What the lead must apply or deploy, and the exact call that runs it.
6. What is not done.

After the lead has run it, the lead reads the row counts from the database, adds the source to `docs/data.md`, and records it in `log.md`. A count that was not read from the database is not written anywhere.
