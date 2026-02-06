import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Home, Search, Bookmark, Users, Brain, Package, FileText, Settings, Shield, Target, Receipt, Menu, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function AppNavigation() {
  const [location] = useLocation();
  const { user, profile, logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Core nav items (always visible in desktop bar)
  const primaryNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/browse', icon: Search, label: 'Browse' },
    { path: '/smart-matches', icon: Target, label: 'Smart Matches' },
    { path: '/saved', icon: Bookmark, label: 'Saved' },
  ];

  // Secondary nav items (in "More" dropdown on desktop)
  const secondaryNavItems = [
    { path: '/ai-analysis', icon: Brain, label: 'AI Analysis' },
    { path: '/consortiums', icon: Users, label: 'Consortiums' },
    { path: '/service-providers', icon: Package, label: 'Providers' },
    { path: '/rfq-system', icon: FileText, label: 'RFQ System' },
    { path: '/admin/dashboard', icon: Shield, label: 'Admin' },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location === '/' || location === '/dashboard';
    return location.startsWith(path);
  };

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">TenderAlert</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNavItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="h-9"
              >
                <Link href={item.path}>
                  <item.icon className="h-4 w-4 mr-1.5" />
                  {item.label}
                </Link>
              </Button>
            ))}

            {/* More dropdown for secondary items */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={secondaryNavItems.some(item => isActive(item.path)) ? 'default' : 'ghost'}
                  size="sm"
                  className="h-9 gap-1"
                >
                  More
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-background">
                {secondaryNavItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild className={cn(isActive(item.path) && "bg-accent")}>
                    <Link href={item.path}>
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            
            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.profile_image_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {profile?.first_name && profile?.last_name
                            ? `${profile.first_name} ${profile.last_name}`
                            : 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                    {allNavItems.map((item) => (
                      <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)}>
                        <span className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent"
                        )}>
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </span>
                      </Link>
                    ))}
                    <div className="my-2 border-t" />
                    <Link href="/subscription" onClick={() => setMobileOpen(false)}>
                      <span className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        isActive('/subscription') ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                      )}>
                        <Settings className="h-4 w-4" />
                        Subscription
                      </span>
                    </Link>
                    <Link href="/settings" onClick={() => setMobileOpen(false)}>
                      <span className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        isActive('/settings') ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                      )}>
                        <Settings className="h-4 w-4" />
                        Settings
                      </span>
                    </Link>
                    <Link href="/profile" onClick={() => setMobileOpen(false)}>
                      <span className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        isActive('/profile') ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                      )}>
                        <Settings className="h-4 w-4" />
                        Profile
                      </span>
                    </Link>
                  </nav>
                  <div className="p-4 border-t">
                    <Button variant="destructive" className="w-full" size="sm" onClick={() => { logout(); setMobileOpen(false); }}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* User Menu (Desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profile_image_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 bg-background" align="end">
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
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subscription">
                    <Settings className="h-4 w-4 mr-2" />
                    Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/transactions">
                    <Receipt className="h-4 w-4 mr-2" />
                    Transactions
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