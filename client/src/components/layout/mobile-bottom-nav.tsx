import { Home, Search, Heart, Users, User } from "lucide-react";
import { useLocation, Link } from "wouter";

export function MobileBottomNav() {
  const [location] = useLocation();

  const navigation = [
    { name: "Home", href: "/", icon: Home, current: location === "/" },
    { name: "Search", href: "/browse", icon: Search, current: location === "/browse" },
    { name: "Saved", href: "/saved", icon: Heart, current: location === "/saved" },
    { name: "Teams", href: "/consortiums", icon: Users, current: location === "/consortiums" },
    { name: "Analytics", href: "/analytics", icon: User, current: location === "/analytics" },
  ];

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 z-50">
        <div className="grid grid-cols-5 h-16">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                item.current ? "text-primary" : "text-slate-400 dark:text-slate-500"
              }`}
              aria-current={item.current ? "page" : undefined}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
      
      {/* Floating Action Button */}
      <button className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors">
        <span className="text-xl font-bold">+</span>
      </button>
      
      {/* Bottom padding for content */}
      <div className="lg:hidden h-16"></div>
    </>
  );
}
