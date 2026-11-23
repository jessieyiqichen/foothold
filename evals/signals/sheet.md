# Signals hand check

Rules version 1, written by `run.ts`. One block per posting: n · stratum · id · title, then one line per signal (quotes cut at 220 characters here only). Fill `check:` with ok, or what is wrong. `heading` is the section the rules put the sentence in. This is a hand check of precision, not the user's labels.

Quotes not found word for word in their text: 0.

## Sample: sample.json, 120 job board postings (held out only if no rules version was tuned on this file)

**1** · years · `ashby:butter:c1b006a4-b447-40ef-b4eb-3e9c4043d33f` · Head of Content and Media
- years: 4 required | heading: required | "4+ years building content, media, or creator programs, ideally with at least one built from scratch" | check: 

**2** · years · `lever:zoox:a3f526bf-2417-4596-be1f-479c5c079367` · Team Lead, Ground Operations (3rd Shift)
- years: 5 required | heading: required | "5+ years of hands-on automotive technician experience combined with 2+ years of people leadership or supervisory experience." | check: 

**3** · years · `ashby:chalk:a953ba3c-9448-4adb-be09-bfe8acab5b03` · Full Stack Software Engineer
- years: 4 required | heading: required | "4+ years experience of professional software engineering experience" | check: 

**4** · years · `ashby:blacksmith:604cabdf-a54d-4dba-8dee-904e88ed5f16` · Senior Product Engineer
- equity | "Competitive base + equity." | check: 
- k401 | "401K match." | check: 
- pending: years (5) | "Have 5+ years of software development experience." | check: 

**5** · years · `ashby:assembly:3d04eed3-211a-483b-aaee-a73b98147a18` · Senior Software Engineer
- years: 4 required | heading: required | "You have 4+ years experience working on complex web applications built with modern tools and a proven track record as a lead developer." | check: 

**6** · years · `ashby:homebase:6e96fb1a-a027-4c82-9f61-91e7bcff9990` · Payroll Tax Specialist
- years: 2 required | heading: none | "2 to 3 years of experience in payroll, payroll tax, accounting operations, or a related field, ideally at a payroll provider or payroll SaaS company." | check: 

**7** · years · `ashby:pramaana-labs:c27f2903-133c-4f4e-8c44-b302223ff23d` · Software Engineer, Full-Stack ML Infrastructure
- years: 2 required | heading: none | "Minimum 2-3 years of software engineering experience, including hands-on work with backend services, full-stack applications, internal tools, or deployment automation." | check: 

**8** · years · `greenhouse:stripe:8077887` · Account Executive, Bridge
- years: 5 preferred | heading: required | "-5–8 years of full sales cycle or account management experience focused on existing business accounts; experience managing a large book of accounts or high-velocity portfolio strongly preferred." | check: 

**9** · years · `ashby:bedrock-robotics:22125105-f0bc-40a7-82d1-ece20225e2fe` · Recruiting Coordinator (6-Month Contract)
- years: 2 required | heading: required | "2+ years of experience in recruiting coordination, scheduling, or a similar operations role" | check: 

**10** · years · `ashby:restream:13b5f9b8-edc2-43bd-8afa-2afc10662cf8` · Senior Product Manager - Studio Team
- years: 5 required | heading: required | "5+ years of Product management or product design experience in a SaaS company" | check: 
- equity | "Equity packages for you to truly be a part of the Restream journey" | check: 

**11** · years · `lever:people-ai:7d6f849a-b035-4ed0-997a-55764f5b277b` · Director, Customer Success
- years: 5 required | heading: required | "12+ years in Customer Success, Account Management or post-sales leadership, including 5+ years leading teams and developing managers" | check: 
- equity | "Regular employees may be eligible for commissions or bonus programs (target included in OTE), equity, and benefits." | check: 

**12** · years · `ashby:choco:963a72fb-75ec-42aa-9dad-8a0d11434cad` · Customer Care Associate
- years: 1 required | heading: required | "1+ years of experience in customer support or operations in fast-paced, tech-enabled environments, with a track record of owning outcomes" | check: 
- equity | "In return, you get real ownership, equity, and the support to do your best work, including competitive compensation, health and wellbeing support, and long-term benefits like a sabbatical (all localized by office)." | check: 

**13** · years · `ashby:eightsleep:e9a84433-b292-497e-ad33-15da82056af5` · Senior Backend Engineer (Milan)
- years: 8 required | heading: required | "8+ years of software engineering experience" | check: 
- equity | "We extend equity participation to every full-time team member, recognizing and rewarding your direct contributions to our success." | check: 

**14** · years · `greenhouse:scaleai:4750929005` · Quality Operations Lead, Gen AI
- equity | "Compensation packages at Scale for eligible roles include base salary, equity, and benefits." | check: 
- pending: years (3) | "3+ years leading teams or scaling large operational/technical processes." | check: 

**15** · years · `ashby:rezi:9eede64d-8881-4c0d-b2bf-5772ae17634c` · Product Designer
- pending: years (3) | "Our user base has grown to nearly a million users in just three years, and we are proud to have helped countless individuals successfully land their dream job." | check: 
- pending: years (3) | "3-5+ years of experience as a product designer on SaaS products with a heavy focus on workflows and complex data." | check: 

