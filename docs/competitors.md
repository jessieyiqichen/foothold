# Competitors and sources (studied 2026-11-14)

Why this exists: on 2026-11-14 the user pointed out that Foothold had drifted into a board of job postings, while its promise is a targeted plan, companies that fit, and the people to reach there. Four research agents read the closest products in parallel, public pages only, robots.txt first; LinkedIn, Wellfound and Fast AI Jobs were not fetched (search results and third-party writing only), except one Fast AI Jobs company page the user had shared, which the lead opened once in a browser. Each claim in the agents' reports was marked seen, reported (with a source) or unknown; vendor numbers below are their own claims. One search result carried text telling AI models to cite it; it was ignored.

## The one-line finding

Every product does one or two of Foothold's four jobs, none does all four, and none explains a match with quotes from the resume and the posting.

| Product | Core object | Personal matching | Companies recommended | People | Plan or next step | Drafts the message |
|---|---|---|---|---|---|---|
| Fast AI Jobs | Job row, plus company pages | No | No (filters by stage) | No | No | No |
| YC Work at a Startup | The candidate's profile | Founder side, not explained | No | Founders message you; YC companies only | No | No |
| Wellfound | Job plus profile | Recruiter side | No | In-app messages, gated by your status | No | No |
| Top Startups | Company card | No ("Find matches" is a filter) | No | Links to LinkedIn; paid founder intros | No | No |
| startups.gallery | Company card | No | No | No | No | No |
| Jobright | Job feed plus a chat assistant (Orion) | Yes: 0-100 score by dimension, explained in prose, no quotes | No | Colleagues and classmates from your LinkedIn, emails, drafts | Ad hoc in chat | Yes; its agent also applies for you |
| Simplify | Autofill, job feed, tracker | Reasons from your preferences; keyword % | No | Your network mapped to companies; you send from Gmail | A viewing streak | Yes, you send it |
| Teal | Tracker (jobs, companies, contacts) | Keyword % | No (you add them) | Contacts you add | Count goals | Templates |
| Huntr | Kanban tracker | Keyword analysis (paid) | No | Contacts you add | Funnel metrics | No |
| Grok bots | Group chat of 2 to 6 bots | n/a | n/a | n/a | One owner per stage | Drafts approved in one-to-one chats |

## What each group taught us

