// Five search-led "how to" guides for Kenyan suppliers.
// Topics chosen from Search Console demand (Jun–Sep 2026): supplier registration,
// types of tenders, tax compliance, pricing and tender security.
export interface HowToPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  slug: string;
  content: string;
}

export const howToPosts: HowToPost[] = [
  {
    id: "h1",
    title: "How to Register as a Government Supplier in Kenya (2026 Checklist)",
    excerpt:
      "The exact documents, offices and order of steps you need to become a registered supplier to Kenyan ministries, counties and state agencies.",
    category: "How-To",
    date: "2026-10-01",
    readTime: "8 min",
    slug: "how-to-register-as-government-supplier-kenya",
    content: `Most first-time bidders are not rejected for price. They are rejected at the preliminary stage because a single mandatory document is missing or expired. This checklist puts the steps in the order that saves you the most time.

## Step 1: Register your business

- **Sole proprietor or partnership**: register a business name on eCitizen (Business Registration Service).
- **Limited company**: register on eCitizen and keep a copy of your Certificate of Incorporation and CR12 (list of directors). Many tenders ask for a CR12 issued within the last 12 months.

## Step 2: Get your KRA PIN and Tax Compliance Certificate

Your company needs its own KRA PIN. Once your returns are filed and no tax is owed, download a Tax Compliance Certificate (TCC) from iTax. Almost every public tender lists a valid TCC as mandatory. See our separate guide on getting a TCC fast.

## Step 3: Get county and sector licences

- **Single Business Permit** from the county where you operate.
- **Sector licences** where they apply: NCA registration for construction works, Pharmacy and Poisons Board for medical supplies, EPRA for energy, ICTA accreditation for ICT, and so on.

## Step 4: Apply for AGPO if you qualify

If your business is at least 70% owned by youth (18–35), women or persons with disabilities, apply for an Access to Government Procurement Opportunities (AGPO) certificate. By law, at least 30% of procurement spend is reserved for AGPO groups.

## Step 5: Register on the official government procurement portal

Public entities now publish and receive tenders through the national electronic procurement system run by the National Treasury. Register your business there using the documents above, then keep your profile updated. Always follow the instructions on the official government portal itself — never pay anyone to "register" you.

## Step 6: Prepare a reusable bid folder

Keep scanned, clearly named PDFs of: Certificate of Incorporation, CR12, KRA PIN, TCC, business permit, sector licences, AGPO certificate, company profile, audited accounts (usually last 2–3 years) and reference letters from past clients. When a tender comes up you only need to update expiry dates.

## Common mistakes to avoid

- Letting the TCC or business permit expire mid-tender.
- Using a director's personal PIN instead of the company PIN.
- Uploading blurry scans or wrongly named files.
- Paying "agents" for tender documents — public tender documents are free to download.

## Next step

Once you are registered, set your sectors and counties in TenderAlert and we will alert you only to tenders that give you at least 14 days to prepare.`,
  },
  {
    id: "h2",
    title: "Types of Tenders in Kenya Explained: Which One Should You Bid For?",
    excerpt:
      "Open tenders, restricted tenders, RFQs, RFPs, framework agreements and direct procurement — what each means and which suits a small business.",
    category: "How-To",
    date: "2026-10-01",
    readTime: "7 min",
    slug: "types-of-tenders-in-kenya",
    content: `The Public Procurement and Asset Disposal Act, 2015 allows several procurement methods. Knowing which one a notice uses tells you how much competition to expect and how much paperwork to prepare.

## Open tender (national or international)

The default method. Anyone who meets the requirements can bid. Expect the most competition and the most documents, but also the largest contracts. National open tenders are restricted to Kenyan firms; international ones are open to foreign bidders.

## Restricted tender

Only pre-qualified or invited firms can bid, usually for specialised work or when few suppliers exist. Get onto pre-qualification lists early — entities often run them once a year.

## Request for Quotation (RFQ)

Used for lower-value goods and services. The entity invites at least three suppliers from its register to quote. RFQs are the best entry point for small businesses: fewer documents, quick decisions, faster payment.

## Request for Proposal (RFP)

Used mostly for consultancy and professional services. Evaluation weighs your technical approach and team (often 70–80%) before price. Strong CVs and a clear methodology matter more than being cheapest.

## Framework agreement

You are appointed as one of several approved suppliers for a period (often 1–3 years) and receive call-off orders as needs arise. Great for recurring items like stationery, fuel, cleaning or vehicle servicing.

## Two-stage tendering

Used for complex projects. Stage one agrees the technical solution; stage two invites priced bids. Expect longer timelines.

## Direct procurement

The entity buys from one supplier without competition — allowed only in limited cases such as emergencies or a sole source. You cannot bid for these; they are worth tracking only to see who wins what.

## Low-value procurement

Very small purchases made with minimal formality. Being on an entity's supplier register is what gets you these jobs.

## Which should you target first?

- **New business**: RFQs and AGPO-reserved open tenders.
- **Growing business**: framework agreements for steady income.
- **Established firm or consortium**: large open and restricted tenders.

TenderAlert tags each notice by entity, county and category so you can filter to the types that match your capacity.`,
  },
  {
    id: "h3",
    title: "How to Get a KRA Tax Compliance Certificate for Tenders (Step by Step)",
    excerpt:
      "Almost every Kenyan tender requires a valid TCC. Here is how to apply on iTax, why applications get declined, and how to fix it quickly.",
    category: "How-To",
    date: "2026-10-01",
    readTime: "6 min",
    slug: "how-to-get-kra-tax-compliance-certificate-for-tenders",
    content: `A missing or expired Tax Compliance Certificate (TCC) is one of the most common reasons bids fail the preliminary check. The good news: if your records are clean, you can get one online the same day.

## Before you apply

- File all due returns (income tax, VAT and PAYE where registered) — including nil returns for months with no activity.
- Clear any outstanding tax, penalties and interest, or agree a payment plan with KRA.
- Make sure your company details on iTax match your registration documents.

## How to apply on iTax

- Log in to the KRA iTax portal with the company PIN and password.
- Go to the Certificates menu and choose Apply for Tax Compliance Certificate.
- Fill in the reason (for example, tendering) and submit.
- If you are compliant, the certificate is issued automatically and can be downloaded.

## Why TCC applications get declined

- **Unfiled returns**: one missing month is enough to block issuance.
- **Outstanding liabilities**: even small penalties count.
- **Mismatched details**: a different business name or address on iTax.

The rejection message usually says which obligation is the problem. Fix it, wait for the system to update, then reapply.

## How long is a TCC valid?

A TCC is normally valid for 12 months from the date of issue. Tenders check that it is valid on the closing date, so renew early if yours expires soon.

## Verifying your certificate

Procuring entities can verify a TCC online using its number. Never alter or "borrow" a certificate — forged documents can lead to debarment and prosecution.

## Tip

Set a reminder two months before your TCC expires. TenderAlert's bid checklist in Smart Matches also flags tenders that list a TCC as mandatory.`,
  },
  {
    id: "h4",
    title: "How to Price a Tender Bid in Kenya Without Losing Money",
    excerpt:
      "A practical costing method for Kenyan suppliers: direct costs, overheads, taxes, financing and a margin that survives late payment.",
    category: "How-To",
    date: "2026-10-01",
    readTime: "8 min",
    slug: "how-to-price-a-tender-bid-kenya",
    content: `Winning a tender at a loss is worse than losing it. Many small suppliers underprice because they forget taxes, financing costs or the time it takes government entities to pay. Use this method for every bid.

## 1. List every direct cost

Materials or goods, labour, transport and delivery, installation, packaging and any testing or certification. Get written quotes from your own suppliers and note how long those prices are valid.

## 2. Add overheads

Rent, staff time spent on the contract, communication, insurance and bid preparation itself. A simple rule is to allocate a percentage of your monthly overheads to the contract period.

## 3. Include all taxes and statutory deductions

- VAT (where you are registered) — check whether the tender asks for prices inclusive of VAT.
- Withholding VAT and withholding tax that the entity may deduct at payment.
- Any import duty for imported items.

## 4. Price in financing and payment delays

Government payments can take weeks or months. If you will borrow or use LPO/invoice financing, add the interest for the realistic payment period, not the ideal one.

## 5. Add your margin last

Only after all costs are known should you add a margin. Check it against market rates: the public Price Index published by PPRA and past award values help you see what entities usually pay.

## 6. Sense-check against history

Look at similar past awards for the same entity or county. If your price is far below past awards, you may have missed a cost; far above, you may be uncompetitive. TenderAlert's historical award data helps with this comparison.

## 7. Fill the price schedule exactly

Use the entity's form, keep figures consistent between the schedule and the form of tender, and initial every page if asked. Arithmetic errors can lead to disqualification or correction at your expense.

## Remember

A bid that covers costs, taxes and financing — even with a modest margin — is better than one that wins and then bankrupts the business during delivery.`,
  },
  {
    id: "h5",
    title: "How to Get a Bid Bond (Tender Security) in Kenya",
    excerpt:
      "What tender security is, how much you need, where to get it — banks, insurers or microfinance — and how to avoid forfeiting it.",
    category: "How-To",
    date: "2026-10-01",
    readTime: "6 min",
    slug: "how-to-get-bid-bond-tender-security-kenya",
    content: `Many tenders ask for a tender security (bid bond) to show you are serious. If it is missing, in the wrong format or from an unapproved issuer, the bid is rejected without being evaluated.

## What is tender security?

A guarantee from a bank, insurance company or approved institution promising to pay the procuring entity a set amount if you withdraw your bid or refuse to sign the contract after winning. Under Kenyan law it is capped at 2% of the tender price, and the tender document states the exact amount or percentage.

## Where to get it

- **Commercial banks**: usually need cash cover, a fixed deposit or other security.
- **Insurance companies**: insurance bonds are widely accepted and often need less collateral.
- **Microfinance banks and SACCOs**: accepted only where the tender document allows them.

Always check the tender document for which issuers are acceptable.

## What you will need

Company registration documents, KRA PIN and TCC, the tender notice and the security form from the tender document, audited accounts or bank statements, and the issuer's fee (a small percentage of the bond value).

## AGPO bidders

Youth, women and PWD businesses bidding for AGPO-reserved tenders usually submit a Tender-Securing Declaration instead of a paid bond. Read the tender carefully — it will say which applies.

## Getting it right

- Use the exact wording of the form in the tender document.
- Make sure the amount, tender number and validity period match.
- Validity must cover the full tender validity period stated in the document.
- Submit the original if physical submission is required.

## How to avoid losing your security

Do not withdraw your bid after the deadline and sign the contract if you win. Once evaluation ends, unsuccessful bidders' securities are released.

## Next step

Plan the bond as soon as you decide to bid — issuers can take several days. TenderAlert only alerts you to tenders with at least 14 days to prepare, leaving time for bonds and documents.`,
  },
];