**16** · years · `ashby:fin:b03c3817-f1a7-421f-bf99-465a517e0697` · Risk Analyst
- years: 5 required | heading: required | "5+ years of experience in fraud analysis, risk management, or financial crime prevention, ideally within fintech, digital assets, or blockchain environments." | check: 

**17** · years · `ashby:float:0accef50-dcbc-4826-8da7-9d60cffb5dc7` · Content Marketing Manager
- years: 5 required | heading: required | "Around 5 years of experience in content marketing, video production, or social content, ideally in B2B SaaS." | check: 

**18** · years · `lever:revinate:b991a6ee-bd7f-4536-9366-66fcd96bf8b6` · GTM Enablement Specialist
- years: 1 required | heading: required | "1-3+ Years of relevant experience" | check: 
- pending: years (17) | "Behind it all, Ivy, our AI intelligence layer trained on 17 years of hospitality data, reads the patterns and handles the digital labor." | check: 

**19** · years · `ashby:maven-agi:b1800a12-714f-4ed1-ae6c-9b7d81183889` · Sales Development Representative - San Francisco
- years: 1 required | heading: required | "1–3 years of experience in an SDR, BDR, or similar sales role, preferably in a SaaS or technology environment." | check: 
- equity | "Competitive salary, comprehensive benefits, and meaningful equity." | check: 
- pending: years (3) | "~130 people, built from zero in under three years — small enough that your work is visible, big enough to already be running at Dell- and Tripadvisor-scale." | check: 

**20** · years · `ashby:agentmail:d5f93429-e6c2-4d0c-8b73-a64847a561bb` · Developer Success Engineer
- years: 2 required | heading: none | "You have 2-6 years of experience in technical support, developer experience, solutions engineering, or engineering, ideally working with a developer-facing or API-first product." | check: 

**21** · years · `lever:mindtickle:d22d1e61-9a11-4e19-ae78-2f170efbb0c2` · Senior Product Designer
- years: 5 required | heading: required | "5+ years designing complex products, mostly in B2B SaaS." | check: 

**22** · years · `ashby:golinks:912c27e4-b5b7-4169-bc4f-d4fa892ff179` · Head of Customer Success
- years: 2 required | heading: required | "7+ years in Customer Success, Account Management, or a related customer-facing role at a B2B SaaS company, including 2+ years in a leadership role" | check: 
- k401 | "401(k) retirement plan to save for your future" | check: 
- pending: years (7) | "7+ years in Customer Success, Account Management, or a related customer-facing role at a B2B SaaS company, including 2+ years in a leadership role" | check: 

**23** · years · `ashby:weave:5000eb6e-ef0f-4840-af5f-55a8043d5ff6` · Senior Product Designer, User Infrastructure
- years: 5 required | heading: none | "You have 5+ years designing software products, including meaningful time on B2B or platform surfaces such as admin, settings, identity, or permissions." | check: 

**24** · years · `greenhouse:torq:6256273004` · Solution Engineer, Spain
- years: 5 required | heading: required | "At least 5+ years of experience in pre-sales engineering/solutions engineering working with a SaaS Cloud Security product" | check: 

**25** · years · `ashby:academia:479f56f4-d2fc-4732-b02b-75ae81625e16` · Publishing Manager (Clinical Sciences)
- years: 5 required | heading: required | "5 years relevant editorial experience + Bachelor’s degree or 3 years relevant editorial experience + Master’s or Doctoral degree." | check: 

**26** · years · `ashby:bernard:ddbcb0e8-40c3-47b1-9bcb-d0a4dacf1e71` · Product Engineer
- years: 2 required | heading: none | "You have 2+ years of professional software engineering experience." | check: 

**27** · years · `greenhouse:ultimagenomics:6199198004` · Technician II, Surface Chemistry
- years: 3 required | heading: required | "3+ years of relevant work experience." | check: 
- salary: 26-26 USD hour ote=false | "This contracting position offers an hourly pay rate between $26/hour and $29/hour, and your actual base pay will depend on your skills, qualifications, experience, and location." | check: 

**28** · years · `ashby:nest-health:aae54c45-a495-4802-9b00-74326a8e3cc7` · Medical Assistant & Family Advocate (Field)- Charlotte NC
- years: 1 required | heading: none | "High School Diploma or equivalent required: 1-3 years of relevant experience" | check: 

**29** · years · `ashby:mednet:78881fba-aef6-45ca-88b1-5a23035024b4` · Client Solutions Analyst
- years: 1 required | heading: none | "We’re looking for someone with 1+ years of market research or life-sciences experience who is proactive, completes tasks with efficiency and attention to detail, and is passionate about improving health-education and equ…" | check: 
- equity | "We’re looking for someone with 1+ years of market research or life-sciences experience who is proactive, completes tasks with efficiency and attention to detail, and is passionate about improving health-education and equ…" | check: 

**30** · years · `ashby:alta:96257b67-9a3e-4d22-acf8-496a805113d5` · Senior Regulatory Counsel
- years: 8 required | heading: required | "U.S.-Qualified lawyer with 8 years of relevant post-qualification experience." | check: 

**31** · years · `ashby:sekai:655d5942-2f0c-4ce6-83df-8e8184222672` · Technical Lead
- years: 5 required | heading: required | "5+ years of professional software engineering experience" | check: 
- equity | "Top compensation package, including competitive salary and meaningful equity" | check: 

