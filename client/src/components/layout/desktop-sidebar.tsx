
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  Search, 
  Heart, 
  Users, 
  UserCheck, 
  BarChart3, 
  CreditCard,
  Bell,
  Settings,
  LogOut,
  FileText,
  Briefcase,
  Brain,
  RefreshCw,
  TrendingUp,
  Megaphone,
  GraduationCap
} from "lucide-react";

const navigationItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/browse", icon: Search, labelKey: "nav.browse" },
  { href: "/saved", icon: Heart, labelKey: "nav.saved" },
  { href: "/consortiums", icon: Users, labelKey: "nav.consortiums" },
  { href: "/service-providers", icon: Briefcase, labelKey: "nav.providers" },
  { href: "/marketplace", icon: Megaphone, labelKey: "nav.marketplace" },
  { href: "/rfq-system", icon: FileText, labelKey: "nav.rfq" },
  { href: "/ai-analysis", icon: Brain, labelKey: "nav.ai" },
  { href: "/learning", icon: GraduationCap, labelKey: "nav.learning" },
  { href: "/performance", icon: TrendingUp, labelKey: "nav.performance" },
  { href: "/analytics", icon: BarChart3, labelKey: "nav.analytics" },
  { href: "/trigger-scraper", icon: RefreshCw, labelKey: "nav.refresh" },
  { href: "/profile", icon: UserCheck, labelKey: "nav.profile" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings" },
  { href: "/subscription", icon: CreditCard, labelKey: "nav.subscription" },
];

export function DesktopSidebar() {
  const { t } = useI18n();
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getUserDisplayName = () => {
    if (user && typeof user === 'object' && 'firstName' in user && 'lastName' in user) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user && typeof user === 'object' && 'firstName' in user) {
      return user.firstName as string;
    } else if (user && typeof user === 'object' && 'email' in user) {
      return (user.email as string).split('@')[0];
    }
    return 'User';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileImageUrl = () => {
    if (user && typeof user === 'object' && 'profileImageUrl' in user) {
      return user.profileImageUrl as string;
    }
    return undefined;
  };

  const getCompany = () => {
    if (user && typeof user === 'object' && 'company' in user) {
      return user.company as string;
    }
    return undefined;
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:dark:bg-slate-800 lg:border-r lg:border-slate-200 lg:dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center space-x-3 p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg">TenderAlert</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
            </a>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getProfileImageUrl()} alt="User profile" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(getUserDisplayName())}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
            {getCompany() && (
              <p className="text-xs text-muted-foreground truncate">
                {getCompany()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
