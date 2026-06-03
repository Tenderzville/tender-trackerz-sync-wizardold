import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://tenderproapp.tenderzville-portal.co.ke';
const DEFAULT_IMAGE = `${SITE_URL}/generated-icon.png`;

// Locales we serve. Content is toggled client-side (no /en or /sw prefix in URLs),
// so all alternates resolve to the same canonical URL — this is the supported
// hreflang pattern for single-URL multilingual pages.
const LOCALES: { hreflang: string; }[] = [
  { hreflang: 'en-KE' },
  { hreflang: 'sw-KE' },
  { hreflang: 'en' },
  { hreflang: 'sw' },
];

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Optional keyword string for `<meta name="keywords">` — used for high-intent landing pages. */
  keywords?: string;
}

export function SEO({
  title,
  description,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
  keywords,
}: SEOProps) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes('TenderAlert') || title.includes('TenderPro') ? title : `${title} | TenderAlert Pro`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      {/* hreflang alternates — all locales resolve to the same canonical URL */}
      {LOCALES.map((l) => (
        <link key={l.hreflang} rel="alternate" hrefLang={l.hreflang} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="TenderAlert Pro" />
      <meta property="og:locale" content="en_KE" />
      <meta property="og:locale:alternate" content="sw_KE" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {ldArray.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}

export const SITE = SITE_URL;
