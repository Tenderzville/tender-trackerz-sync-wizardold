// Ten legacy blog articles listed in sitemap-blog.xml. Each has its own page
// at /blog/:slug. Keep facts conservative and general; every page carries the
// standing disclaimer. Terminology: "automated data collection", never "scraping".
export interface LegacyPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  slug: string;
  content: string;
}

export const legacyPosts: LegacyPost[] = [
  {
    id: "lp-1",
    slug: "how-to-win-government-tenders-kenya-2026",
    title: "How to Win Government Tenders in Kenya (2026 Guide)",
    excerpt: "What actually decides Kenyan public tenders in 2026 — eligibility, pricing, paperwork and preparation time — explained step by step.",
    category: "Strategy",
    date: "2026-02-12",
    readTime: "8 min",
    content: `Winning a government tender in Kenya is rarely about luck. Evaluators score what you submit against what the tender document asks for, and most losing bids fail on the basics long before price is discussed.

## Start with eligibility, not opportunity

Before you shortlist anything, confirm you can legally bid:

- A registered business (limited company, partnership or sole proprietorship) with a KRA PIN.
- A valid Tax Compliance Certificate from KRA's iTax portal, checked on the closing date.
- Sector licences where required: NCA for construction, PCK for professional consultancy, PPB for pharmaceutical supplies, and so on.
- For AGPO-eligible groups, a valid AGPO certificate for the 30% preference margin.

If any of these is missing or expiring before the award, fix it first. A bid that fails preliminary evaluation is not read at all.

## Choose tenders you can actually deliver

- Read the scope twice before requesting documents. Does your team, equipment and cash flow match it?
- Check turnover and past-experience requirements. Turnover thresholds are the most common reason small firms are locked out — consider a consortium when a single tender is above your capacity.
- Give yourself preparation time. A 14-day runway between the advert and closing date is a sensible minimum for a serious bid.

## Price with your real costs

- Cost every input: materials, labour, transport, taxes, bid security and financing costs.
- Add a margin you can defend, not the lowest number you can survive.
- Remember the lowest-priced bid is only awarded when it is also substantially responsive — cheap and non-compliant loses.

## Deliver a clean file

- Sign every page the instructions require. Unsigned forms are an automatic fail.
- Follow the format: same order, same forms, same number of copies.
- Submit early. Transport, queues and upload failures are not accepted excuses.

TenderAlert tracks opportunities across official sources and shows how closely each tender matches your registered profile, so you spend your preparation time on bids you can actually win. General information only — always follow the official tender document.`,
  },
  {
    id: "lp-2",
    slug: "free-kenya-tender-sources-compared",
    title: "Free Kenya Tender Sources Compared: Where to Find Tenders Without Paying",
    excerpt: "Official adverts are free to view. Here is where Kenyan tenders are published, what each source is good for, and what paid resellers really add.",
    category: "Resources",
    date: "2026-01-20",
    readTime: "6 min",
    content: `Every Kenyan public tender is advertised somewhere free. Knowing the official sources — and their limits — saves you money and protects you from copycat sites.

## The official sources

- **tenders.go.ke (National Treasury):** the central adverts portal for many national government tenders. Free to browse and register.
- **PPIP — tunajibu.go.ke:** the Public Procurement Information Portal. Best for awarded contracts and historical award data rather than live adverts.
- **County government websites and notice boards:** all 47 counties publish their own tenders, usually on their site or physical notice boards.
- **Procuring entity websites:** parastatals, universities and hospitals often publish on their own pages even when also listing elsewhere.
- **Daily newspapers:** the standard Thursday tender supplements in the Nation and Standard.

## What each is good for

- tenders.go.ke for a daily national sweep.
- PPIP for research: who won what, at what price, in which county.
- County sites when you target specific counties.
- Newspapers as a backup sweep — some county notices appear there only.

## The gaps you must cover yourself

- No single official page covers every procuring entity.
- Deadlines change through addenda; if you miss an addendum, your bid may be non-responsive.
- Short-window tenders (a week or less) are easy to miss entirely.

That is the gap an aggregator fills: TenderAlert uses automated data collection from official public sources, filters by your sectors and counties, and pushes alerts with at least a 14-day preparation window so you are not bidding against the clock. Registration on official portals remains free — never pay to view a government tender.

General information only; portal addresses and procedures change, so verify on the official site.`,
  },
  {
    id: "lp-3",
    slug: "agpo-certification-kenya",
    title: "AGPO Certification in Kenya: How Youth, Women and PWDs Get Preference",
    excerpt: "The Access to Government Procurement Opportunities programme reserves 30% of public tenders. Here is who qualifies and how to register.",
    category: "AGPO",
    date: "2026-01-28",
    readTime: "7 min",
    content: `AGPO — the Access to Government Procurement Opportunities programme — requires public entities to reserve at least 30% of their procurement for youth, women and persons with disabilities. If your business qualifies, the preference margin is real money.

## Who qualifies

- **Youth:** at least 70% of the shares held by Kenyan citizens aged 18–35.
- **Women:** at least 70% of shares held by Kenyan women.
- **Persons with disabilities:** at least 70% of shares held by Kenyans with disabilities, and the enterprise must be registered with NCPWD.

The enterprise must be a legally registered business — sole proprietorship, partnership or limited company — with the qualifying owners as directors or partners.

## Documents you need

- Certificate of registration (or incorporation).
- KRA PINs for the business and directors.
- Directors' IDs and passport photos.
- For PWDs: an NCPWD registration card.
- AGPO affidavit, per the template on the AGPO portal.

## Where to register

Apply on the AGPO portal. Registration is free — never pay an agent for the certificate itself. Once approved, the certificate is linked to your KRA PIN and must be renewed (commonly annually) and re-issued when your details change.

## Using the certificate well

- Attach a valid, non-expired certificate to every AGPO-eligible bid; an expired one costs you the preference.
- Keep ownership records consistent: the names on the certificate, PIN, and company documents must match exactly.
- AGPO set-asides are separate lots — bid for them specifically instead of competing in the open category.

TenderAlert flags tenders with AGPO eligibility in your preferences, so qualifying firms see those opportunities first. General information only — confirm current requirements with PPRA and the official tender document.`,
  },
  {
    id: "lp-4",
    slug: "how-to-write-winning-bid-proposal-kenya",
    title: "How to Write a Winning Bid Proposal in Kenya",
    excerpt: "A proposal is a compliance document first and a sales document second. Structure, evidence and pricing discipline win Kenyan tenders.",
    category: "Proposals",
    date: "2026-03-04",
    readTime: "8 min",
    content: `Evaluators score proposals against the published criteria. A winning proposal makes that scoring easy: every requirement answered, in order, with evidence.

## Step 1: Build a compliance checklist first

Go through the tender document clause by clause and list every document and form required:

- Statutory: KRA PIN, Tax Compliance Certificate, business registration, sector licences.
- Forms: signed tender form, confidentiality, anti-corruption, declaration forms.
- Financial: bid security or tender security, priced BOQ in the exact issued format.
- Company: past similar jobs, references, equipment, CVs of key staff.

Tick each item into your file before you write a single page of narrative.

## Step 2: Answer the technical scope directly

- Mirror the structure of the terms of reference. If the TOR has six headings, your methodology has six headings.
- Show you understand the site or context: county, terrain, timelines, local conditions.
- Name key staff and their actual experience; include CVs, not vague capability statements.
- Attach completion certificates and contactable references from similar past work.

## Step 3: Price with discipline

- Use the issued BOQ or pricing schedule without altering its structure.
- Cost realistically: inputs, labour, transport, taxes, financing and a defensible margin.
- Check arithmetic twice — unbalanced or error-filled pricing schedules get bids rejected.
- Do not underprice to "win and sort it out later"; failure to perform has consequences.

## Step 4: Submit like a professional

- Sign and stamp everything required, including every page marked for signatures.
- Match the required copies and packaging instructions exactly.
- Submit before the closing time — early. Late bids are returned unopened, with no exceptions.

If you use AI tools for drafting, treat them as a first-draft assistant: verify every fact, figure and requirement against the official tender document. The responsibility for a responsive bid is yours. General information only.`,
  },
  {
    id: "lp-5",
    slug: "consortium-bidding-kenya",
    title: "Consortium Bidding in Kenya: Partnering to Bid for Bigger Tenders",
    excerpt: "When turnover or experience requirements are above your size, a well-formed consortium lets credible smaller firms compete for large tenders.",
    category: "Consortiums",
    date: "2026-03-18",
    readTime: "7 min",
    content: `Many large Kenyan tenders require annual turnover, equipment lists or past experience that a single SME cannot show. Consortium bidding lets several firms combine capacity — if the arrangement is proper.

## When a consortium makes sense

- The tender requires turnover or experience above your single-company level.
- The scope combines skills: construction plus electrical, supplies plus installation, consultancy plus survey.
- The evaluation rewards breadth you can only reach together.

## Do it properly

- **Register the arrangement.** A written consortium agreement or MoU signed by all members beats an informal WhatsApp understanding every time.
- **Name a lead member.** Evaluators and procuring entities need one responsible party for the bid.
- **Align the paperwork.** All members should hold valid KRA PINs, tax compliance and any sector licences the tender requires.
- **Define contributions.** Who brings equipment, who brings staff, who finances what share — in writing, before bidding.
- **Check the tender rules.** Some tenders restrict or define consortium participation; follow the document.

## What evaluators look at

- Combined turnover and experience of the members.
- Whether the arrangement is genuine capacity or paper convenience.
- Clear roles and joint responsibility for delivery.

## Find the right partners

TenderAlert lets firms create or join consortiums around specific tenders, state their expertise and contribution, and see who else is bidding — so partnerships form around real opportunities, not cold introductions. Honest disclosure to the procuring entity is always required; a consortium never hides its structure.

General information only — the tender document always governs.`,
  },
  {
    id: "lp-6",
    slug: "tenderpro-learning-hub-free-procurement-training",
    title: "Free Procurement Training in Kenya: The TenderAlert Learning Hub",
    excerpt: "Practical guides, templates and tutorials for Kenyan suppliers — free to use, built around the questions bidders actually ask.",
    category: "Learning",
    date: "2026-04-02",
    readTime: "5 min",
    content: `Most tender losses in Kenya are not caused by competition — they are caused by avoidable paperwork and pricing mistakes. The TenderAlert Learning Hub exists to close that gap with free, practical training.

## What is in the Learning Hub

- **Step-by-step guides:** supplier registration, AGPO certification, KRA tax compliance for tenders, tender pricing, and tender security.
- **Templates and checklists:** compliance checklists and proposal structures you can reuse on every bid.
- **Video tutorials:** short walkthroughs of the app and core workflows — finding tenders, setting preferences, posting RFQs and connecting your apps.
- **Community answers:** a forum where Kenyan bidders ask and answer questions from real experience.

## How to use it well

- Start with the guides that match your current stage: first registration, then eligibility, then pricing.
- Use the tutorials before your first bid week — fifteen minutes on preferences saves hours later.
- Read the how-to article for each blocking issue as it arises, not all at once.

## Learn and share

Suppliers who publish their own courses and guides can list them on the Learning Hub, and the community forum rewards answers with upvotes. Kenya's procurement knowledge should not cost a seminar fee.

The Learning Hub is general information, not legal, tax or financial advice — always confirm specifics in the official tender document and with the relevant government body.`,
  },
  {
    id: "lp-7",
    slug: "county-tenders-kenya-47-counties",
    title: "County Tenders in Kenya: Finding Work in All 47 Counties",
    excerpt: "County governments buy roads, water, supplies, consultancy and services every financial year. How to find, track and win county tenders.",
    category: "Counties",
    date: "2026-04-16",
    readTime: "7 min",
    content: `After the national government, the 47 county governments are Kenya's second-largest public buyer. Roads, water projects, office supplies, fuel, consultancy, security services and equipment — most of it is bought through county tenders published locally.

## Where counties publish

- Each county's own website and physical notice boards.
- The national adverts portal for some notices.
- Newspaper supplements, especially around the start of the financial year.

Because publication is scattered, county tenders are the most-missed opportunities in Kenyan procurement — especially short-window ones.

## What counties actually buy

- **Works:** road maintenance, markets, boreholes, drainage, county offices.
- **Supplies:** stationery, fuel, uniforms, food for county institutions, furniture.
- **Services:** security, cleaning, consultancy, valuation, ICT support.
- **AGPO set-asides:** counties must meet the 30% reservation too, which creates genuine opportunities for youth, women and PWD-owned firms.

## How to compete for county work

- Register and pre-qualify with counties you can serve physically — know their notice board cycle.
- Attend pre-tender site meetings; for works, they are usually mandatory.
- Keep your documents current: KRA tax compliance, business registration, NCA where relevant, AGPO where eligible.
- Track deadlines carefully — county addenda are easy to miss.

On TenderAlert you can pick your counties and see only the tenders that matter to your area, with a deadline countdown so a closing date never sneaks up on you. General information only — each county's tender document governs its own process.`,
  },
  {
    id: "lp-8",
    slug: "kenya-tender-portals-walkthrough",
    title: "Kenya's Official Tender Portals: A Practical Walkthrough",
    excerpt: "Where Kenyan public tenders are officially published, what each portal does, and how to keep your documents ready so no advert catches you unprepared.",
    category: "Portals",
    date: "2026-05-06",
    readTime: "6 min",
    content: `Kenyan public tenders live on official portals that are free to use. Here is a practical map of what each one is for and a routine that keeps you ready.

## The portals you will actually use

- **tenders.go.ke (National Treasury):** the central place to browse live national government adverts, filtered by category and closing date. Registration to view and receive notices is free.
- **PPIP — tunajibu.go.ke:** the Public Procurement Information Portal. Use it for awarded contracts: who won, at what value, across national and county entities.
- **County and procuring-entity websites:** parastatals, universities, referral hospitals and the 47 counties publish on their own pages as well.
- **iTax (KRA):** not a tender portal, but your Tax Compliance Certificate — checked on nearly every bid — comes from here.

## A routine that keeps you ready

- Sweep the official sources weekly (or let TenderAlert's automated data collection push matching opportunities to you).
- For every interesting tender, download the full document immediately and read the closing date and eligibility before anything else.
- Renew documents before you need them: a tax compliance certificate expiring mid-bid is a common, avoidable loss.
- Save every awarded contract you research — award data is the best guide to realistic pricing.

## Stay safe on portals

Official portals never charge to view a tender. Beware of sites that resell government adverts or mimic official portals; if a page asks for money to view a public advert, it is not an official source. Deep links found in alerts should always lead you back to the official advert before you commit anything.

General information only — portal addresses and procedures change; verify on the official site.`,
  },
  {
    id: "lp-9",
    slug: "ai-changing-kenyan-procurement",
    title: "How AI Is Changing Kenyan Procurement",
    excerpt: "From finding tenders to drafting proposals, AI is reshaping how Kenyan suppliers work. What it genuinely helps with — and what it cannot do for you.",
    category: "Technology",
    date: "2026-05-21",
    readTime: "6 min",
    content: `AI is already part of Kenyan procurement workflows — for buyers, for suppliers and for the platforms in between. Knowing where it genuinely helps, and where it cannot substitute for your judgement, is now a business skill.

## Where AI genuinely helps suppliers

- **Finding the right tenders.** Automated systems can read thousands of adverts from official sources and match them to your sectors, counties and capacity — hours of work reduced to minutes.
- **Summarising documents.** Long terms of reference can be summarised into a compliance checklist, so nothing in the document is missed.
- **Historical insight.** Award data from past tenders helps you see realistic price ranges and which entities repeatedly buy what you sell.
- **Draft support.** AI can produce a first draft of a methodology section or cover letter — which a human must then correct and verify.

## Where it cannot substitute for you

- Eligibility is a legal fact, not a suggestion: licences, tax compliance and registration must be real and current.
- Pricing discipline is yours. No model knows your costs and risk better than you do.
- The bid you submit carries your signature. If an AI tool invented a fact, the procuring entity holds you responsible.

## How TenderAlert uses AI — carefully

TenderAlert uses AI to parse tender adverts from official sources and to score how well each opportunity aligns with your registered profile. Two rules are deliberate: the platform never presents a "probability of winning" — it shows readiness and alignment signals instead, because bidding decisions deserve facts, not false confidence — and every AI-derived detail carries a disclaimer that the official tender document is the final authority.

Use AI as a fast assistant with a mandatory human review. That combination is what actually changes outcomes. General information only.`,
  },
  {
    id: "lp-10",
    slug: "kenya-tender-deadlines-late-fix",
    title: "Missed a Tender Deadline? What Kenyan Suppliers Can Do Next",
    excerpt: "Late bids are returned unopened. Here is what can still be done before and after a deadline — and how to make sure it never happens again.",
    category: "Deadlines",
    date: "2026-06-03",
    readTime: "5 min",
    content: `In Kenyan public procurement, a bid submitted after the closing time is returned unopened — no exceptions, no appeals. That is why deadline discipline is worth more than almost any other bidding habit.

## Before the deadline: what can still save you

- **Read every addendum.** Procuring entities extend or amend deadlines through addenda; if a deadline moved and you missed the addendum, you were bidding on stale information.
- **Ask early, in writing.** If documents, clarifications or delays from the entity genuinely slowed you down, a written request to the procuring entity before closing is the only legitimate route — and it is discretionary.
- **Submit in stages.** Where portals allow it, upload completed sections before the final push; do not leave one upload for the last ten minutes.
- **Never rely on traffic, queues or power.** Build a 24-hour buffer into every bid.

## After the deadline: the honest options

- Request feedback on why you missed it and fix the root cause — that feedback is free and valuable.
- Research who won (PPIP publishes awarded contracts) and target the next cycle with better pricing intelligence.
- Watch for re-advertised tenders: failed tenders frequently come back to the market.
- If another entity repeats the same scope, you now have a prepared file — reuse it.

## Make it structural, not heroic

Set a personal rule: a tender needs a 14-day preparation window to be worth bidding. Below that, the odds of a compliant, priced, signed submission collapse. TenderAlert applies that filter to alerts and shows a countdown on every opportunity, so the decision to bid happens with time on your side.

General information only — the specific tender document and the applicable procurement law govern every deadline.`,
  },
];
