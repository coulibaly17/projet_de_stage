import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

type TeacherLayoutProps = {
  children: ReactNode;
};

export function TeacherLayout({ children }: TeacherLayoutProps) {
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
  
  console.log("Rendu du TeacherLayout avec sidebar verticale, sidebarOpen:", sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar verticale AbloAI */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => toggleSidebar(false)} 
      />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          title="AbloSmart Enseignant"
          onMenuClick={() => toggleSidebar(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen} 
        />
        
        {/* Page Content */}
        <main className={cn("flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-20")}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default TeacherLayout;