**32** · years · `ashby:goteleport:b45364ed-e5c0-4cfb-9eb2-3a2243bc0cf9` · Mid-Market Account Executive - NYC based
- years: 1 required | heading: required | "1+ year experience working at a growing start up selling to scaling AI, fintech or e-commerce companies" | check: 
- pending: years (3) | "3+ years of quota attainment at a software startup in the infrastructure, security, open source space" | check: 

**33** · years · `greenhouse:array:5189858004` · Executive Assistant
- years: 1 required | heading: required | "1+ years of relevant experience supporting C-suite individuals" | check: 
- salary: 75000+ USD year ote=false | "Pay Transparency: $75,000+ base salary, depending on experience" | check: 
- k401 | "100% 401k match up to 4% with immediate vesting" | check: 

**34** · years · `ashby:luminai:e8189a27-372a-4123-a7ee-aec9601b0953` · Marketing Lead
- years: 5 required | heading: required | "5–8+ years of experience in Product Marketing, Product, Solutions, or a similarly technical GTM role at a B2B SaaS company" | check: 

**35** · years · `ashby:confido:6e113ece-7858-4429-8f2a-89b8b0f03271` · Solution Consultant
- years: 3 required | heading: required | "3+ years of experience managing enterprise software implementations, system deployments, or complex client onboarding — backgrounds in B2B SaaS, management consulting, CPG, systems integration, or similar are all welcome" | check: 
- equity | "Equity — own a meaningful piece of the company you’re helping build" | check: 
- k401 | "401(k) through Vestwell" | check: 

**36** · visa · `ashby:osmo:b54db0e5-b403-4b22-be57-d0bc91440694` · QC Technician, Fragrance
- visa: sponsors | "Each posting states whether visa sponsorship for employment is available for that role." | check: 
- equity | "Competitive salary and meaningful equity in a high-growth company" | check: 
- k401 | "401(k) savings plan and employer match" | check: 

**37** · visa · `ashby:aslan:5cbe959b-0026-46b2-b489-bf00f9b3a698` · Evals Lead
- visa: citizens_only | "Eligible for a US security clearance" | check: 

**38** · visa · `ashby:conductorai:9033a187-9713-44ea-aaa2-efad092673c2` · Forward Deployed Software Engineer
- years: 2 required | heading: required | "2+ years of professional software engineering or forward deployed engineering experience" | check: 
- salary: 150000-220000 USD year ote=false | "The base salary range for this role is $150,000-220,000, with the opportunity for meaningful equity commensurate with a Series A stage opportunity." | check: 
- visa: citizens_only | "Active DoD Top Secret/SCI clearance required at time of hire; required due to the classified nature of work performed under US government contracts" | check: 
- equity | "Competitive salary and equity upside with annual merit refreshes based on impact" | check: 

**39** · visa · `greenhouse:contentful:8241814` · Mid Market Account Executive
- years: 4 required | heading: required | "4+ years of B2B SaaS sales experience - a minimum of 2 years in a closing role, with individual quota carrying experience and a history of exceeding quota" | check: 
- salary: 50000-500000 USD year ote=false | "Position, negotiate, and close new logo and expansion business ($50-$500K ACV) in the North American territory" | check: 
- visa: no_sponsorship | "This position is not eligible for visa sponsorship." | check: 
- equity | "The range represents base salary only, and does not include company bonus, incentive for sales roles, equity or benefits, as applicable." | check: 

**40** · visa · `ashby:swarmaero:2535ae5d-714a-4e65-bda6-0a86dd3af565` · Product Designer
- visa: citizens_only | "ITAR requirement" | check: 
- equity | "Meaningful equity in a high-growth defense technology company" | check: 
- k401 | "Medical, dental, vision, and 401k" | check: 

**41** · visa · `ashby:rivet:112c8467-8622-4a70-a09a-d658e5b41699` · Senior Software Engineer, SLAM/VIO
- years: 10 required | heading: required | "BS with 10+ years of academic or industry experience in inertial sensing, computer vision, robotics or related fields with shipped or published work (or MS with 8+ yrs of the above)" | check: 
- visa: citizens_only | "Upon hire, you will be required to provide documentation verifying your status as a U.S. Citizen, a lawful permanent resident, or a protected individual under 8 U.S.C. 1324b(a)(3)." | check: 
- equity | "In addition to base salary, this role may be eligible for equity and other forms of compensation." | check: 

**42** · visa · `greenhouse:outrider:5218366008` · Principal Engineer, Embedded, Sensors, and Safety Software
- salary: 165000-190000 USD year ote=false | "Salary range of $165,000 - $190,000." | check: 
- visa: no_sponsorship | "Please note: At this time, we are only hiring candidates who are currently authorized to work in the United States and reside within the U.S. We are unable to provide visa sponsorship or support international employment …" | check: 
- equity | "In addition to a base salary, this role is also eligible for benefits, and equity bonus." | check: 
- k401 | "401(K) Retirement" | check: 

**43** · visa · `greenhouse:roofstock:8950775002` · Cash Accountant
- years: 2 required | heading: required | "2+ years of accounting experience with bank reconciliations, ideally in real estate or property management" | check: 
- salary: 60000-70000 USD year ote=false | "$60,000 to $70,000 range on annual base salary." | check: 
- visa: no_sponsorship | "Must be authorized to work in the U.S. is a precondition of employment and we are unable to sponsor H1-B Visas at this time." | check: 
- k401 | "401k Program" | check: 

