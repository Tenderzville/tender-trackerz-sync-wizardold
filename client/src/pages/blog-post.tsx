import { Link, useRoute } from 'wouter';
import { howToPosts } from '@/content/howto-posts';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import NotFound from '@/pages/not-found';
import { Fragment, type ReactNode } from 'react';

const SITE = 'https://tenderproapp.tenderzville-portal.co.ke';

function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>);
}

function render(content: string) {
  const blocks = content.split(/\n\n+/);
  return blocks.map((b, i) => {
    if (b.startsWith('## ')) return <h2 key={i} className="text-2xl font-semibold mt-8 mb-3">{b.slice(3)}</h2>;
    const lines = b.split('\n');
    if (lines.every((l) => l.startsWith('- '))) {
      return <ul key={i} className="list-disc pl-6 space-y-1 mb-4">{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
    }
    return <p key={i} className="mb-4 leading-relaxed">{inline(b)}</p>;
  });
}

export default function BlogPostPage() {
  const [, params] = useRoute('/blog/:slug');
  const post = howToPosts.find((p) => p.slug === params?.slug);
  if (!post) return <NotFound />;
  const path = `/blog/${post.slug}`;
  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <SEO
        title={post.title}
        description={post.excerpt}
        path={path}
        type="article"
        jsonLd={[
          { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, datePublished: post.date, dateModified: post.date, mainEntityOfPage: `${SITE}${path}`, author: { '@type': 'Organization', name: 'TenderAlert' }, publisher: { '@type': 'Organization', name: 'TenderAlert' } },
          { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE}${path}` },
          ] },
        ]}
      />
      <Link href="/blog" className="text-sm text-muted-foreground underline">← All guides</Link>
      <div className="flex items-center gap-2 mt-4 mb-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{post.category}</Badge><span>{post.date}</span><span>· {post.readTime}</span>
      </div>
      <h1 className="text-3xl font-bold mb-6">{post.title}</h1>
      <div>{render(post.content)}</div>
      <p className="mt-10 text-xs text-muted-foreground border-t pt-4">General information only, not legal or tax advice. Always follow the instructions in the official tender document and on official government portals.</p>
    </article>
  );
}
