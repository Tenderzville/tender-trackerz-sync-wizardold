import { Link } from 'wouter';
import { ExternalLink } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t border-border mt-12 bg-background">
      <div className="px-4 lg:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <h3 className="font-semibold mb-3">Platform</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/tenders" className="hover:text-foreground">Browse Tenders</Link></li>
            <li><Link href="/smart-matches" className="hover:text-foreground">Smart Matches</Link></li>
            <li><Link href="/rfq" className="hover:text-foreground">RFQ System</Link></li>
            <li><Link href="/providers" className="hover:text-foreground">Service Providers</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Community</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/community" className="hover:text-foreground">Forum</Link></li>
            <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
            <li>
              <a
                href="https://t.me/supplychain_coded"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1"
              >
                Telegram Alerts <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <a
                href="https://sourcekeapp.tenderzville-portal.co.ke/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1"
              >
                Source.ke — B2B Marketplace <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li><Link href="/subscription" className="hover:text-foreground">Subscription</Link></li>
            <li><Link href="/settings" className="hover:text-foreground">Settings</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
            <li><Link href="/profile" className="hover:text-foreground">Profile</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 lg:px-6 py-4 text-xs text-muted-foreground text-center">
        © 2026 TenderAlert · Part of the Tenderzville network ·{' '}
        <a
          href="https://sourcekeapp.tenderzville-portal.co.ke/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline"
        >
          Source.ke
        </a>
      </div>
    </footer>
  );
}
