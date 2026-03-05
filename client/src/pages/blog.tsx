import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "wouter";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "How to Win Government Tenders in Kenya: A Complete Guide",
    excerpt: "Learn the step-by-step process of identifying, preparing, and submitting winning tender bids to Kenyan government agencies. From registration on eGP Kenya to document preparation.",
    category: "Guide",
    date: "2026-03-01",
    readTime: "8 min",
    slug: "how-to-win-government-tenders-kenya",
  },
  {
    id: "2",
    title: "Understanding eGP Kenya: The New Government Procurement Portal",
    excerpt: "eGP Kenya (egpkenya.go.ke) has replaced the old tenders.go.ke system. Here's everything suppliers need to know about registering and finding opportunities on the new platform.",
    category: "Platform Update",
    date: "2026-02-25",
    readTime: "5 min",
    slug: "understanding-egp-kenya-portal",
  },
  {
    id: "3",
    title: "AGPO Opportunities: Tenders Reserved for Youth, Women & PWDs",
    excerpt: "The Access to Government Procurement Opportunities (AGPO) program reserves 30% of government tenders. Learn how to get certified and access these exclusive opportunities.",
    category: "AGPO",
    date: "2026-02-20",
    readTime: "6 min",
    slug: "agpo-opportunities-youth-women-pwd",
  },
  {
    id: "4",
    title: "Building a Winning Consortium for Large Tenders",
    excerpt: "Many government tenders require capabilities beyond a single company. Learn how to form effective consortiums, define roles, and submit joint bids that stand out.",
    category: "Strategy",
    date: "2026-02-15",
    readTime: "7 min",
    slug: "building-winning-consortium-large-tenders",
  },
  {
    id: "5",
    title: "Top 10 Mistakes Suppliers Make When Bidding for Kenyan Tenders",
    excerpt: "Avoid common pitfalls that disqualify bids before they're even evaluated. From missing documents to incorrect pricing formats, here's what to watch out for.",
    category: "Tips",
    date: "2026-02-10",
    readTime: "6 min",
    slug: "top-mistakes-suppliers-kenyan-tenders",
  },
  {
    id: "6",
    title: "County Government Tenders: Opportunities Beyond Nairobi",
    excerpt: "47 counties publish thousands of tenders annually. Discover how to find and win county-level procurement opportunities across Kenya.",
    category: "Guide",
    date: "2026-02-05",
    readTime: "5 min",
    slug: "county-government-tenders-beyond-nairobi",
  },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Guide: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    "Platform Update": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    AGPO: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    Strategy: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    Tips: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  };
  return colors[category] || "bg-muted text-muted-foreground";
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">TenderAlert Blog</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Expert guides, tips, and insights to help you win more government tenders in Kenya
          </p>
        </div>

        <div className="grid gap-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(post.category)}>{post.category}</Badge>
                    </div>
                    <h2 className="text-xl font-semibold mb-2 hover:text-primary cursor-pointer">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground mb-3">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime} read</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="self-start shrink-0">
                    Read More <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-2">Never Miss a Tender Again</h3>
              <p className="text-muted-foreground mb-4">
                Get real-time alerts for government tenders matching your business profile.
              </p>
              <Button asChild>
                <Link href="/auth">
                  Get Started Free <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
