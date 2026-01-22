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
  User,
  Send,
  Inbox,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth, UserType } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: ('admin' | 'moderator' | 'user')[];
  visibleTo: ('supplier' | 'buyer' | 'all')[];
  badge?: number;
  description?: string;
}

export function AppNavigation() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, userRole, userType, signOut } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  // BUYER-focused navigation items (RFQ posting, finding suppliers)
  const buyerNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: Home, visibleTo: ['buyer'], description: 'Overview & stats' },
    { label: 'Post RFQ', href: '/rfq', icon: Send, visibleTo: ['buyer'], description: 'Request quotes from suppliers' },
    { label: 'My RFQs', href: '/rfq?tab=my-rfqs', icon: Inbox, visibleTo: ['buyer'], description: 'Manage your requests' },
    { label: 'Find Suppliers', href: '/providers', icon: Users, visibleTo: ['buyer'], description: 'Browse service providers' },
    { label: 'Browse Tenders', href: '/tenders', icon: FileText, visibleTo: ['buyer'], description: 'View public tenders' },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount, visibleTo: ['buyer'] },
    { label: 'Profile', href: '/profile', icon: User, visibleTo: ['buyer'] },
    { label: 'Settings', href: '/settings', icon: Settings, visibleTo: ['buyer'] },
  ];

  // SUPPLIER-focused navigation items (tender browsing, bidding, AI analysis)
  const supplierNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: Home, visibleTo: ['supplier'], description: 'Overview & opportunities' },
    { label: 'Browse Tenders', href: '/tenders', icon: FileText, visibleTo: ['supplier'], description: 'Find opportunities' },
    { label: 'Smart Matches', href: '/smart-matches', icon: Target, visibleTo: ['supplier'], description: 'AI-matched opportunities' },
    { label: 'Saved Tenders', href: '/saved', icon: Bookmark, visibleTo: ['supplier'], description: 'Your bookmarked tenders' },
    { label: 'AI Analysis', href: '/ai-analysis', icon: Brain, visibleTo: ['supplier'], description: 'Win probability & insights' },
    { label: 'Bid on RFQs', href: '/rfq', icon: TrendingUp, visibleTo: ['supplier'], description: 'Submit quotes to buyers' },
    { label: 'Consortiums', href: '/consortiums', icon: Handshake, visibleTo: ['supplier'], description: 'Team up for big tenders' },
    { label: 'My Profile', href: '/providers?tab=my-profile', icon: User, visibleTo: ['supplier'], description: 'Manage supplier profile' },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount, visibleTo: ['supplier'] },
    { label: 'Profile', href: '/profile', icon: User, visibleTo: ['supplier'] },
    { label: 'Settings', href: '/settings', icon: Settings, visibleTo: ['supplier'] },
  ];

  // Default/All users navigation (when user_type not set)
  const defaultNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: Home, visibleTo: ['all'] },
    { label: 'Browse Tenders', href: '/tenders', icon: FileText, visibleTo: ['all'] },
    { label: 'Saved Tenders', href: '/saved', icon: Bookmark, visibleTo: ['all'] },
    { label: 'Smart Matches', href: '/smart-matches', icon: Target, visibleTo: ['all'] },
    { label: 'AI Analysis', href: '/ai-analysis', icon: Brain, visibleTo: ['all'] },
    { label: 'Consortiums', href: '/consortiums', icon: Handshake, visibleTo: ['all'] },
    { label: 'Service Providers', href: '/providers', icon: Users, visibleTo: ['all'] },
    { label: 'RFQ System', href: '/rfq', icon: Building2, visibleTo: ['all'] },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount, visibleTo: ['all'] },
    { label: 'Profile', href: '/profile', icon: User, visibleTo: ['all'] },
    { label: 'Settings', href: '/settings', icon: Settings, visibleTo: ['all'] },
  ];

  // Admin-only items (hidden from non-admins completely)
  const adminItems: NavItem[] = [
    { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck, roles: ['admin'], visibleTo: ['all'] },
    { label: 'Company Verification', href: '/admin/verification', icon: Building2, roles: ['admin'], visibleTo: ['all'] },
    { label: 'Automation', href: '/admin/automation', icon: BarChart3, roles: ['admin'], visibleTo: ['all'] },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href.split('?')[0]);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  // Get navigation items based on user type
  const getNavItemsForUserType = (type: UserType): NavItem[] => {
    if (type === 'buyer') return buyerNavItems;
    if (type === 'supplier') return supplierNavItems;
    return defaultNavItems;
  };

  const visibleNavItems = getNavItemsForUserType(userType);

  // Only show admin items if user is admin
  const visibleAdminItems = isAdmin ? adminItems : [];

  // Get user type label for display
  const getUserTypeLabel = () => {
    if (isAdmin) return 'Admin';
    if (userType === 'buyer') return 'Buyer';
    if (userType === 'supplier') return 'Supplier';
    return userRole || 'User';
  };

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
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  userType === 'buyer' ? 'bg-blue-500/20' : 
                  userType === 'supplier' ? 'bg-green-500/20' : 'bg-sidebar-accent'
                )}>
                  <User className={cn(
                    "w-5 h-5",
                    userType === 'buyer' ? 'text-blue-500' : 
                    userType === 'supplier' ? 'text-green-500' : 'text-sidebar-foreground'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.email}
                  </p>
                  <Badge variant={userType === 'buyer' ? 'default' : userType === 'supplier' ? 'secondary' : 'outline'} className="text-xs">
                    {getUserTypeLabel()}
                  </Badge>
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
                <Badge variant={userType === 'buyer' ? 'default' : userType === 'supplier' ? 'secondary' : 'outline'} className="text-xs">
                  {getUserTypeLabel()}
                </Badge>
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
