# Signals hand check

Rules version 2, written by `run.ts`. One block per posting: n · stratum · id · title, then one line per signal (quotes cut at 220 characters here only). Fill `check:` with ok, or what is wrong. `heading` is the section the rules put the sentence in. This is a hand check of precision, not the user's labels.

Quotes not found word for word in their text: 0.

## Sample: sample2.json, 40 job board postings (held out only if no rules version was tuned on this file)

**1** · other · `ashby:vibe:86a0d406-178b-4ad7-9ef5-c68738f06553` · Staff Product Manager - Measurement & Reporting
- none | check: 

**2** · other · `ashby:citizen:6651c456-6b07-4f06-b710-15a4bd5d4c6a` · Head of Product, Enterprise
- none | check: 

**3** · other · `ashby:method:fcaa3cbe-269e-4be2-87e9-f91662c727b6` · Former Founder
- none | check: 

**4** · other · `ashby:facilityos:2100b0c8-33cf-4954-9a74-18de623a81fc` · Junior Deployment Specialist
- none | check: 

**5** · other · `ashby:tuesday-labs:e5b0b3d9-3fd2-4d30-8ff2-dc394d393972` · Open Call for Candidates
- none | check: 

**6** · other · `ashby:uplane:49df14a1-3321-4e82-b85f-d0ecc51ef982` · AI Marketing Strategist Intern
- none | check: 

**7** · salary · `greenhouse:meshopticaltechnologies:4134349009` · Optical Test Engineer
- years: 2 required | heading: required | "2+ years of hands-on experience in optics, photonics, lasers, or test" | check: 
- salary: 120000-160000 USD year ote=false | "Optical Test Engineer: $120,000.00 - $160,000.00/per year" | check: 
- equity | "Eligibility for long-term incentives including company stock options and discretionary bonuses awarded for exceptional achievements." | check: 
- k401 | "401(k) retirement plan access." | check: 

**8** · salary · `ashby:eragon:67d4c846-336e-4a73-9ff7-7d7416fd7a58` · Member of Business Staff - Ecosystem Partnerships
- salary: 150000-225000 USD year ote=false | "Salary: $150K - $225K + meaningful ownership of equity" | check: 
- equity | "Salary: $150K - $225K + meaningful ownership of equity" | check: 

**9** · salary · `ashby:minerva:b06da930-2eac-4eb2-b8ba-78868cda2889` · Senior Design Engineer
- salary: 237000-265000 USD year ote=false | "$237,000–$265,000 base salary, depending on experience." | check: 
- equity | "Meaningful equity." | check: 

**10** · salary · `greenhouse:seenhealth:5459344008` · Occupational Therapist
- years: 2 preferred | heading: required | "Minimum of 2 year of experience in occupational therapy, with a focus on geriatric or community-based care preferred." | check: 
- salary: 105000-145000 USD year ote=false | "Salary: $105k - $145k/year" | check: 
- equity | "Equity: included as part of founding team package" | check: 
- k401 | "401k Plan" | check: 

**11** · salary · `ashby:aurelian:1e6f8a55-b636-4224-961f-fa315c6f2467` · Mid-Market Sales - Seattle
- years: 2 required | heading: none | "2+ years of sales experience, ideally in SaaS or inside sales, with a track record of hitting pipeline creation and quota targets." | check: 
- salary: 25000-70000 USD year ote=false | "You will be managing prospecting, discovery, demos, and procurement — typically in the $25K–$70K range." | check: 
- equity | "Start-up Equity" | check: 
- k401 | "401(k)" | check: 

**12** · salary · `ashby:webflow:0efb9a8a-3267-4e74-90d2-2d44e7930ab7` · Senior Customer Success Manager
- years: 5 required | heading: required | "5+ years of relevant experience advising Enterprise customers in a SaaS or digital experience environment, ideally in a role where you owned adoption, renewal, uncovering expansion and long-term customer health." | check: 
- salary: 174500-205000 USD year ote=false | "Zone A: $174,500-205,000" | check: 
- equity | "Benefits/additional compensation for this role may include: equity, company bonus or sales commissions/bonuses; retirement plans; health benefits; and wellness stipends" | check: 

