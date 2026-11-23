# Rules v1: hand check on the held-out sample (2026-11-22)

Checked by Claude (the side session "foothold·招聘原文提取"), line by line in `sheet.md`, before any rule was changed.
This is a hand check by the agent, not the user's labels. Precision only: is each stored value right, given its quote
and the posting? Recall was not measured.

| Signal | Found | Correct | Precision |
|---|---|---|---|
| Years (number and required/preferred) | 59 | 54 | 92% |
| Needs 3+ years (the flag that sorts a role lower) | 36 | 35 | 97% |
| Salary | 39 | 34 | 87% |
| Visa | 20 | 19 | 95% |
| Equity | 57 | 54 | 95% |
| 401(k) | 31 | 31 | 100% |

Errors:

| # | Signal | Stored | Right | Cause |
|---|---|---|---|---|
| 8 | years | 5 preferred | 5 required | "strongly preferred" is about a later clause |
| 11 | years | 5 | 12 | the "including 5+ years leading teams" clause won |
| 22 | years | 2 | 7 | same; the 7 went to pending |
| 54 | years | 5 preferred | 5 required | "(PostgreSQL preferred)" is about the database, not the years |
| 61 | years | 4 | 2 | "2-5 years ... or more than 4 years of overall experience": the minimum of the alternatives is 2 |
| 27 | salary | 26-26 an hour | 26-29 | "between $26/hour and $29/hour" |
| 39 | salary | 50,000-500,000 | none | deal size ("$50-$500K ACV") |
| 52 | salary | 40,000-50,000 | none | an "Equity: $40,000 - $50,000" line |
| 68 | salary | 20,000-100,000 | none | deal size ("$20k-100k+ ACV deals") |
| 79 | salary | 50,000-50,000 | none | customer revenue ("$50K–$250K in annual recurring revenue") |
| 36 | visa | sponsors | none | "Each posting states whether visa sponsorship ... is available" |
| 29 | equity | yes | none | "health-education and equity" |
| 39 | equity | yes | none | "does not include ... equity" |
| 99 | equity | yes | none | a URL containing "addiction-equity-act" |

Also seen, not counted as wrong: #89 stores the $55k base correctly but misses its "$100k+ OTE" (OTE was never set in
the sample); #45's "$200-300,000 salary" was not found (a recall miss).

After these errors were fixed, the sample is no longer held out. Version 2 is measured on `sample2-ids.txt`, 40
postings drawn afterwards from companies not in this sample.
