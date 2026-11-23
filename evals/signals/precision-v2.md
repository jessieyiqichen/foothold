# Rules v2: hand check on the second held-out sample (2026-11-22)

Rules version 2 (commit 03abccd) were written from the v1 errors in `precision-v1.md` without opening `sample2.json`.
This is the first time any rule ran on `sample2.json` (40 postings, companies not in the first sample). Checked by
Claude line by line in `sheet2.md`; a hand check by the agent, not the user's labels. Precision only.

| Signal | Found | Correct | Precision |
|---|---|---|---|
| Years (number and required/preferred) | 23 | 20 | 87% |
| Needs 3+ years (the flag that sorts a role lower) | 16 | 14 | 88% |
| Salary | 13 | 12 | 92% |
| Visa | 9 | 9 | 100% |
| Equity | 17 | 16 | 94% |
| 401(k) | 12 | 12 | 100% |

The sample is small: one error moves a row by 4 to 11 points. Read with `precision-v1.md` (v1 on 120 postings: needs
3+ years 35 of 36).

Errors:

| # | Signal | Stored | Right | Cause |
|---|---|---|---|---|
| 10 | years | 2 preferred | 2 required | "Minimum of 2 year ..., with a focus on geriatric ... care preferred": "preferred" is about the focus |
| 34 | years | 10 required | 10 preferred | "Most successful candidates ... have 10+ years ..., though we do not have a s[trict requirement]" |
| 37 | years | 5 required | 5 preferred | "5+ years of relevant experience ... (preferred)": a trailing "(preferred)" governs the whole line |
| 11 | salary | 25,000-70,000 | none | deal size: "procurement, typically in the $25K–$70K range" |
| 23 | equity | yes | none | "internal equity" (pay fairness), not an equity grant |

Waiting for the model, as intended: #28 "Seasoned mechanical design experience (5-8 years)", #30 "5+ years of product
management, including 2+ years shipping LLM-powered products", #38 the founders' "15+ years building in Amazon Ads"
(company history, should be dropped), and #28's two visa sentences ("certain accommodations for visa sponsorship may
not be within our capability").
