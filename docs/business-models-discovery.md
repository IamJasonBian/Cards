# Four Bets: Business Models & Customer Discovery Memo

*Prepared 2026-08-26 from a read of the IamJasonBian GitHub portfolio (7 repos read in
depth, chasethedice blog corpus scanned).*

The ~50 repos collapse into **four product theses**, each with a data-pipeline spine and a
thin UI, plus one distribution asset: the **chasethedice** blog, which already publishes
whitepaper-grade write-ups of the other four and is the only owned channel.

| Cluster | Repos | One-liner |
|---|---|---|
| **Machine Spray** | postings-backend/frontend, application-manager, linkedin_data_pipeline, greenhouse-datapipeline, production_* | Crawl every NYC posting, classify screening questions, auto-apply via browser RPA with managed auth; benchmarked to a cost per *recruiter-visible* application |
| **Theta + Allocation** | theta, thetagang, allocation-engine-2.0, allocation-gym-2.0, allocation-agent, ib-gateway-docker | Airflow-style "financial operators" (card billing-cycle modeling, autopay lead-times, Plaid) plus an EPS/P&L/vol research stack with published whitepapers |
| **Leetcards** | Cards, LeetCodePatterns | Spaced-repetition flashcards over 21 coding patterns, Judge0 code runner, Anthropic-powered review; deployed on Netlify + Render |
| **Route Manager** | route-manager-core, reflight (Branchwing), american/delta_data_pipeline, streetify | Low-latency flight-price monitoring on Amadeus, git-style itinerary forking, "heartbeat" monitoring for seasonal portal closing-day drift |

## Scorecard

Scored on what the repos and blog actually evidence — not what could be true.

| Bet | Pain intensity | Founder evidence | Willingness to pay | Competition | Wedge / moat |
|---|---|---|---|---|---|
| Machine Spray | ●●● acute, time-boxed | ●●● built while unemployed; 2 users | High for B2B (outplacement, coaches); spiky for B2C | Crowded but shallow — nobody prices survival rate | Cost-per-*surviving*-apply metric; managed auth + anti-bot craft |
| Theta / Allocation | ●●○ chronic, low urgency | ●●● deepest engineering, whitepapers | Unproven; card-cycle optimization is a novel angle | Personal-finance apps everywhere; none model float/lead-times | Operator abstraction; billing-cycle temporal math |
| Leetcards | ●●○ real but episodic | ●●○ deployed, self-used | Proven category but price-anchored low | Heavily served; free Anki decks abound | Retention *between* job searches — nobody owns re-prep |
| Route Manager | ●○○ diffuse, occasional | ●●○ multiple repos, real API integration | Consumer travel monetizes worst of the four | Google Flights, Going, Hopper | Fare-hold optionality + group forking; heartbeat data is unowned |

---

## Bet 1 — Machine Spray (strongest)

The strongest bet: you didn't just build it — you priced it. "The Cost of an Apply"
already contains the core commercial insight: competitors quote cost per *attempt*; the
number that matters is cost per application a recruiter can actually see, and they differ
by 2–4×.

**Business models, ranked**

1. **Outplacement B2B** (recommended first test) — sell the pipeline to career coaches,
   outplacement firms, and bootcamp career services who run it *for* candidates. Budgets,
   recurring cohorts, no B2C churn (the customer doesn't disappear when one candidate is
   hired). Price per seat-month or managed candidate.
2. **Concierge service** (revenue this month) — done-for-you pipeline for laid-off
   mid/senior engineers: $500–1,500 for a 6-week engagement. Zero new code; paid discovery.
3. **B2C SaaS** (crowded, churny) — $30–80/mo vs. Simplify/LazyApply/Sonara. Only worth it
   leading with the honesty metric: publish survival rates, charge per surviving submission.
4. **Benchmark-as-content** — the anti-bot / autofill-accuracy benchmark series becomes the
   industry reference → inbound consulting and B2B leads.

**Riskiest assumptions**

- Volume applying still converts — if recruiters increasingly discount sprayed
  applications, the product optimizes a dying channel.
- The anti-bot arms race stays economically survivable.
- Coaches/outplacement firms will attach their brand to automation that target companies
  prohibit in ToS.

**Who to interview** — five each: (a) engineers laid off in the last 12 months who applied
to 100+ roles, (b) independent career coaches with ≥10 active clients, (c) bootcamp
career-services staff, (d) 2–3 recruiters (to check the conversion assumption, not as buyers).