**13** · salary · `ashby:distyl:fe44469c-0f27-408c-878c-5e296b7db50e` · Research Engineers, Data
- salary: 150000-250000 USD year ote=false | "The base salary range for this role is $150K – $250K, depending on experience, location, and level." | check: 
- equity | "In addition to base compensation, this role is eligible for meaningful equity, along with a comprehensive benefits package" | check: 
- k401 | "Retirement and financial planning benefits, including access to pre-tax HSA, FSA, and commuter accounts, 401(k), and financial coaching resources" | check: 

**14** · salary · `ashby:legionhealth:9e25b121-04b6-4643-9b5d-7b648d89d3d2` · Collaborating Psychiatrist / Supervising Physician (MD or DO) — Remote | Telehealth | Part-Time | Multiple States
- salary: 50000-150000 USD year ote=false | "Compensation: $50K-150K per year, depending on the number and workload of PMHNPs supervised" | check: 

**15** · salary · `greenhouse:fanaticsinc:4283862009` · Manager, HR Compliance Programs & Operations
- years: 5 required | heading: required | "5+ years in HR compliance, employee relations, background screening or HR operations" | check: 

**16** · salary · `ashby:switchboard:6d225281-7be5-4966-b37e-5920890ffc97` · Event Marketing Manager (FinTech)
- years: 4 required | heading: required | "4+ years of B2B SaaS event or field marketing experience" | check: 
- salary: 100000-110000 USD year ote=true | "Total compensation: $100,000 – $110,000 (base salary plus bonus) + full benefits" | check: 

**17** · salary · `greenhouse:wisetack:4754606005` · Sales Development Representative
- years: 2 required | heading: required | "2+ years of experience in outbound prospecting or a high-volume, customer-facing role" | check: 
- salary: 75000-75000 USD year ote=false | "The base salary for the position is $75,000, plus annual target variable of $15,000, equity, and benefits." | check: 
- equity | "The base salary for the position is $75,000, plus annual target variable of $15,000, equity, and benefits." | check: 

**18** · salary · `greenhouse:nurix:8887158002` · Senior Research Associate, Preclinical Pharmacology
- years: 4 required | heading: required | "BS/MS in Biology, Pharmacology, Immunology, Cancer Biology, or a related field, with a BS or equivalent plus 8 or more years of relevant experience, or an MS plus 4 or more years of relevant experience" | check: 
- salary: 131400-139900 USD year ote=false | "Salary Range: $131,400 - $139,900" | check: 

**19** · visa · `ashby:blee:832c4e82-f2cc-4fd5-ab89-08164bbcdd2c` · Applied Scientist
- years: 5 required | heading: required | "5+ years of applied ML/AI engineering experience" | check: 
- visa: no_sponsorship | "We are unable to sponsor or take over sponsorship of an employment Visa at this time" | check: 
- equity | "Competitive salary and equity package" | check: 
- k401 | "Company-sponsored 401k + matching (US Only)" | check: 

**20** · visa · `ashby:momentic:10d2e5d6-ebe1-43a6-b543-5131717f4ecd` · Growth Lead
- visa: no_sponsorship | "We cannot sponsor or transfer H-1B visas or green cards (I-140) at this time." | check: 
- k401 | "401(k)" | check: 

**21** · visa · `ashby:eleos:d9ba4f7e-fb9d-4f62-81bb-d26aac352cf1` · Research Scientist
- salary: 201634-428982 USD year ote=false | "We’re open to a wide variety of seniority levels for this role, with annual salary dependent on level ($201,634 to $428,982)." | check: 
- visa: sponsors | "This position is open to U.S. citizens, permanent residents, and individuals currently authorized to work in the U.S. We may be able to sponsor visas for this role, but it will depend on your particular situation." | check: 
- k401 | "401(k): Immediate vesting with 100% employer match up to 6% of salary" | check: 

