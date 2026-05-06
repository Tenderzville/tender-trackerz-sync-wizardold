import { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackOutboundClick } from '@/lib/trackClick';

const DISMISS_KEY = 'sourceke_banner_dismissed_v1';
const SOURCE_KE_URL = 'https://sourcekeapp.tenderzville-portal.co.ke/';

export function SourceKeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const handleClick = () => {
    trackOutboundClick({ destination: SOURCE_KE_URL, source: 'banner', campaign: 'dashboard_promo' });
  };

  return (
    <div className="relative rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 pr-12">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-primary/15 text-primary shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Join the Source.ke supply chain community</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Connect with verified buyers, suppliers, and SCM professionals across Kenya — beyond just tenders.
          </p>
          <Button asChild size="sm" className="mt-3">
            <a
              href={SOURCE_KE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
            >
              Open Source.ke <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
