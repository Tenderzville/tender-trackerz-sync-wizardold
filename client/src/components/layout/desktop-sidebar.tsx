
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Home, 
  FileText, 
  Heart, 
  Users, 
  Brain, 
  Store, 
  BarChart3 
} from "lucide-react";
import { useLocation } from "wouter";

export function DesktopSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, current: location === "/" },
    { name: "Browse Tenders", href: "/browse", icon: FileText, current: location === "/browse" },
    { name: "Saved Tenders", href: "/saved", icon: Heart, current: location === "/saved", badge: "12" },
    { name: "Consortiums", href: "/consortiums", icon: Users, current: location === "/consortiums" },
    { name: "AI Analysis", href: "/ai-analysis", icon: Brain, current: location === "/ai-analysis", badge: "NEW" },
    { name: "Service Providers", href: "/service-providers", icon: Store, current: location === "/service-providers" },
    { name: "Analytics", href: "/analytics", icon: BarChart3, current: location === "/analytics" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">TenderAlert</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Professional Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              item.current
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  item.badge === "NEW" 
                    ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {item.badge}
              </Badge>
            )}
          </a>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || undefined} alt="User profile" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user ? getInitials(getUserDisplayName()) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{getUserDisplayName()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.company || "Professional User"}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            asChild
          >
            <a href="/api/logout">
              Sign Out
            </a>
          </Button>
        </div>
      </div>
    </aside>
  );
}
