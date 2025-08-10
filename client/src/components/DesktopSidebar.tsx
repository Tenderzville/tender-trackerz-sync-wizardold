import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Home, 
  FileText, 
  Heart, 
  Users, 
  Brain, 
  Store, 
  BarChart3,
  Moon,
  Sun,
  Settings 
} from "lucide-react";
import { useThemeContext } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Browse Tenders", href: "/browse", icon: FileText },
  { name: "Saved Tenders", href: "/saved", icon: Heart, badge: "12" },
  { name: "Consortiums", href: "/consortiums", icon: Users },
  { name: "AI Analysis", href: "/ai-analysis", icon: Brain, badge: "NEW", badgeVariant: "secondary" },
  { name: "Service Providers", href: "/service-providers", icon: Store },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Automation", href: "/admin/automation", icon: Settings },
];

export function DesktopSidebar() {
  const [location] = useLocation();
  const { isDarkMode, toggleTheme } = useThemeContext();
  const { user } = useAuth();
  const { profile } = useProfile();

  return (
    <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">TenderAlert</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Professional Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <Badge 
                    variant={item.badgeVariant as any || "default"} 
                    className="ml-auto text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {user && (
          <div className="flex items-center space-x-3 mb-4">
            <img 
              src={profile?.profile_image_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
              alt="User profile" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {profile?.company || "Professional User"}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="outline"
          onClick={toggleTheme}
          className="w-full justify-center space-x-2"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
        </Button>
      </div>
    </aside>
  );
}
