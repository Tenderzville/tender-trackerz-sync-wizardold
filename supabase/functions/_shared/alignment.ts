// Bid Readiness = how well a tender fits what the supplier told us they bid on,
// and whether there is enough time to prepare. It is computed ONLY from real
// inputs (saved preferences + the tender's published details). It is NOT a
// prediction of winning: we have no per-bidder data to predict that.
//
// Single source of truth, used by the browser (client/src/lib/bid-readiness.ts
// re-exports it) and by the smart-tender-matcher edge function. Keep this file
// free of Deno / browser APIs.

export interface AlignmentPrefs {
  sectors?: string[] | null;
  counties?: string[] | null;
  keywords?: string[] | null;
  budget_min?: number | null;
  budget_max?: number | null;
}

export interface AlignmentTender {
  title?: string | null;
  description?: string | null;
  organization?: string | null;
  category?: string | null;
  location?: string | null;
  budgetEstimate?: number | null;
  budget_estimate?: number | null;
  deadline?: string | null;
}

export type FitLevel = "Strong fit" | "Good fit" | "Moderate fit" | "Low fit";

export interface AlignmentResult {
  /** 0-100, or null when the supplier has not set anything we can score against. */
  score: number | null;
  level: FitLevel | null;
  reasons: string[];
  concerns: string[];
  daysLeft: number | null;
}

// Preference sector label -> tender categories the scrapers store + title words.
const SECTOR_RULES: Record<string, { categories: string[]; words: string[] }> = {
  "construction": { categories: ["construction"], words: ["construction", "building", "road", "bridge", "renovation", "rehabilitation", "classroom", "fencing", "roofing"] },
  "ict & technology": { categories: ["ict", "it services", "technology"], words: ["software", "ict", "computer", "network", "server", "website", "digital", "laptop"] },
  "healthcare": { categories: ["healthcare", "medical"], words: ["medical", "hospital", "pharmaceutical", "laboratory", "drug", "surgical"] },
  "education": { categories: ["education"], words: ["school", "university", "college", "training", "bursary"] },
  "agriculture": { categories: ["agriculture"], words: ["seed", "fertilizer", "fertiliser", "livestock", "agricultur", "irrigation"] },
  "transport & logistics": { categories: ["transport"], words: ["transport", "cargo", "freight", "logistics", "courier", "vehicle", "clearing", "forwarding", "haulage"] },
  "energy & power": { categories: ["energy"], words: ["energy", "power", "electric", "solar", "generator", "transformer", "fuel", "lighting"] },
  "water & sanitation": { categories: ["water"], words: ["water", "sanitation", "sewer", "borehole", "pipeline"] },
  "security services": { categories: ["security"], words: ["security", "guarding", "surveillance", "cctv"] },
  "consultancy": { categories: ["consultancy"], words: ["consultancy", "consultant", "advisory", "feasibility"] },
  "supplies & equipment": { categories: ["supply", "supplies"], words: ["supply", "supplies", "equipment", "delivery of", "provision of"] },
  "financial services": { categories: ["insurance"], words: ["insurance", "audit", "banking", "financial"] },
  "legal services": { categories: [], words: ["legal", "advocate", "law firm"] },
  "environmental services": { categories: ["environment", "cleaning"], words: ["environment", "waste", "cleaning", "garbage"] },
  "mining & extraction": { categories: [], words: ["mining", "quarry", "mineral"] },
  "manufacturing": { categories: [], words: ["manufactur", "fabrication"] },
  "tourism & hospitality": { categories: ["catering"], words: ["hotel", "catering", "tourism", "accommodation", "conference"] },
};

// The preferences screen offers a few towns; map them to their county.
const TOWN_TO_COUNTY: Record<string, string> = {
  eldoret: "uasingishu",
  thika: "kiambu",
  malindi: "kilifi",
  kitale: "transnzoia",
};

const NATIONAL_LOCATIONS = new Set(["kenya", "national", "nationwide", "multicounty", "allcounties"]);

const norm = (s: string) => s.toLowerCase().replace(/\bcounty\b/g, "").replace(/[^a-z0-9]/g, "");
const lower = (s?: string | null) => (s || "").toLowerCase();

function textOf(t: AlignmentTender): string {
  return `${lower(t.title)} ${lower(t.description)}`;
}