**Interview script**

1. Walk me through your last job search week by week. How many applications went out, and
   how did you physically do them? *(actual volume and toil, not remembered averages)*
2. What did you spend money on during the search — tools, coaches, resume services,
   LinkedIn Premium? How much, and which felt worth it? *(past spend = only reliable WTP signal)*
3. Tell me about the last time you abandoned an application halfway. What stopped you?
   *(screening questions and login walls are the wedge; let them name it)*
4. How did you keep track of what you'd applied to and what came back? *(spreadsheet
   workarounds = they already built a worse postings-backend)*
5. Did you ever try an auto-apply tool? What happened, and why did you stop? *(competitor
   churn reasons = differentiation checklist)*
6. (Coaches) How many hours a week do you or your clients spend on application mechanics
   vs. interviews? What do you charge for, and what do clients complain about paying for?
7. (Recruiters) When you see 800 applicants on a posting, how do you triage? Can you tell
   automated applications apart, and do you care? *(tests "spray still converts")*

---

## Bet 2 — Theta & the allocation stack

Two theses in one cluster. The allocation gym/engine is a personal research stack — a
content and credibility asset, probably not a company. Theta's premise is a real unserved
wedge: nobody models **payment timing** — billing cycles, grace periods, autopay
lead-times, cross-account transfer latency — as a first-class object.

**Business models, ranked**

1. **Float & autopay copilot** (the novel wedge) — connect cards via Plaid, model each
   card's statement close + grace period + daily periodic rate, schedule payments to
   maximize float and never eat interest or late fees. Comps (Copilot, Monarch) categorize
   spending; none do temporal optimization. $8–15/mo.
2. **Operator framework** (open-core, slow) — open-source the financial-operators
   abstraction; sell hosted orchestration. Small market, long game.
3. **Research content** (keep, don't monetize yet) — allocation-gym whitepapers as the
   blog's credibility engine.

**Riskiest assumptions**

- People with 4+ cards and real float pressure exist in volume *and* will connect Plaid to
  a solo developer's app.
- Dollars saved are large and legible enough to justify a subscription.
- Regulatory surface stays read-only — initiating payments jumps compliance costs an order
  of magnitude.

**Who to interview** — credit-card optimizers (churners, r/CreditCards), freelancers with
lumpy income, small-business owners floating expenses, and 2–3 people who recently paid a
late fee or carried an accidental balance.

**Interview script**

1. How many cards and accounts are you juggling, and how do you decide which card an
   expense goes on?
2. Tell me about the last late fee or interest charge you paid. What actually caused it?
   *(the product's ROI in their own words)*
3. How do you handle the gap between a big bill's due date and your next paycheck or
   client payment? *(float pain as a story)*
4. Do you use autopay everywhere? Where don't you, and why not? *(autopay distrust is the
   exact workflow theta automates)*
5. What do you use to see all of this in one place? What did you try and abandon?
6. Would you connect your accounts through Plaid to get this? What would make you refuse?
   *(the adoption cliff for any solo fintech)*

---

## Bet 3 — Leetcards

Deployed and self-used, but the most crowded market of the four. The unowned position the
stack points at: **retention between searches** — spaced repetition is precisely the
technology for "I knew all 21 patterns eight months ago and they're gone."

**Business models, ranked**

1. **Re-prep subscription** — "stay interview-ready": 15 min/day of scheduled recall on
   patterns already learned, Judge0 grading real code. Sold to employed engineers as
   insurance ($5–10/mo), not to active preppers as a course.
2. **Cohort / B2B2C** — license the deck + runner to bootcamps and career centers as the
   retention layer after curriculum ends. One deal = hundreds of users.
3. **Classic freemium** — free patterns, paid AI review + analytics; a grind against free
   alternatives without a content/SEO flywheel.

**Riskiest assumptions**

- Employed engineers will pay for insurance against a future search (prevention undersells
  cure).
- Daily-recall habit survives past week two without a deadline.
- AI-graded recall beats free Anki + free NeetCode videos by enough to charge for.

**Who to interview** — engineers who interviewed in the last 6 months after 2+ years
without interviewing; bootcamp grads 6–12 months out; bootcamp career services (batch with
the Spray interviews — segments overlap).

**Interview script**

1. The last time you interviewed after a long gap — how long did the ramp-back take, and
   what had decayed most? *(sizes re-prep pain in hours)*
2. What did you pay for during that prep? Would you have paid more to skip the ramp?
3. Between searches, did you do anything to stay sharp? How long did it last? *(if nobody
   sustains practice unprompted, pivot to B2B2C)*
4. Ever used Anki or flashcards for coding? What worked, what made you quit?
5. When you re-practice a solved problem, how do you check you've still got it — re-solve,
   read the solution, gut feel? *(is code-runner grading a felt need?)*

---

## Bet 4 — Route Manager / Branchwing

The most fun and the hardest business: consumer flight tools fight Google Flights' free
tier and Hopper's scale. Two genuinely unowned corners from your own writing: **fare-hold
optionality** (the ~20-minute pre-checkout hold as a tradeable option) and the
**closing-day heartbeat** (seasonal portal closures cluster on the same Sundays; nobody
monitors that).

**Business models, ranked**

1. **Group-trip forking** (social wedge) — Branchwing's git-style itinerary forking is the
   one consumer feature giants don't have. Buyer = the group's designated planner;
   affiliate + planner subscription; every trip invites 3–8 non-users.
2. **Heartbeat data/API** (niche B2B, cheap to test) — closing-day drift alerts for travel
   newsletters, tour packagers, concierge services. Tiny market, zero competition, crawler
   spine already exists.
3. **Fare-hold concierge** (power-user niche) — hold-and-watch for repeat routes. High
   value per user, tiny pool, real airline-ToS exposure.

**Riskiest assumptions**

- Group planners feel enough *recurring* pain to adopt a new app (trips are 1–3×/year;
  retention physics are brutal).
- Amadeus coverage/pricing survives comparison with Google Flights.
- Anyone pays for closing-day data vs. just checking the resort page in October.

**Who to interview** — organizers of a 4+ person trip in the last year; ski-pass holders
who book late-season; 2–3 travel-newsletter operators or independent agents (heartbeat angle).

**Interview script**

1. Tell me about the last group trip you organized. Where did the plan actually live —
   group chat, spreadsheet, someone's head? *(the forking feature's real competitor is a
   Google Sheet)*