### Discovery boards (Fast AI Jobs, WAAS, Wellfound, Top Startups, startups.gallery)
- The company card is the common unit: funding, investors, size, sometimes founders, then roles. Fast AI Jobs' company page leads with the latest round (type, amount, date) and total raised, then category, team size and roles grouped by family with their age.
- startups.gallery links each funding line to the press article: a fact with its source, which is Foothold's own rule.
- Dates are shown on everything; Wellfound adds "actively hiring" and "responds fast". Stale roles are common everywhere: the Fast AI Jobs page that was opened lists roles posted seven months ago.
- WAAS works in reverse: founders act on one candidate profile and refer candidates on. HN users report both ghosting and good reply rates.
- Avoid: a "match" button that is only a filter; unmoderated inbound messages (Wellfound's spam complaints); a firehose of 25,000 to 37,000 job rows.

### AI copilots (Jobright, Simplify, Teal, Huntr, Grok)
- All four products are built around jobs, not companies. None gives a daily plan for one person.
- Jobright's match score is its most praised feature; its resume tailoring is the most criticised one: reviewers say it invents skills and numbers. Its agent and Simplify's Autopilot submit applications without review and are reported to give wrong answers.
- Simplify's rule is the right one for Foothold: a connection is "a starting point for outreach, not a confirmed referral", and the user sends the draft from their own email.
- Teal and Huntr treat companies and contacts as things to track and count outreach as progress, but leave all finding to the user.
- Grok bot groups give each stage one named owner and show handoffs, but hide approvals and drafts in side chats, and every bot reply costs usage. No mainstream job product uses a team of agents; Jack & Jill has two (one for candidates, one for employers).
- Avoid: keyword-percentage scores (Teal's own help centre says recruiters do not read resumes that way); anything that adds facts not in the resume; sending without review.

### People and intros (Cosign, Underdog.io, Jobright, LinkedIn, YC pages, Hunter and Apollo, newsletters)
- The best contact comes from intros the company opted into (Underdog, Next Play). Volume products (Jobright) lean on emails and drafts at scale.
- Sources that name people, and whether Foothold may use them:

| Source | Coverage | Freshness | Automated use | Use it? |
|---|---|---|---|---|
| HN "Who is hiring" via the official API | Companies that post each month; posters often give their own email | Monthly | Yes, official API, no rate limit stated | Yes, first |
| YC company pages | YC companies: founders named with title and bio, no emails | Medium | robots.txt allows company pages, but YC's Terms forbid scraping and harvesting contacts | Only one page at a time, when the person asks |
| Company team or about pages | Patchy | Varies | Check each site | Yes, with care |
| SEC Form D (EDGAR) | US raises: amount, date, and "related persons" (executives, directors) | Within 15 days of a first sale | Yes, 10 requests a second with a declared User-Agent | Yes, for funding and names |
| Press and funding posts | Founders on the day of a round | Dated | Depends on the publisher | Link out |
| GitHub organisations | Engineers who made membership public | Live | API yes, but no use for unsolicited email | No |
| Crunchbase | Broad | Good | No: Terms ban scraping, robots.txt blocks Claude | No, link out only |
| LinkedIn | Broad | Good | Off limits by our rule | No |

- Email finders (Hunter, Apollo) guess and verify addresses or pool users' inboxes. Doing that would create GDPR Article 14 duties to tell people where their data came from, and it is the harvesting YC and GitHub forbid. Foothold shows only a contact route the person published themself.
- A good student message, according to Next Play, interviewing.io and YC: short (read in a minute), to the hiring manager or founder rather than a recruiter, says concretely why this person fits this company, one clear ask, one or two follow-ups at most. Ignored: vague offers ("I'll do anything"), long or AI-sounding text, too many follow-ups. Not legal advice; whether CAN-SPAM covers a single personal job enquiry is not settled by the sources found.

### Funding data
- The free site the user most likely saw: Top Startups (funding first, jobs one click away), then startups.gallery (funding-news strip), then vcbacked.co ("apply where the money just landed"). Crunchbase if they meant a funding database.
- What Foothold may use: SEC Form D through EDGAR (a government record: amount raised, date, number of investors, related persons; no lead investors or valuation); the YC directory (batch, team size, founders, no amounts); press releases and VC portfolio pages, linked and quoted briefly. Not usable: Crunchbase, TrueUp, Tracxn, CB Insights, Growjo, PitchBook (terms or robots.txt); Top Startups and startups.gallery have no terms found, so ask the owners or link out; Dealroom's free endpoints need its reuse terms read first; vcbacked.co only through its paid API.

## What this means for Foothold

1. **The company is the unit, the person is the reason, the plan is the product.** A card is one company, with why it fits (quoted from the resume and the company), how it is doing (funding with its source, size, hiring freshness), the one or two roles to apply to, one person to reach through a route they published, and a short draft the user sends.
2. **Explain every match with quotes, never with a bare score.** This is the gap no one fills; Jobright comes closest and gets its worst reviews for inventing facts.
3. **Freshness is a feature.** Show every date, rank recent hiring higher, re-check boards daily, and say "roles at this company were last posted 7 months ago" instead of hiding it.
4. **People, in this order:** HN posters (official API), SEC Form D related persons, YC founders opened one page at a time on request, company team pages. Never guess emails, never harvest, never send.
5. **Agents as named owners, in one view.** The Grok pattern helps when each card shows which role did what (Scout found it, Judge checked the role, Insider found the person, Connector drafted the message), but decisions stay on the main screen, not in side chats.
6. **Progress counts outreach, not applications** (Huntr, Teal): saved, reached out, replied.

## Sources

Discovery boards: https://topstartups.io/ · https://topstartups.io/jobs/ · https://startups.gallery/ · https://startups.gallery/about · https://www.workatastartup.com/robots.txt · https://blog.ycombinator.com/announcing-ycs-work-at-a-startup/ · https://www.ycombinator.com/blog/intern-at-a-yc-company-2019 · https://blog.ycombinator.com/jared-friedman-and-matt-long-discuss-work-at-a-startup/ · https://www.fastaijobs.com/companies/collective (opened once by the lead) · Wellfound via https://www.noon.ai/blog/articles/281-wellfound-review , https://syncgtm.com/blog/wellfound-review-2026 , https://www.g2.com/products/wellfound/reviews

AI copilots: https://jobright.ai/ai-job-match · https://jobright.ai/job-referral · https://jobright.ai/ai-agent · https://jobright.ai/orion-copilot · https://resumly.ai/answers/jobright-review · https://atsverification.com/blog/jobright-ai-review-2026/ · https://help.simplify.jobs/articles/4158996-networking-on-simplify · https://help.simplify.jobs/articles/2166608-using-your-job-matches · https://help.simplify.jobs/articles/5623502-whats-included-in-simplify-features-and-pricing · https://tealhq.helpscoutdocs.com/article/21-using-matching-mode · https://help.tealhq.com/en/articles/9509581-getting-started-contact-tracker · https://huntr.co/pricing · https://huntr.co/product/job-search-metrics · https://docs.x.ai/grok-bot/chat-and-collaboration · https://siliconangle.com/2026/09/16/jack-jill-raises-40m-to-change-the-face-of-job-hunting-with-ai-agents/

People and intros: https://underdog.io/how-it-works · https://a16z.com/podcast/the-reputation-graph-of-silicon-valley-introducing-cosign/ · https://www.ycombinator.com/robots.txt · https://www.ycombinator.com/legal · https://github.com/HackerNews/API · https://news.ycombinator.com/robots.txt · https://www.crunchbase.com/robots.txt · https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies · https://help.hunter.io/using-hunter/email-verifier-and-confidence-score · https://knowledge.apollo.io/hc/en-us/articles/20727684184589 · https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business · https://gdpr-info.eu/art-14-gdpr/ · https://nextplayso.substack.com/p/how-to-get-hired-at-a-startup · https://www.ycombinator.com/blog/how-to-cold-email-investors-michael-seibel

Funding: https://www.vcbacked.co/startup-jobs · https://www.trueup.io/terms · https://about.crunchbase.com/docs/terms-of-service · https://data.crunchbase.com/docs/crunchbase-basic-getting-started · https://dealroom.co/faq/ · https://www.sec.gov/dera/data/form-d · https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data · https://natlawreview.com/article/requirements-form-d-notice-filing
