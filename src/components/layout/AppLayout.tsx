import { ReactNode } from 'react';
import { AppNavigation } from './AppNavigation';
import { AppFooter } from './AppFooter';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavigation />
      <main className="lg:pl-64 pt-16 lg:pt-0 flex-1">
        <div className="p-4 lg:p-6">
          {children}
        </div>
        <div className="lg:pl-0">
          <AppFooter />
        </div>
      </main>
    </div>
  );
}

