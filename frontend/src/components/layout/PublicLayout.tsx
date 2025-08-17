import { useState } from 'react';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface PublicLayoutProps {
  className?: string;
  children: ReactNode;
}

export function PublicLayout({ className, children }: PublicLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        isPublic={true}
        isSidebarOpen={menuOpen}
        onMenuClick={handleMenuClick}
      />
      <main className={cn("flex-grow container mx-auto px-4 py-8", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
