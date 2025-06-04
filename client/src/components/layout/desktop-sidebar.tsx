
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  Search, 
  Heart, 
  Users, 
  Bot, 
  UserCheck, 
  BarChart3, 
  CreditCard,
  Bell,
  Settings,
  LogOut
} from "lucide-react";

const navigationItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/browse", icon: Search, label: "Browse Tenders" },
  { href: "/saved", icon: Heart, label: "Saved Tenders" },
  { href: "/consortiums", icon: Users, label: "Consortiums" },
  { href: "/ai-analysis", icon: Bot, label: "AI Analysis" },
  { href: "/service-providers", icon: UserCheck, label: "Service Providers" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/subscription", icon: CreditCard, label: "Subscription" },
];

export function DesktopSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getUserDisplayName = () => {
    if (user && typeof user === 'object' && 'firstName' in user && 'lastName' in user) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user && typeof user === 'object' && 'firstName' in user) {
      return user.firstName as string;
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
          <Bell className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-lg">TenderAlert</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
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
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {getCompany()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <div className="flex space-x-2">
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
