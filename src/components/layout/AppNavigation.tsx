import { Link, useLocation } from 'wouter';
import { 
  Home, 
  FileText, 
  Bookmark, 
  Users, 
  Building2, 
  Bell, 
  Settings, 
  ShieldCheck,
  Brain,
  Handshake,
  CreditCard,
  BarChart3,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: ('admin' | 'moderator' | 'user')[];
  userType?: ('supplier' | 'buyer' | 'all')[];
  badge?: number;
}

export function AppNavigation() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, userRole, signOut } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  // Navigation items with role-based visibility
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: Home, userType: ['all'] },
    { label: 'Browse Tenders', href: '/tenders', icon: FileText, userType: ['all'] },
    { label: 'Saved Tenders', href: '/saved', icon: Bookmark, userType: ['all'] },
    { label: 'Smart Matches', href: '/smart-matches', icon: Brain, userType: ['supplier', 'all'] },
    { label: 'AI Analysis', href: '/ai-analysis', icon: BarChart3, userType: ['all'] },
    { label: 'Consortiums', href: '/consortiums', icon: Handshake, userType: ['all'] },
    { label: 'Service Providers', href: '/providers', icon: Users, userType: ['buyer', 'all'] },
    { label: 'RFQ System', href: '/rfq', icon: Building2, userType: ['all'] },
    { label: 'Subscription', href: '/subscription', icon: CreditCard, userType: ['all'] },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount, userType: ['all'] },
    { label: 'Settings', href: '/settings', icon: Settings, userType: ['all'] },
  ];

  // Admin-only items (hidden from non-admins completely)
  const adminItems: NavItem[] = [
    { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck, roles: ['admin'] },
    { label: 'Automation', href: '/admin/automation', icon: BarChart3, roles: ['admin'] },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => {
    if (item.roles && !item.roles.includes(userRole || 'user')) return false;
    return true;
  });

  // Only show admin items if user is admin
  const visibleAdminItems = isAdmin ? adminItems : [];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar-background border-r border-sidebar-border">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">TenderKenya</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    isActive(item.href)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </span>
              </Link>
            ))}

            {/* Admin Section - Only visible to admins */}
            {visibleAdminItems.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <span className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                    Admin
                  </span>
                </div>
                {visibleAdminItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                        isActive(item.href)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </span>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* User Section */}
          {user && (
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-sidebar-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 capitalize">
                    {userRole || 'User'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">TenderKenya</span>
          </Link>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden fixed top-16 right-0 bottom-0 w-72 bg-background border-l border-border z-50 transform transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <span
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </span>
            </Link>
          ))}

          {/* Admin Section - Mobile */}
          {visibleAdminItems.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              </div>
              {visibleAdminItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <span
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User Section - Mobile */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole || 'User'}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