**44** · visa · `ashby:substrate:6e8771ea-e475-493c-921c-1448520bddd5` · Research Scientist, AI
- years: 5 required | heading: required | "5+ years professional or academic research experience in physical sciences, engineering, or related field" | check: 
- salary: 150000-275000 USD year ote=false | "$150,000-$275,000 USD" | check: 
- visa: no_sponsorship | "This position is not eligible for visa sponsorship." | check: 

**45** · visa · `ashby:dmodel:b325d0db-a690-4965-ae0a-26692d5b4dc4` · Member of Technical Staff, Generalist - Supercompute
- visa: sponsors | "Visa sponsorship: We sponsor visas." | check: 
- equity | "Compensation: We offer a competitive salary: $200-300,000 salary + equity + bonus + benefits)" | check: 
- k401 | "401(k) with automatic enrollment" | check: 

**46** · visa · `greenhouse:newrelic:5232041008` · Senior Account Executive - Enterprise Sales (Japan)(担当領域：小売・卸売業(中間流通業)・不動産・運輸)
- visa: no_sponsorship | "Please note that visa sponsorship is not available for this position." | check: 

**47** · visa · `greenhouse:albedo:4514680009` · Flight Software Engineer
- salary: 116000-135000 USD year ote=false | "$116,000 - $135,000 a year" | check: 
- visa: citizens_only | "All persons hired will be required to be a U.S. citizen, a lawful permanent resident of the U.S., or a protected individual as defined by 8 U.S.C. 1324b(a)(3), or eligible to obtain the required authorizations from the U…" | check: 
- equity | "Employee friendly equity compensation" | check: 
- k401 | "4% direct matching 401k" | check: 

**48** · visa · `ashby:tracebit:2de3cc9e-4c4c-4efd-b1b0-a8ededc1814e` · Founding Engineer
- pending: years (7) | "Has spent 7+ years shipping software at some degree of scale and/or criticality." | check: 

**49** · visa · `ashby:promise:ac00e00f-0be5-40d4-9641-09fb8afd92a4` · Deployment Strategist
- pending: years (3) | "3-10 years in a role where you actually drove outcomes, not just managed process." | check: 

**50** · visa · `ashby:thundercompute:2efae53b-817c-43e7-9da3-72694813f608` · Software Engineer (C++ Systems)
- salary: 250000-325000 USD year ote=false | "Compensation: $250–325K base, 0.1–0.3% equity, profit-sharing bonus pool (founders excluded)." | check: 
- visa: sponsors | "Visa sponsorship and relocation available." | check: 
- equity | "Compensation: $250–325K base, 0.1–0.3% equity, profit-sharing bonus pool (founders excluded)." | check: 
- k401 | "401(k)." | check: 

**51** · visa · `greenhouse:sixfold:5225695008` · Senior Data Engineer
- years: 7 required | heading: required | "You have a bachelor's degree in Computer Science, Engineering, or a related field, and 7+ years of data engineering experience, including senior or lead scope with real architectural ownership." | check: 
- salary: 155000-195000 USD year ote=false | "Expected salary: $155,000 - $195,000 + equity + benefits." | check: 
- visa: no_sponsorship | "This position does not include visa sponsorship" | check: 
- equity | "Expected salary: $155,000 - $195,000 + equity + benefits." | check: 
- k401 | "Comprehensive benefits, 401(k) with employer match, parental leave, unlimited PTO, and your birthday off!" | check: 

**52** · visa · `ashby:dualentry:eeff6ed2-e284-4ff7-a939-ab5436e1dfe5` · Partner Development Manager
- salary: 40000-50000 USD year ote=false | "Equity: $40,000 - $50,000 USD" | check: 
- equity | "Significant equity ownership in one of the top AI companies in the world" | check: 
- k401 | "401(k) benefits" | check: 

**53** · visa · `ashby:realmalliance:49e73299-7e87-433a-b36c-da44da6cf184` · Deployment Lead
- years: 3 required | heading: required | "3–5 years in a customer-facing technical role (deployment, forward deployed, solutions engineering, TPM or product) where you owned outcomes, not only tasks" | check: 
- equity | "Competitive compensation with significant equity upside" | check: 
- k401 | "💰401(k) with 4% safe-harbor match" | check: 

**54** · visa · `greenhouse:exiger:6150400004` · Tech Lead/Principal Engineer, Public Sector
- years: 5 preferred | heading: required | "5+ years of production database engineering at scale on at least one major relational engine (PostgreSQL preferred; Aurora, MySQL, or Oracle at depth also acceptable)." | check: 
- visa: citizens_only | "Ability to obtain and maintain a U.S. Government security clearance." | check: 

**55** · visa · `ashby:david-ai:76754f39-fb37-4d28-a15c-e8aecd257544` · Research Scientist
- k401 | "401k access." | check: 
- pending: years (5) | "5+ years of professional audio ML experience, including DSP and ML audio algorithm development." | check: 
- pending: visa | "We sponsor international candidates across several visa types, including H-1B transfers, H-1B1, O-1, E-3, and TN." | check: 
- pending: visa | "While we can’t guarantee any individual outcome, we’ve successfully sponsored teammates from all over the world." | check: 