function hasWord(text: string, word: string): boolean {
  // word-start match so "road" does not hit "broadband" but "agricultur" hits "agriculture"
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}`).test(text);
}

/** Does this sector (or raw category label) describe the tender? */
export function sectorMatches(sector: string, tender: AlignmentTender): boolean {
  const s = lower(sector).trim();
  if (!s) return false;
  const category = lower(tender.category).trim();
  if (category && category === s) return true;
  const rule = SECTOR_RULES[s];
  if (!rule) return false;
  if (category && rule.categories.includes(category)) return true;
  const text = textOf(tender);
  return rule.words.some((w) => hasWord(text, w));
}

export function matchesAnySector(sectors: Iterable<string>, tender: AlignmentTender): boolean {
  return Array.from(sectors).some((s) => sectorMatches(s, tender));
}

export type LocationMatch = "county" | "national" | null;

/** Does the tender's location fall in one of the supplier's counties? */
export function locationMatchKind(counties: Iterable<string>, location?: string | null): LocationMatch {
  const loc = norm(location || "");
  if (!loc) return null;

  // Real counties only: "Kenya"/"National" entries (e.g. inferred from a saved
  // nationwide tender) are not a county the supplier operates in.
  const real = Array.from(counties)
    .map((c) => norm(c))
    .filter((n) => n && !NATIONAL_LOCATIONS.has(n))
    .map((n) => TOWN_TO_COUNTY[n] ?? n);
  if (real.length === 0) return null; // no county preference -> nothing to compare

  if (NATIONAL_LOCATIONS.has(loc)) return "national";
  return real.some((n) => loc.includes(n)) ? "county" : null;
}

export function daysUntil(deadline?: string | null, now: Date = new Date()): number | null {
  if (!deadline) return null;
  const end = new Date(deadline);
  if (isNaN(end.getTime())) return null;
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((endDay - today) / 86_400_000);
}

const W = { sector: 30, county: 25, keywords: 20, budget: 15, prep: 10 };

export function computeAlignment(
  prefs: AlignmentPrefs | null | undefined,
  tender: AlignmentTender,
  now: Date = new Date()
): AlignmentResult {
  const reasons: string[] = [];
  const concerns: string[] = [];
  let earned = 0;
  let possible = 0;
  let prefCriteria = 0;

  const sectors = (prefs?.sectors || []).filter(Boolean);
  const counties = (prefs?.counties || []).filter(Boolean);
  const keywords = (prefs?.keywords || []).map((k) => k.trim().toLowerCase()).filter((k) => k.length >= 3);
  const budgetMin = Number(prefs?.budget_min) > 0 ? Number(prefs?.budget_min) : 0;
  const budgetMax = Number(prefs?.budget_max) > 0 ? Number(prefs?.budget_max) : Infinity;
  const hasBudgetPref = budgetMin > 0 || budgetMax !== Infinity;
  const budget = Number(tender.budgetEstimate ?? tender.budget_estimate ?? 0);

  // 1. Sector
  if (sectors.length > 0) {
    prefCriteria++;
    possible += W.sector;
    const hit = sectors.find((s) => sectorMatches(s, tender));
    if (hit) {
      earned += W.sector;
      reasons.push(`Sector match: ${hit}`);
    } else {
      concerns.push("Outside the sectors you selected");
    }
  }

  // 2. Location
  if (counties.length > 0 && tender.location) {
    const kind = locationMatchKind(counties, tender.location);
    prefCriteria++;
    possible += W.county;
    if (kind === "county") {
      earned += W.county;
      reasons.push(`In your area: ${tender.location}`);
    } else if (kind === "national") {
      earned += W.county * 0.5;
      reasons.push("Nationwide tender (not tied to one county)");
    } else {
      concerns.push(`Outside your counties (${tender.location})`);
    }
  }

  // 3. Keywords
  if (keywords.length > 0) {
    prefCriteria++;
    possible += W.keywords;
    const text = `${textOf(tender)} ${lower(tender.organization)}`;
    const hits = keywords.filter((k) => text.includes(k));
    if (hits.length >= 2) {
      earned += W.keywords;
      reasons.push(`Keywords found: ${hits.slice(0, 3).join(", ")}`);
    } else if (hits.length === 1) {
      earned += W.keywords * 0.6;
      reasons.push(`Keyword found: ${hits[0]}`);
    } else {
      concerns.push("None of your keywords appear in this tender");
    }
  }

  // 4. Budget: only when both sides gave us a number
  if (hasBudgetPref && budget > 0) {
    prefCriteria++;
    possible += W.budget;
    const inRange = budget >= budgetMin && budget <= budgetMax;
    const dist = budget < budgetMin ? (budgetMin - budget) / budgetMin : budgetMax === Infinity ? 0 : (budget - budgetMax) / budgetMax;
    if (inRange) {
      earned += W.budget;
      reasons.push("Published budget is within your range");
    } else if (dist <= 0.3) {
      earned += W.budget * 0.5;
      reasons.push("Published budget is close to your range");
    } else {
      concerns.push("Published budget is outside your range");
    }
  }

  // 5. Time to prepare (always counts when we know the deadline)
  const daysLeft = daysUntil(tender.deadline, now);
  if (daysLeft !== null) {
    possible += W.prep;
    if (daysLeft >= 21) {
      earned += W.prep;
      reasons.push(`${daysLeft} days left, enough time to prepare`);
    } else if (daysLeft >= 14) {
      earned += W.prep * 0.7;
      reasons.push(`${daysLeft} days left, workable`);
    } else if (daysLeft >= 7) {
      earned += W.prep * 0.3;
      concerns.push(`Only ${daysLeft} days left`);
    } else if (daysLeft >= 0) {
      concerns.push(`Closing in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`);
    } else {
      concerns.push("This tender has closed");
    }
  }

  // Nothing of the supplier's own to compare against -> no score (never a made-up one).
  if (prefCriteria === 0 || possible === 0) {
    return { score: null, level: null, reasons, concerns, daysLeft };
  }

  const score = Math.round((earned / possible) * 100);
  const level: FitLevel = score >= 75 ? "Strong fit" : score >= 55 ? "Good fit" : score >= 35 ? "Moderate fit" : "Low fit";
  return { score, level, reasons, concerns, daysLeft };
}
