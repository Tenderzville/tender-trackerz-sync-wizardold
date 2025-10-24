import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Home, Search, Bookmark, Users, Brain, BarChart, Package, FileText, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppNavigation() {
  const [location] = useLocation();
  const { user, profile, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl">TenderAlert</h1>
              <p className="text-xs text-muted-foreground">Professional Edition</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/browse', icon: Search, label: 'Browse' },
    { path: '/saved', icon: Bookmark, label: 'Saved' },
    { path: '/consortiums', icon: Users, label: 'Consortiums' },
    { path: '/ai-analysis', icon: Brain, label: 'AI Analysis' },
    { path: '/analytics', icon: BarChart, label: 'Analytics' },
    { path: '/service-providers', icon: Package, label: 'Providers' },
    { path: '/rfq-system', icon: FileText, label: 'RFQ' },
  ];

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl">TenderAlert</h1>
              <p className="text-xs text-muted-foreground">Professional Edition</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location === item.path ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link href={item.path}>
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={profile?.profile_image_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-background" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile Navigation Items */}
                <div className="lg:hidden">
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link href={item.path}>
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
                
                <DropdownMenuItem asChild>
                  <Link href="/subscription">
                    <Settings className="h-4 w-4 mr-2" />
                    Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
