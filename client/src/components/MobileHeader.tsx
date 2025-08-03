import { Button } from "@/components/ui/button";
import { Bell, Moon, Sun } from "lucide-react";
import { useThemeContext } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/use-profile";

export function MobileHeader() {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const { user } = useAuth();

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg">TenderAlert</span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 h-auto"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" className="relative p-2 h-auto">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
          </Button>
          {user && (
            <button className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src={user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                alt="User profile" 
                className="w-full h-full object-cover"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