**22** · visa · `ashby:nabla:14d4060f-a1cb-4633-a667-b08b8cb98b3c` · Enterprise Sales Director
- years: 5 required | heading: none | "Minimum 5 + years of selling experience as a full cycle Account Executive navigating US healthcare sales in a startup environment" | check: 
- visa: no_sponsorship | "Candidates must be currently authorized to work in the United States and must be able to maintain authorization to work in the United States without requiring employer sponsorship, now or in the future." | check: 

**23** · visa · `greenhouse:inversionspace:4621019005` · Senior TPS Design Engineer
- years: 5 required | heading: required | "Typically, 5+ years of professional experience working with, formulating, or producing materials for extreme temperature environments (Reentry, Rocketry, Hypersonics, Propulsion, Nuclear Power, etc.)." | check: 
- salary: 150000-210000 USD year ote=false | "The California annual base salary for this role is currently $150,000-$210,000." | check: 
- visa: citizens_only | "Must have the ability to obtain and maintain a U.S. government Secret/Top Secret security clearance." | check: 
- equity | "Individual pay will be determined on a case-by-case basis and may vary based on the following considerations: interviews and an assessment of several factors that are unique to each candidate, job-related skills, relevan…" | check: 

**24** · visa · `ashby:bevel:36ddb15e-5787-4b6c-a147-cd3829e6cfe8` · Senior iOS Engineer
- years: 4 required | heading: required | "4+ years building native iOS apps with Swift and SwiftUI" | check: 
- visa: sponsors | "Visa sponsorship if applicable" | check: 
- equity | "Competitive salary & equity" | check: 
- k401 | "401k plan" | check: 

**25** · visa · `ashby:solveintelligence:510cafb8-922a-45fd-8340-6aa89191ea47` · Account Executive/GTM
- visa: sponsors | "Support: Full visa sponsorship and private medical insurance." | check: 
- equity | "Equity: Meaningful ownership in a high-growth startup." | check: 

**26** · visa · `greenhouse:nuancelabs:4470870009` · Member of Technical Staff — Product Engineer
- salary: 200000-300000 USD year ote=false | "$200,000 – $300,000 base salary, plus meaningful equity." | check: 
- visa: sponsors | "Visa sponsorship: We sponsor visas (O-1, H-1B, green card, etc.) from day one." | check: 
- equity | "$200,000 – $300,000 base salary, plus meaningful equity." | check: 
- k401 | "401(k): 4% match (100% of 1st 3% + 50% of next 2% contributions)." | check: 

**27** · visa · `ashby:fuse:bac78943-8667-4650-a193-0005cd7841f5` · Cryogenic Systems Engineer
- years: 2 required | heading: required | "2+ years of hands-on experience designing, operating, or maintaining cryogenic systems at liquid-helium temperatures (4 K) in a research or industrial facility." | check: 
- visa: citizens_only | "To conform to U.S. Government technology export regulations, including the International Traffic in Arms Regulations (ITAR), you must be a U.S. citizen, lawful permanent resident of the U.S., protected individual as defi…" | check: 

**28** · visa · `lever:charmindustrial:bc5ca6b3-a7b0-415d-8b73-c18958ce84df` · Senior Mechanical Engineer, Pyrolysis
- equity | "Equity ownership through stock options" | check: 
- k401 | "Traditional and Roth 401(k) with a 50% match on contributions up to 6%" | check: 
- pending: years (5) | "Seasoned mechanical design experience (5-8 years)" | check: 
- pending: visa | "Visa Sponsorship Policy" | check: 
- pending: visa | "Since we are a small startup, certain accommodations for visa sponsorship may not be within our capability." | check: 

