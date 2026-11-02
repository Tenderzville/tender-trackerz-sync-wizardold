// Email sanity checks run BEFORE we ask Supabase Auth to send anything.
// Every confirmation / magic-link / reset email to a mistyped or fake address
// is a bounce, and Supabase restricts projects whose bounce rate stays high.

const TYPO_DOMAINS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "hotnail.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
};

// Throwaway / placeholder domains that never receive real mail.
const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "test.com",
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "tempmail.com",
  "trashmail.com",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type EmailCheck = { ok: true; email: string } | { ok: false; reason: string };

export function checkEmail(raw: string): EmailCheck {
  const email = (raw || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, reason: "Please enter a valid email address." };
  }
  const domain = email.split("@")[1];
  if (TYPO_DOMAINS[domain]) {
    return { ok: false, reason: `Did you mean ${email.split("@")[0]}@${TYPO_DOMAINS[domain]}?` };
  }
  if (BLOCKED_DOMAINS.has(domain)) {
    return { ok: false, reason: "Please use a real email address that you can receive mail on." };
  }
  return { ok: true, email };
}