**56** · visa · `ashby:sygaldry-technologies:a6bcb0d5-732f-452f-8ac8-37a5bcbb2311` · Applied AI Scientist (Senior/Principal)
- visa: sponsors | "Visa Sponsorship" | check: 
- equity | "We value your contribution and invest in your future with a competitive salary and meaningful equity." | check: 

**57** · visa · `ashby:limbic:96f48a72-7262-46c5-a378-8ac5c7e5a359` · Senior AI/ML Engineer
- years: 4 required | heading: required | "OR A BSc/MSc, plus 4 years of experience in an ML engineering role." | check: 
- salary: 173000-192000 CAD year ote=false | "Salary: CA$173,000 – CA$192,000 per year." | check: 
- visa: no_sponsorship | "Please note: Limbic cannot provide visa sponsorship in Canada." | check: 
- equity | "Equity share options." | check: 

**58** · visa · `ashby:parallel:232f6cb3-6ba5-4bc0-85b4-c2516e83572e` · Marketing Ops
- visa: sponsors | "Visa sponsorships" | check: 
- equity | "Generous equity" | check: 
- k401 | "401K plans" | check: 

**59** · visa · `ashby:hypercubic:497e109c-23cb-4d9a-a00c-14d0ebb86684` · Founding Software Engineer - Backend
- equity | "Founding-team level equity," | check: 
- k401 | "Retirement Plan (e.g., 401K)" | check: 
- pending: visa | "Sponsorship: Unfortunately, we are unable to sponsor new H1B employment visas at this time." | check: 
- pending: visa | "However, we can support H1B transfers and OPT." | check: 

**60** · visa · `greenhouse:shift5:6218489004` · Principal Platform Engineer
- years: 10 required | heading: required | "10+ years in software/platform engineering, with 5+ years managing production infrastructure at scale." | check: 
- salary: 255000-280000 USD year ote=false | "Base Salary: $255,000 - $280,000" | check: 
- visa: citizens_only | "Clearance: Ability to obtain and maintain a U.S. Security Clearance (U.S. Citizenship required)." | check: 
- equity | "Bonus program and equity in a fast-growing startup" | check: 

**61** · salary · `ashby:avoca:51481d40-e339-47de-9d6d-4927397b41bb` · Implementation Manager
- years: 4 required | heading: required | "2-5 years working at B2B startups in software implementation, technical account management, solutions architecture, or technical customer success, or more than 4 years of overall experience." | check: 
- salary: 130000-170000 USD year ote=false | "Compensation: The expected base salary for this role is $130,000-$170,000 with final compensation based on experience, skills, and qualifications determined during the interview process." | check: 
- equity | "Avoca’s total compensation package includes base salary, bonus, equity, and a comprehensive suite of benefits and perks." | check: 
- k401 | "Company-sponsored 401(k) through Vestwell" | check: 

**62** · salary · `greenhouse:amaehealth:4453701009` · Mental Health Therapist
- years: 1 required | heading: none | "Experience and interest in working with adults and at least 1 year of experience working with patients with severe mental illness" | check: 
- salary: 75000-90000 USD year ote=false | "Associate level: $75,000–$90,000, based on hours" | check: 

**63** · salary · `ashby:snapdocs:93729a51-6026-4eea-8a62-514d19ea651b` · Principal Product Manager
- salary: 196000-245000 USD year ote=false | "Zone 1 (San Francisco Bay Area, Seattle Metro, New York City): $196,000 - $245,000" | check: 
- equity | "This position includes meaningful equity and a comprehensive benefits package." | check: 
- k401 | "401(k) with up to 4% company match" | check: 

**64** · salary · `ashby:atumworks:6bd10f36-1b5e-4a5e-9d96-0c24b2c8332e` · Founding Head of Talent
- salary: 200000-300000 USD year ote=false | "Compensation: $200K–$300K depending on experience, plus generous early-employee equity." | check: 
- equity | "Compensation: $200K–$300K depending on experience, plus generous early-employee equity." | check: 
- k401 | "Generous beneﬁts, including medical, dental, vision, and 401(k)." | check: 

**65** · salary · `lever:kpler:baa763a0-0bce-4240-ad4f-554f1741481e` · Account Executive - Maritime/ Shipping & Logistics (New Business)
- pending: years (3) | "3+ years in new business SaaS sales with verifiable track record" | check: 
- pending: years (3) | "85%+ quota attainment for each of the last 3 years" | check: 

**66** · salary · `ashby:hellopatient:1bf9dae7-5c92-4d96-bde5-febf111af791` · Strategic Account Manager
- salary: 90000-135000 USD year ote=false | "Base salary: $90,000 – $135,000" | check: 
- equity | "Equity: Meaningful ownership in a fast-growing healthtech startup" | check: 
- pending: years (3) | "3+ years in account management, customer success or a similar client-facing role." | check: 
- pending: years (3) | "Our founding team spent 3.5 years scaling Carbon Health's technology during hypergrowth, where we saw firsthand how much clinical time gets wasted on basic communication—great clinicians buried in admin work, patients st…" | check: 