**29** · years · `lever:delfidiagnostics:b5a10e26-49f3-4bbe-b703-cbe032305283` · Clinical Laboratory Scientist - PM Shift (Contract)
- years: 2 required | heading: none | "2+ years of Clinical Laboratory experience or equivalent high complexity and volume laboratory experience" | check: 

**30** · years · `ashby:cambio:dfdb0559-954d-4539-a340-159957736ad3` · Senior Product Manager - Agentic Foundation
- equity | "Competitive compensation and startup equity" | check: 
- pending: years (5) | "5+ years of product management, including 2+ years shipping LLM-powered products to real customers." | check: 

**31** · years · `greenhouse:salesloft:8384845` · Head of Channel Sales & Alliances
- years: 12 required | heading: none | "12+ years of experience in partner sales, channel sales, alliances, or business development in B2B SaaS, with senior leadership experience managing teams" | check: 

**32** · years · `ashby:second-front-systems:4df6d490-238a-470a-834b-118ab3883203` · Solutions Engineer
- years: 3 required | heading: required | "3+ years in a technical customer-facing role — solutions engineering, sales engineering, solutions architecture, or technical pre-sales." | check: 

**33** · years · `ashby:cambly:7c5667aa-57e4-4312-bc9e-d969a7566259` · CRM Program Manager - UAE (contract - remote)
- years: 5 required | heading: required | "5+ years of experience in CRM, lifecycle, or retention marketing, ideally at a consumer subscription, mobile, or edtech company." | check: 

**34** · years · `lever:backerkit:5b2795ea-d464-4c45-ab2f-fe6bc441d8f1` · Staff Software Developer
- years: 10 required | heading: required | "Most successful candidates for this role have 10+ years of software development experience working on multiple complex software projects over time and 5+ years as a staff engineer, though we do not have a strict years-of…" | check: 

**35** · years · `ashby:cloaked:f749ab20-4fa2-45e8-8ef6-aba01f0a645e` · Analytics Engineer, Semantic Layer
- years: 3 required | heading: none | "3-5 years of experience in analytics engineering, BI engineering, or a closely related role" | check: 
- equity | "Your compensation will be a combination of salary, bonus and equity." | check: 
- k401 | "For full-time US employees, we offer a comprehensive benefits package: medical, dental and vision with Cloaked covering the majority of employee premiums, company-paid basic life, and a 401(k) with company match." | check: 

**36** · years · `ashby:airbyte:9af619c8-163a-4170-bac6-6ceee93558fe` · Enterprise Account Executive
- years: 3 required | heading: required | "3-5+ years of B2B sales experience within SaaS, cloud infrastructure, developer tools, or data technology, including at least 1-2+ years selling into enterprise accounts." | check: 

**37** · years · `greenhouse:collahealth:4303978009` · Licensed Behavioral Health Care Manager - Independent Contractor/Remote
- years: 5 required | heading: required | "5+ years of relevant experience in a behavioral health, healthcare, or oncology setting (preferred)" | check: 

**38** · years · `ashby:gigi:46e8dd52-6b56-4e14-9980-ed74058c9c2c` · AI Engineer
- pending: years (15) | "Our founding team has spent 15+ years building in Amazon Ads and ecommerce, including a prior $100M+ exit." | check: 

**39** · years · `greenhouse:project44:8348941` · Manager, Managed Services
- years: 8 required | heading: required | "8+ years of experience in data analysis, operations, consulting or account management, including at least two years leading or managing a team." | check: 

**40** · years · `ashby:vital-lyfe:ae222b6b-51f5-4d95-9493-9809f14fb466` · Inventory Specialist
- years: 1 required | heading: required | "1+ years of inventory control experience" | check: 
- equity | "Competitive Equity" | check: 
- k401 | "401k option (the company does not currently offer matching)" | check: 

