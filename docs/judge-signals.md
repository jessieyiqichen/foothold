# Judge signals: what a posting's own text says (v2, 2026-11-22)

Five signals read from `fh_postings.text`, each stored with the sentence it comes from. Decided with the user on
2026-11-22, one question at a time (log.md):

| Question | Decision |
|---|---|
| Roles whose text requires years of experience | Mark them with the quoted sentence and sort them lower; a "Hide roles needing years of experience" filter on Jobs, on by default for a signed-in person whose levels include intern or entry and not senior or management. Nothing is hidden outright |
| Signals in this pass | Years of experience, salary range, visa (sponsors / will not sponsor / citizens or clearance only), equity, 401(k). Long hours and hard requirements (field, licence, hands-on skills) wait until after the fair |
| Model | Rules first. The model (Gemini paid tier, `gemini-3.5-flash-lite`, with a budget cap) only settles sentences the rules cannot. A sample run and its measured cost go to the user before any full run |

## Rule: no value without a quote

Every stored value has a quote: one sentence (or bullet line) copied character for character from the posting's text,
1 to 400 characters. A value without a quote is never written; the table's checks refuse it. The model never writes a
quote: it only classifies a sentence the rules already cut from the text, so a quote cannot be invented.

## Thresholds

- **Needs years**: the required minimum is 3 years or more (the eval rule: 0 to 2 years is new grad). "N+ years",
  "N-M years" (the minimum is N), "at least N", "minimum of N", "N or more", numbers in words. Years under a
  "preferred", "nice to have", "bonus" or "plus" heading, or in a sentence saying so, are stored with
  `years_required = false`: shown, never sorted down. Where several sentences state years, the largest required
  minimum is kept, with its sentence.
- **Not experience**: "founded 10 years ago", "N-year vesting", "N years of runway", ages, "over the past N years" and
  similar do not count. A number counts only when the sentence ties it to experience.
- **Salary**: a range or a floor in a currency, per year or per hour. Funding amounts ("$20M Series A"), equity
  percentages and amounts outside sane bounds (per year 15,000..1,000,000; per hour 10..500) are left out. OTE is kept
  and marked (`salary_ote`). The salary filter compares the annual USD upper bound (hourly times 2,080); other
  currencies are shown but not filtered.
- **Visa**: `sponsors` (will sponsor a visa, H-1B, PERM or a green card), `no_sponsorship` (will not, now or in the
  future), `citizens_only` (US citizens, US persons or green-card holders only, security clearance, ITAR). Where the
  text says both "sponsors" and "does not sponsor", the model decides; if it cannot, nothing is stored. Equal
  opportunity lines ("regardless of citizenship status") never count.
- **Equity, 401(k)**: true only, with the sentence. "Diversity, equity and inclusion", "private equity", "equity
  research", "health equity", "brand equity" do not count.

## Storage: `fh_posting_signals` (one row a posting)

A side table, so the workers that write `fh_postings` are untouched. Row-level security on; signed-in people read it
(as they read postings); only the worker writes it. Signed-out visitors see it only through the public definer
functions, with emails taken out of quotes.

| Column | Meaning |
|---|---|
| `posting_id` | `fh_postings.id`, primary key, deleted with the posting |
| `version` | `SIGNALS_VERSION` of the rules that wrote it |
| `text_md5` | md5 of the text it was read from. `fh-jobs` bumps `updated_at` on every refresh, so the worker compares the hash and never re-reads, or re-asks the model about, unchanged text |
| `years_min`, `years_required`, `years_quote` | |
| `salary_min`, `salary_max`, `salary_currency`, `salary_period` (`year`, `hour`), `salary_ote`, `salary_quote` | |
| `visa` (`sponsors`, `no_sponsorship`, `citizens_only`), `visa_quote` | |
| `equity`, `equity_quote`; `k401`, `k401_quote` | |
| `pending` | Candidate sentences the rules could not settle, waiting for the model; null when none |
| `settled_by` | `rules`, or the model's name when the model settled any of it |
| `extracted_at` | |

## Worker: `fh-signals` (pattern of `fh-roles`)

| Call | Does |
|---|---|
| `{"task":"rules","limit":500}` | Reads the next open postings with no row, an older `version`, or a different `text_md5`; extracts with the rules; writes rows through a definer function (service role only). Free; anyone may call it, so a call with nothing to do writes nothing |
| `{"task":"model","limit":50}` | Sends the `pending` sentences of the next rows to the model, several postings a request, JSON output checked against a schema; writes the decisions and clears `pending`. Needs the header `x-fh-worker-key` equal to the secret `FH_WORKER_KEY` (a stranger must not spend the paid key) and the secret `GEMINI_API_KEY`. Stops at a per-call cap of requests and returns the tokens used |

## What reads it

| Function | Change |
|---|---|
| `fh_roles`, `fh_public_roles` | Return `signals jsonb` per role. New filters: `p_hide_years` (null = off; the web sends `true` itself when the profile default above is on, so applying before the web deploy hides nothing), `p_visa` (`sponsors` or `not_citizens_only`), `p_min_salary` (USD a year), `p_equity`, `p_k401`. Fit order puts roles that need years after the others |
| `fh_roles_facets` | Same new filters, so the counts agree with the list |
| `fh_company_fit` | A company's best role and score come from roles that do not need years when it has any; a company with only such roles ranks after the others (Today, Saved, Companies by fit) |
| `fh_company`, `fh_public_company` | Each role in `roles` carries `signals` |

`signals` shape (keys absent when unknown):
`{"years":{"min":4,"required":true,"quote":"..."},"salary":{"min":120000,"max":160000,"currency":"USD","period":"year","ote":false,"quote":"..."},"visa":{"value":"sponsors","quote":"..."},"equity":{"quote":"..."},"k401":{"quote":"..."}}`

## Measuring

`evals/signals/`: 120 open job-board postings (stratified, `sample-ids.txt`) plus the 40 in `evals/new-grad/`. The
rules run over them and write a sheet of value and quote; precision is checked by hand, and reported as a hand check,
not as the user's labels. The 40 new-grad postings still have no user labels (2026-11-22), so no new-grad accuracy is
claimed from them.

Run replies: `written` counts rows written with values plus rows written empty (an unsafe row, taken out of the queue); `with_values` and `emptied` split it; `skipped` are rows whose text changed since the claim.