**67** · salary · `ashby:nollahealth:ca4faa24-beaa-46b6-b86e-042342c59434` · Research Engineer, Evals & RL Environments
- years: 2 required | heading: required | "We expect many candidates to have roughly two to six years of relevant experience, but we’re flexible for someone with exceptional work." | check: 
- salary: 180000-240000 USD year ote=false | "Salary: $180,000–$240,000, based on experience" | check: 
- equity | "Equity: Meaningful equity, commensurate with experience" | check: 

**68** · salary · `ashby:lightdash:cf3ae3a8-9d45-4a2c-8e80-a00b9ae1d4ac` · Technical Account Executive
- salary: 20000-100000 USD year ote=false | "You've owned customer relationships in the past, selling $20k-100k+ ACV deals" | check: 

**69** · salary · `greenhouse:bluestone:4380004009` · Care Coordinator, LSW (MSHO)
- years: 1 preferred | heading: required | "One or more years of experience working with the geriatric or certified disabled population in case management/care coordination, Home Care, Group Homes, Nursing Homes, TCU or Assisted Living settings preferred" | check: 
- salary: 65000-75000 USD year ote=false | "Salary Range: $65,000 - $75,000, commensurate with experience." | check: 

**70** · salary · `greenhouse:postscript:8925430002` · Head of Growth
- years: 5 required | heading: required | "5+ years leading teams in marketing, growth or engineering, or as a founder" | check: 
- salary: 207000-287000 USD year ote=false | "Salary range of USD $207,000–287,000 base plus significant equity (we do not have geo-based salaries)" | check: 
- equity | "Salary range of USD $207,000–287,000 base plus significant equity (we do not have geo-based salaries)" | check: 

**71** · salary · `greenhouse:oasis:5271452007` · Physical Therapist
- salary: 85000-105000 USD year ote=false | "Competitive Physical Therapist salary: $85,000–$105,000" | check: 
- k401 | "401(k) with company match" | check: 

**72** · salary · `greenhouse:recursionpharmaceuticals:8262864` · Staff Engineer, Identity & Access Management (IAM)
- years: 7 required | heading: none | "A minimum of 7 years of experience in Identity & Access Management and other information security related domains." | check: 
- salary: 180600-212900 USD year ote=false | "Based on the skills, experience, and qualifications needed for this role, the estimated annual base salary range is: $180,600–$212,900." | check: 
- equity | "In addition to base salary, this role is eligible for an annual bonus, equity compensation, and a comprehensive benefits package." | check: 

**73** · salary · `greenhouse:allego:4517613009` · DevOps Engineer
- salary: 100000-154000 USD year ote=false | "$100,000 - $154,000 base + equity" | check: 
- equity | "$100,000 - $154,000 base + equity" | check: 
- k401 | "401(k) with company matching" | check: 
- pending: years (3) | "Bachelor's Degree in Computer Science or a related field and 3+ years experience working in a technical support, help desk, or SAAS operation environment." | check: 

**74** · salary · `ashby:meadow:8cd1c1e5-fe21-479e-8341-854cc2d2aeb6` · Customer Success Manager
- years: 3 required | heading: required | "3–6+ Years of Experience in Customer Success" | check: 
- salary: 103700-153000 USD year ote=false | "The initial annual salary for this position is expected to range from $103,700- $153,000 USD." | check: 
- equity | "Competitive Equity" | check: 
- k401 | "401(k) Retirement Savings Plan" | check: 

**75** · salary · `ashby:gamma:72632694-2a83-4418-bb8e-9d026618d3dd` · Senior Product Designer
- years: 5 required | heading: required | "5+ years of end-to-end product design experience with a strong portfolio showing shipped work, ideally on productivity or workflow tools" | check: 
- salary: 180000-260000 USD year ote=false | "The base salary for this full-time position, which spans multiple internal levels depending on qualifications, ranges between $180K - $260K plus benefits & equity." | check: 
- equity | "The base salary for this full-time position, which spans multiple internal levels depending on qualifications, ranges between $180K - $260K plus benefits & equity." | check: 

**76** · salary · `lever:canarytechnologies:ec095663-9b9a-4d4f-9018-52e3dd383055` · Senior Product Designer
- years: 4 required | heading: required | "4+ years experience in a product design role developing web experiences." | check: 
- salary: 150000-225000 USD year ote=false | "Target cash compensation ranges from $150,000 - $225,000, including a fixed annual salary and a performance-based bonus paid quarterly." | check: 
- equity | "This role also includes a stock option grant, subject to board approval." | check: 

**77** · salary · `ashby:marblehealth:5003baa9-c768-4511-9e0a-3d57fe549ee2` · Product Engineer
- years: 2 required | heading: required | "2+ years of software engineering experience, with a track record of solving hard problems with code" | check: 
- salary: 150000-200000 USD year ote=false | "$150K – $200K" | check: 
- equity | "Strong equity in an early stage company that's on track to become a unicorn" | check: 

**78** · salary · `ashby:upside:98eebd5f-c097-4178-ad80-fb2d8f751568` · Senior Account Manager, Grocery
- years: 5 required | heading: none | "5+ years of client-facing experience, including ownership of mid-market accounts; Bachelor's degree required." | check: 
- salary: 121000-152000 USD year ote=false | "The U.S. base salary range for this full-time position is $121,000 - $152,000 + commissions + equity + benefits." | check: 
- equity | "The U.S. base salary range for this full-time position is $121,000 - $152,000 + commissions + equity + benefits." | check: 
- k401 | "401(k) program" | check: 

