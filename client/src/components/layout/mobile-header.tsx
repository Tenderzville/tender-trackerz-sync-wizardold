
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function MobileHeader() {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user && typeof user === 'object' && 'firstName' in user && 'lastName' in user) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user && typeof user === 'object' && 'firstName' in user) {
      return user.firstName as string;
    }
    if (user && typeof user === 'object' && 'email' in user) {
      return (user.email as string).split('@')[0];
    }
    return 'User';
  };

  const getProfileImageUrl = () => {
    if (user && typeof user === 'object' && 'profileImageUrl' in user) {
      return user.profileImageUrl as string;
    }
    return undefined;
  };

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg">TenderAlert</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <NotificationBell />
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={getProfileImageUrl()} alt="User profile" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user ? getInitials(getUserDisplayName()) : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
