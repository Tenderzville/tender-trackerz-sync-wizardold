export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  primaryKeyword: string;
  category: string;
  publishedAt: string;
  readTime: string;
  excerpt: string;
  heroAlt: string;
  faqs: { q: string; a: string }[];
  body: string; // markdown
}