**79** · salary · `ashby:mintlify:d728c142-6a0d-49cb-b707-6a85483d55ab` · Account Manager
- years: 3 required | heading: required | "3+ years in a quota-carrying account management role, or an AE role with expansion ownership, at a B2B SaaS company." | check: 
- salary: 50000-50000 USD year ote=false | "We're hiring an Account Manager to grow Mintlify's relationships with a book of customers, each typically $50K–$250K in annual recurring revenue." | check: 
- equity | "Competitive compensation and equity" | check: 
- k401 | "401k with Employer Match" | check: 

**80** · salary · `ashby:hyperbound:e58222f2-3835-4107-863c-c68947e48489` · Machine Learning Engineer
- salary: 260000-300000 USD year ote=false | "Comp: $260k-$300k+ based on experience, meaningful equity" | check: 
- equity | "Equity here is real, with real secondary opportunities, and we genuinely want the people who build this early to end up meaningfully rewarded for it." | check: 
- k401 | "Benefits: medical, dental, vision, 401k" | check: 

**81** · salary · `ashby:brettonai:b21f7919-92f0-4de8-bd76-daeb16341a31` · Forward Deployed Engineer
- years: 2 required | heading: required | "2+ years of experience as a software engineer or similar" | check: 
- salary: 150000-200000 USD year ote=false | "$150k - $200k base salary + meaningful equity" | check: 
- equity | "$150k - $200k base salary + meaningful equity" | check: 
- k401 | "Comprehensive healthcare, 401k matching, commuter benefits" | check: 

**82** · salary · `greenhouse:earli:6160738004` · Sr Director, In Vivo Pharmacology
- years: 8 required | heading: required | "or M.S. and 8 or more years leading nonclinical safety programs will be considered, especially with a background in the development of nucleic acid-based drugs" | check: 
- salary: 215000-235000 USD year ote=false | "The base salary for this position is $215k-$235k per year." | check: 

**83** · salary · `ashby:sketchpro:f49ba39e-06ef-4412-827f-6f478ae9f61e` · Forward Deployed Architect: Customer Success
- salary: 100000-140000 USD year ote=false | "Competitive equity and compensation ($100k-140k salary + equity)" | check: 
- equity | "Competitive equity and compensation ($100k-140k salary + equity)" | check: 

**84** · salary · `greenhouse:seatgeek:8407177` · Manager, Supply Performance
- salary: 102000-147000 USD year ote=false | "The salary range for this role is $102,000 - $147,000 USD." | check: 
- equity | "Equity stake" | check: 
- k401 | "401(k) matching" | check: 

**85** · salary · `lever:h1:65c2c95e-dd39-4ec7-bd0b-ab6cb269644f` · Principal Customer Success Manager - Pharma
- years: 5 required | heading: required | "5+ years of experience in Customer Success, Account Management, Consulting, Program Management, or equivalent strategic customer-facing experience within an Enterprise or Strategic B2B SaaS environment." | check: 
- salary: 145000-160000 USD year ote=false | "This role pays $145,000 to $160,000 per year, based on experience, plus variable commission, based on performance, in addition to stock options." | check: 
- equity | "This role pays $145,000 to $160,000 per year, based on experience, plus variable commission, based on performance, in addition to stock options." | check: 

**86** · benefit · `ashby:caremessage:f7fc22ce-07ff-4a9b-a37e-87647b4fe473` · Strategic Partnerships Director
- none | check: 

**87** · benefit · `ashby:diligencesquared:8b75b696-a1c5-415f-b53d-90cde3011c40` · GTM Associate
- years: 2 required | heading: none | "Two to five years of experience: You have worked in private equity, commercial due diligence, strategy consulting, research, expert networks, investor relations or another relevant private-markets role." | check: 
- equity | "Meaningful early-stage equity and a path to grow with the commercial organization" | check: 

**88** · benefit · `ashby:moss:6903e731-b1a5-4dca-ac51-000fbeb125ff` · People Operations Specialist (f/m/d)
- equity | "Top-of-market compensation package, including equity." | check: 

**89** · benefit · `ashby:topline-pro:e7116c37-4e88-456b-b60f-f41d7ae1feaf` · Business Development Representative - Winter 2026 Cohort
- salary: 55000-55000 USD year ote=false | "$55k base salary with uncapped commissions ($100k+ OTE) + equity package" | check: 
- equity | "$55k base salary with uncapped commissions ($100k+ OTE) + equity package" | check: 
- k401 | "401(k) plan (non-matching)" | check: 

**90** · benefit · `ashby:regent:2fbaf0f4-1663-4197-9593-d926744b8ac1` · Senior Mission Software Engineer
- equity | "Competitive compensation including a robust equity incentive plan." | check: 
- k401 | "401(k) with company matching, so you can plan for the future." | check: 

**91** · benefit · `ashby:atira:3ff8ca9b-05ca-44cb-8469-32ebc6d90e2c` · Business Development Representative
- equity | "Competitive base equity package, uncapped variable." | check: 

**92** · benefit · `ashby:pirros:21ebd4d2-7d91-4a5f-b367-f368fc81c40e` · Account Executive - AEC
- equity | "Competitive compensation, equity, benefits, and unlimited PTO" | check: 