## New-grad set: 40 postings (the rules WERE tuned on these; not a held-out measure)

**1** · hn · `50340113` · Charly | Sales / Account Executive GovTech | ONSITE Berlin, 
- none | check: 

**2** · hn · `50339294` · SwingVision | Berkeley, CA | Full time + Internships SwingVi
- none | check: 

**3** · hn · `50341895` · Odoo | Software Developer (Python / JavaScript) | Grand-Rosi
- none | check: 

**4** · hn · `50339641` · CNH | AI Engineer Intern | Tempe, AZ, USA | ON-SITE | Summer
- visa: no_sponsorship | "Visa sponsorship is not available." | check: 

**5** · hn · `50013152` · vvd | Worldbuilding and storytelling platform (Remote / EU/N
- none | check: 

**6** · hn · `50349005` · Diffusion | All | SF Bay (Redwood City) | On site (office!),
- none | check: 

**7** · hn · `50342996` · Datadog | Software Engineers | ONSITE (Boston, Lisbon, Madri
- none | check: 

**8** · hn · `49962002` · SingleStore | Software Engineer, AI Platform | Full Time, Re
- none | check: 

**9** · hn · `50339013` · MixRank (YC S11) | Software Engineers | 100% Remote (Global)
- years: 0 required | heading: none | "Remote (Global), Full-Time We’re looking for remote junior engineers with 0–3 years of professional software experience and 5+ years of curiosity exploring computers, programming, and technical hobby projects." | check: 
- pending: years (5) | "Remote (Global), Full-Time We’re looking for remote junior engineers with 0–3 years of professional software experience and 5+ years of curiosity exploring computers, programming, and technical hobby projects." | check: 

**10** · hn · `50000038` · Superset (YC P26) | Founding Engineer, Founding Design Engin
- salary: 175000-225000 USD year ote=false | "$175K-$225K + 1.0-1.5% equity" | check: 
- equity | "$175K-$225K + 1.0-1.5% equity" | check: 

**11** · hn · `50356544` · Solution Street | Northern Virginia / Washington DC Metro Ar
- none | check: 

**12** · hn · `50339551` · Juro | AI Engineer (Agentic team) | London, UK | REMOTE (UK)
- salary: 115000-115000 GBP year ote=false | "£115k + equity Juro is an AI contract automation platform used by in-house legal and business teams." | check: 
- visa: sponsors | "For exceptional candidates we can sponsor a UK Skilled Worker visa, whether you're relocating or already in the UK." | check: 
- equity | "£115k + equity Juro is an AI contract automation platform used by in-house legal and business teams." | check: 

**13** · hn · `50342626` · CreativeLens | Founding Growth & Sales Lead | Remote (US) | 
- equity | "Compensation: base salary + commission + equity." | check: 

**14** · hn · `49923870` · Brilliant.org | Senior/Staff Software Engineer (Interactives
- salary: 180000-250000 USD year ote=false | "$180k-$250k" | check: 

**15** · hn · `49964254` · Greenzie | Robotics Software Engineer (Experienced, 3–6 yrs)
- pending: years (3) | "Robotics Software Engineer (Experienced, 3–6 yrs)" | check: 

**16** · hn · `49937360` · Software Engineer — Remote — US Only Kaveronix is looking fo
- years: 4 required | heading: none | "What we’re looking for: 4+ years of professional software engineering experience" | check: 
- salary: 80000-100000 USD year ote=false | "Compensation: $80,000–$100,000/year, depending on experience." | check: 

**17** · hn · `50340419` · Paramark | Software Engineer (L4) | San Francisco HYBRID (3 
- salary: 199000-249000 USD year ote=false | "$199K–$249K + equity Paramark helps Marketing teams optimize spend across all of their channels and programs." | check: 
- equity | "$199K–$249K + equity Paramark helps Marketing teams optimize spend across all of their channels and programs." | check: 
- pending: years (8) | "Looking for 8+ years, full-stack." | check: 

**18** · hn · `49923640` · Beacon AI | 3 days hybrid in San Carlos, CA | https://beacon
- years: 5 required | heading: none | "We’re hiring Senior/Lead Engineers with 5+ YOE who love solving complex problems." | check: 
- visa: citizens_only | "https://beaconai.co/careers Due to U.S. export control regulations, we can only hire U.S. Persons (U.S. citizens, Green Card holders, lawful permanent residents, or individuals granted asylum or refugee status)." | check: 

**19** · hn · `49922899` · Mainmatter ( https://mainmatter.com/rust-consulting/ ) | REM
- years: 10 preferred | heading: none | "Excellent engineering skills, ideally 10+ years of professional experience" | check: 
- salary: 100000-140000 EUR year ote=false | "100–140k€ Mainmatter ( https://mainmatter.com ), the company behind EuroRust ( https://eurorust.eu ), is looking for an exceptional Rust engineering consultant to lead our team." | check: 

**20** · hn · `50339514` · Mastra | Founding Sales (Founding AE) | US Remote | Full-tim
- none | check: 

**21** · ats · `ashby:encord:fa922dac-6219-4379-be99-29c8ea59b813` · Commercial Associate
- years: 1 required | heading: required | "1–3 years of professional experience in a commercial, customer-facing, or high-performance role" | check: 
- equity | "Competitive salary, commission, and meaningful equity in a high-growth startup" | check: 

**22** · ats · `ashby:ramp:b39ceb08-a0a7-4f8b-a760-2fb88e209956` · Applied Scientist Intern
- k401 | "401(k), including employer match on contributions made while employed by Ramp" | check: 

**23** · ats · `ashby:flip:6672112f-096c-4e85-a1c9-abfcedf0d666` · Customer Success Intern (m/f/d)
- none | check: 

**24** · ats · `ashby:clearco:1caf6e10-704c-4480-94f1-df72f83fe42f` · Associate, FP&A
- years: 2 required | heading: none | "2-4 years of experience in FP&A, corporate finance, investment banking or public accounting, ideally at a lender or fintech" | check: 
- salary: 105000-115000 USD year ote=false | "Compensation Range: $105K–115$K" | check: 

**25** · ats · `ashby:pivotrobotics:5b7e7074-aace-4b9a-9db8-245c8ad66a69` · Robot Operator Internship (Part-Time)
- none | check: 

**26** · ats · `ashby:swarmaero:31565a0a-c55e-4d70-832d-8a4b5e5528ad` · Composite Engineering (M&P) Intern (Summer 2027)
- visa: citizens_only | "ITAR requirement" | check: 
- equity | "Meaningful equity in a high-growth defense technology company" | check: 
- k401 | "Medical, dental, vision, and 401k" | check: 

**27** · ats · `lever:waabi:480d9d41-33d0-429a-8883-7f9ec305a30f` · Safety Methodologies Internship/Co-op 2027
- salary: 40-52 USD hour ote=false | "The US hourly range for this role is: $40-$52 USD and the Canada hourly range for this role is: $41-$53 CAD in addition to competitive perks & benefits." | check: 

**28** · ats · `greenhouse:earli:4538764004` · Earli Talent Community
- none | check: 

**29** · ats · `ashby:runlayer:53cb00c4-9ff5-44fa-9631-154988894834` · Deployment Strategist
- years: 5 required | heading: required | "5+ years in a customer-facing technical role: Deployment Strategist, Technical Account Manager, Customer Success Engineer, Solutions Architect, professional services, or technology consulting" | check: 
- equity | "Competitive salary and equity — compensation that reflects your expertise and customer-facing responsibilities." | check: 

**30** · ats · `greenhouse:nex:5457814008` · Fitness Instructor, Digital Content
- salary: 35-35 USD hour ote=false | "Compensation: $35/hour, 20hr/week" | check: 

**31** · ats · `ashby:pocket:d4f2f5e9-d96b-489d-a641-227169d5b321` · Founding Account Executive
- years: 1 required | heading: required | "1+ years selling B2B software or hardware" | check: 
- equity | "Competitive base, commission on what you close, and equity" | check: 

**32** · ats · `greenhouse:oklo:6227574004` · Process Engineer
- salary: 80000-155000 USD year ote=false | "Salary: $80,000-$155,000" | check: 
- equity | "Oklo offers flexible time off, equity, competitive pay, 401k, health insurance, FSA, flexible work hours, and other benefits." | check: 
- k401 | "Oklo offers flexible time off, equity, competitive pay, 401k, health insurance, FSA, flexible work hours, and other benefits." | check: 

**33** · ats · `ashby:vectorsolutions:c2386911-c422-4500-b60b-d4fb82ca5e6a` · Commissions Operations Analyst
- years: 2 required | heading: required | "2–4 years of experience in commission operations, sales operations, revenue operations, finance, or a related field." | check: 
- k401 | "Matching 401(k) retirement plan" | check: 

**34** · ats · `ashby:engram:7862c3bb-3447-4e48-bdb1-2d3e97964c14` · Product Engineer
- none | check: 

**35** · ats · `ashby:sketchpro:303d4546-efcb-4d88-b43d-a6dd3205049a` · Member of Technical Staff (MTS)
- salary: 180000-300000 USD year ote=false | "Competitive compensation ($180k–$300k salary + competitive equity)" | check: 
- equity | "Competitive compensation ($180k–$300k salary + competitive equity)" | check: 

**36** · ats · `lever:velo3d:5cf23f51-bd8f-49a5-9548-74ab69d09381` · Business Development Account Manager (Northwest)
- salary: 120000-150000 USD year ote=false | "The starting base salary for this full-time position is between $120,000 and $150,000." | check: 
- visa: citizens_only | "Required: US Citizen or a Green Card holder (mandatory for ITAR)" | check: 
- equity | "In addition to a competitive base salary and a comprehensive benefits package, this position may be eligible for other forms of compensation such as participation in a bonus and equity program, as applicable." | check: 
- k401 | "Our team enjoys excellent benefits including healthcare coverage and 401(K) employer contributions." | check: 

**37** · ats · `ashby:primeintellect:297d925e-5a42-40bd-b02f-5c928d226f18` · Member of Technical Staff - GPU Infrastructure
- years: 3 required | heading: required | "3+ years hands-on experience with GPU clusters and HPC environments" | check: 
- salary: 150000-300000 USD year ote=false | "Cash compensation of $150-300k with significant equity incentives" | check: 
- visa: sponsors | "Full visa sponsorship and relocation support" | check: 
- equity | "Cash compensation of $150-300k with significant equity incentives" | check: 

**38** · ats · `greenhouse:andesite:5226868007` · Regional Sales Manager, Commercial
- years: 10 required | heading: required | "10+ years of quota-carrying sales experience, ideally in cybersecurity, SaaS, or AI/ML solutions, with a track record of closing complex, high-value deals" | check: 
- salary: 175000-200000 USD year ote=false | "The base salary range for this role is $175,000–$200,000, with on-target earnings (OTE) of $350,000–$400,000 at a 50/50 base/commission split." | check: 
- equity | "This role is also eligible for our equity program." | check: 

**39** · ats · `greenhouse:bitmovin:8729522002` · Customer Technical Account Manager – OTT Cloud Streaming
- none | check: 

**40** · ats · `greenhouse:nabis:5921161004` · Senior Operations Manager
- years: 4 required | heading: required | "4+ years of experience within a warehouse or logistics setting" | check: 
- salary: 110000-110000 USD year ote=false | "Salary $110k depending on experience along with 401k" | check: 
- k401 | "Salary $110k depending on experience along with 401k" | check: 
