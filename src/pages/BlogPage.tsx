import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { allPosts, getPostBySlug } from "@/content/blog";

const SITE = "https://tenderproapp.tenderzville-portal.co.ke";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

function setJsonLd(id: string, data: unknown) {
  let s = document.getElementById(id) as HTMLScriptElement | null;
  if (!s) {
    s = document.createElement("script");
    s.id = id;
    s.type = "application/ld+json";
    document.head.appendChild(s);
  }
  s.text = JSON.stringify(data);
}

function BlogIndex() {
  useEffect(() => {
    document.title = "TenderPro Blog — Win More Kenyan Tenders in 2026";
    setMeta(
      "description",
      "Practical guides for Kenyan SMEs on winning government tenders, AGPO certification, e-GP, consortium bidding, county procurement and more.",
    );
    setCanonical(`${SITE}/blog`);
    setJsonLd("ld-blog-index", {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "TenderPro Blog",
      url: `${SITE}/blog`,
      blogPost: allPosts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${SITE}/blog/${p.slug}`,
        datePublished: p.publishedAt,
      })),
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-3">TenderPro Blog</h1>
        <p className="text-lg text-muted-foreground">
          Practical, Kenya-specific procurement guides for SMEs, suppliers, and
          consortium bidders. New posts every week.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {allPosts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`}>
            <Card className="p-6 h-full hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{p.category}</Badge>
                <span className="text-xs text-muted-foreground">{p.readTime}</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">{p.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{p.excerpt}</p>
              <span className="text-sm text-primary font-medium">Read article →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BlogPostView({ slug }: { slug: string }) {
  const post = getPostBySlug(slug);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | TenderPro Blog`;
    setMeta("description", post.metaDescription);
    setMeta("keywords", post.primaryKeyword);
    setCanonical(`${SITE}/blog/${post.slug}`);
    setMeta("og:title", post.title, "property");
    setMeta("og:description", post.metaDescription, "property");
    setMeta("og:type", "article", "property");
    setMeta("og:url", `${SITE}/blog/${post.slug}`, "property");
    setMeta("twitter:card", "summary_large_image");

    setJsonLd("ld-article", {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { "@type": "Organization", name: "TenderPro" },
      publisher: {
        "@type": "Organization",
        name: "TenderPro",
        url: SITE,
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
    });
    setJsonLd("ld-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }, [post]);

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link href="/blog">
          <Button>Back to blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/blog">
        <span className="text-sm text-primary cursor-pointer">← All articles</span>
      </Link>

      <header className="my-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString("en-KE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · {post.readTime}
          </span>
        </div>
      </header>

      <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-table:border prose-th:border prose-td:border prose-th:px-3 prose-td:px-3 prose-th:py-2 prose-td:py-2 prose-table:my-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
      </div>

      <section className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {post.faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold">{f.q}</h3>
              <p className="text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 p-6 rounded-lg bg-muted text-center">
        <h3 className="text-xl font-semibold mb-2">Ready to win more Kenyan tenders?</h3>
        <p className="text-muted-foreground mb-4">
          Get matched alerts in under 5 minutes and the bid templates that actually work.
        </p>
        <Link href="/tenders">
          <Button size="lg">Browse Today's Tenders</Button>
        </Link>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const [, params] = useRoute<{ slug: string }>("/blog/:slug");
  if (params?.slug) return <BlogPostView slug={params.slug} />;
  return <BlogIndex />;
}