2. What fell apart? Who dropped out, what sold out, what got rebooked?
3. How do you decide when to book vs. keep watching? Ever had a fare jump while deciding?
4. Do you pay for any travel tool or newsletter? Why that one?
5. (Seasonal) Ever missed a window — lifts closed, ferry off-season, permit lottery shut —
   because a page changed quietly? What did it cost you?

---

## Discovery playbook

Three rules behind every script:

- **Past tense only.** "Would you use…" produces politeness, not data. Ask what they
  *did*, *paid*, or *abandoned*. Ignore compliments; log behaviors.
- **Money and workarounds are the signal.** A weekly-maintained spreadsheet, a paid tool
  they quit, a fee they ate — each is worth ten "that sounds cool"s.
- **Never pitch in a discovery interview.** Describe the problem space, not the solution,
  until the last five minutes — if at all.

**Cadence & kill criteria.** Five interviews per segment before any new feature work on
that bet. A bet earns another five when ≥3 of 5 people independently describe the target
pain *and* show past spend or a standing workaround. A bet shelves when two rounds produce
neither. Recruit from the blog (one-line footer CTA on relevant posts),
r/cscareerquestions and r/CreditCards, and warm intros; $25–40 gift cards for cold
participants.

**Cheap parallel tests:** a landing page per bet with a real price and waitlist
(email-for-price conversion), and for Machine Spray, one *paid* concierge client — revenue
is the interview that can't lie.

## Where to spend the next 30 days

1. **Lead with Machine Spray** — the only bet with acute pain, lived founder evidence, a
   second user, a differentiated metric (cost per surviving apply), and a B2B route around
   churn. Run coach/outplacement interviews and one paid concierge engagement in parallel.
2. **Run Theta's float-copilot interviews second** — six conversations decide whether the
   temporal-payments wedge is a company or a very good blog post. Highest-variance bet.
3. **Hold Leetcards as a portfolio asset** — batch its questions into the Spray
   conversations (segments overlap almost perfectly).
4. **Keep Route Manager a passion project** until a group-trip landing page shows organic
   pull; the heartbeat idea gets one blog post with a signup form.