**93** · benefit · `lever:bloom:a206bbd0-cd76-40f9-82ec-b36217c09649` · Director of Brand & Social | Poppy & Peonies
- pending: years (5) | "We’ve come a long way in five years – from filling orders in my basement to appearing on Dragons’ Den, and now, expanding into new product categories and collaborating with some exciting influencers and brands." | check: 

**94** · benefit · `lever:iru:a775f2a9-f96d-4666-ad60-b7bbc17c0001` · Workplace Coordinator
- equity | "Equity for full-time employees" | check: 
- k401 | "401(K) with a 4% company match" | check: 

**95** · benefit · `ashby:aleph:fbae9e44-75c2-4a6f-a5af-97fd98a2cb7a` · Manager, CX
- none | check: 

**96** · benefit · `ashby:doe:17a1ba77-144d-4061-b408-f0597e314439` · Software Engineer - Product
- none | check: 

**97** · benefit · `ashby:dovetail:7902c644-99b9-451a-899e-ff6216cdb3a1` · Security Engineering Lead
- equity | "📈 Equity for everyone." | check: 

**98** · benefit · `greenhouse:saltsecurity:5304005007` · Enterprise Account Executive - Upper Midwest
- equity | "Competitive compensation, equity, and comprehensive benefits." | check: 

**99** · benefit · `ashby:somethings:9c3ec220-987f-4ea2-aade-f4d7bbc84957` · Clinical Supervisor (California)
- salary: 50-50 USD hour ote=false | "Competitive Salary: $50/hour" | check: 
- equity | "Renewed MHPEA https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/fact-sheets/final-rules-under-the-mental-health-parity-and-addiction-equity-act-mhpaea reaffirmed the requirements for states and …" | check: 

**100** · benefit · `ashby:fourier:08e320ee-161c-458d-9bf4-789a9f4df4e5` · Senior Electrical Engineer- India
- equity | "Competitive salary and equity compensation commensurate with experience" | check: 

**101** · other · `ashby:carwow:0a90a60c-5500-4b05-9b64-a49dd2a8fcde` · Manager of SME Account Management - Manchester
- none | check: 

**102** · other · `ashby:quippy:f7ff5326-3d0e-4c74-a4e4-3d2c8d5e0815` · Founding Product Engineer
- none | check: 

**103** · other · `greenhouse:invisible:4584333101` · Invisible Technologies Opportunities (Finance, Legal, Marketing, Talent, Business Ops)
- none | check: 

**104** · other · `ashby:svix:84e99bc9-5cd6-4af0-af84-17d63a7494b5` · Rust Backend Engineer
- none | check: 

**105** · other · `greenhouse:shifttechnology:6209107003` · Join our Talent Community (candidature spontanée)
- none | check: 

**106** · other · `greenhouse:oklo:6185818004` · Electrical Engineer – Aurora-INL
- years: 8 required | heading: required | "Eight or more years of progressively responsible electrical engineering experience, including significant experience with power-generation electrical systems." | check: 

**107** · other · `ashby:autoscience:00843b73-a6d2-4e8e-894c-d823c77e70e3` · Software Engineer
- none | check: 

**108** · other · `ashby:flink:1420bc99-761f-4cec-8c32-6d96281d71db` · Speculative Application
- none | check: 

**109** · other · `lever:sonatype:099a2300-3d4d-4dab-9f5c-eaba27c64be5` · Enterprise Account Executive, Federal, Civilian
- none | check: 

**110** · other · `ashby:humanarchive:15617d2b-054c-45dd-ba8c-1a1e3dfd2089` · Strategy & Project Lead (Data Operations)
- none | check: 

**111** · other · `ashby:vori:20fc3614-7deb-4dfe-9774-95315e650c66` · Territory Account Executive-New York
- none | check: 

**112** · other · `ashby:imprint:b48db81c-e19e-4fdd-a453-578a440320f9` · Partner Marketing Manager
- none | check: 

**113** · other · `ashby:scaled-cognition:4a73e6a3-56ae-4185-90ee-5686040da858` · Software Engineer, Infrastructure
- none | check: 

**114** · other · `ashby:rivia:df520480-a6d9-4429-955d-7a908478f375` · Talent & People Partner
- none | check: 

**115** · other · `ashby:marble:0a41b328-c4cb-4ea3-802d-66f302bcc11d` · Analyst (Legacy)
- none | check: 

**116** · other · `ashby:tryripline:fa153bc1-b0c0-41f4-af87-acb96958277a` · Member of Technical Staff
- none | check: 

**117** · other · `ashby:fieldguide:5147ad09-1d4e-4cbf-93b0-b584ff46ce74` · Software Engineer, Agents (Internal Audit)
- none | check: 

**118** · other · `ashby:phasebiolabs:47fde3f5-f924-4138-8267-26383374c7ca` · General Pool (Engineering Talent)
- none | check: 

**119** · other · `ashby:trueshort:ca880a30-f89c-4258-8496-ac059e851414` · Editor
- none | check: 

**120** · other · `ashby:edia:f7f55352-c9d8-454b-9d5f-c80493039038` · Senior Backend Engineer
- visa: no_sponsorship | "Work Authorization: We are currently unable to sponsor or transfer work authorization for all jobs." | check: 

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
