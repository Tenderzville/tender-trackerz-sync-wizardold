import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingBag, Truck, Users, FileText, Megaphone, Network } from 'lucide-react';
import { trackOutboundClick } from '@/lib/trackClick';

const BASE = 'https://sourcekeapp.tenderzville-portal.co.ke';

type LinkItem = {
  title: string;
  description: string;
  url: string;
  audience: 'Suppliers' | 'Buyers' | 'SCM Community' | 'All';
  icon: React.ComponentType<{ className?: string }>;
};

const LINKS: LinkItem[] = [
  { title: 'Source.ke Marketplace', description: 'Browse the full B2B supply chain marketplace.', url: `${BASE}/`, audience: 'All', icon: ShoppingBag },
  { title: 'For Suppliers', description: 'List products & services and get discovered by buyers.', url: `${BASE}/suppliers`, audience: 'Suppliers', icon: Truck },
  { title: 'For Buyers', description: 'Find vetted suppliers and request quotes.', url: `${BASE}/buyers`, audience: 'Buyers', icon: ShoppingBag },
  { title: 'Post an RFQ', description: 'Publish a request for quotation to the supplier network.', url: `${BASE}/rfq`, audience: 'Buyers', icon: FileText },
  { title: 'Supply Chain Community', description: 'Network with SCM professionals across East Africa.', url: `${BASE}/community`, audience: 'SCM Community', icon: Users },
  { title: 'Advertise on Source.ke', description: 'Promote your services to active procurement buyers.', url: `${BASE}/advertise`, audience: 'All', icon: Megaphone },
  { title: 'Tenderzville Network', description: 'Explore the full Tenderzville ecosystem.', url: 'https://tenderzville-portal.co.ke/', audience: 'All', icon: Network },
];

export default function SourceKePage() {
  const handleClick = (link: LinkItem) => {
    trackOutboundClick({
      destination: link.url,
      source: 'sourceke_page',
      campaign: link.audience.toLowerCase().replace(/\s+/g, '_'),
    });
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      <SEO title="Source.ke — Kenyan Supplier Sourcing" description="Source verified Kenyan suppliers and service providers for procurement, projects and consortiums." path="/sourceke" />
      <div>
        <Badge variant="secondary" className="mb-2">Partner network</Badge>
        <h1 className="text-3xl font-bold">Source.ke — B2B Supply Chain Hub</h1>
        <p className="text-muted-foreground mt-2">
          One-click access for suppliers, buyers, and the wider SCM community. Source.ke complements TenderAlert with a marketplace, RFQs, and community beyond government tenders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Card key={link.url} className="hover:border-primary/40 transition">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base">{link.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{link.audience}</Badge>
                </div>
                <CardDescription className="pt-2">{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleClick(link)}
                  >
                    Open <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Source.ke is operated as part of the Tenderzville network. Clicks are logged anonymously to help us measure community growth — no personal data is shared with the destination.
        </CardContent>
      </Card>
    </div>
  );
}
