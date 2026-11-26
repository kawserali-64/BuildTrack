'use client';

import React from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { Footer } from '@/components/common/Footer';
import { useNavbarSidebar } from '@/components/common/Navbar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isMobileSidebarOpen, closeMobileSidebar } = useNavbarSidebar();

  return (
    <div className="flex min-h-0 flex-1 bg-slate-50">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-3">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};
