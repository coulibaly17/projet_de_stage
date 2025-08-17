import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  className?: string;
  children: React.ReactNode;
}

export function AppLayout({ className, children }: AppLayoutProps) {
  // Utiliser localStorage pour persister l'état de la sidebar entre les navigations
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Récupérer l'état depuis localStorage ou utiliser true par défaut
    const savedState = localStorage.getItem('sidebarOpen');
    return savedState !== null ? savedState === 'true' : true;
  });
  
  // Mettre à jour localStorage quand l'état change
  const toggleSidebar = (newState: boolean) => {
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };
  
  // Ajouter un log pour débugger le rendu du layout
  console.log("Rendu du AppLayout, sidebarOpen:", sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Assurer qu'elle s'affiche correctement */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => toggleSidebar(false)} 
      />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => toggleSidebar(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        {/* Page Content */}
        <main className={cn("flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-20", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
