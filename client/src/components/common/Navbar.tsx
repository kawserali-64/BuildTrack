'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, Hammer, Menu } from 'lucide-react';
import { AccountMenu } from '@/components/common/AccountMenu';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import { NotificationsMenu } from '@/components/common/NotificationsMenu';
import { getRoleFromSlug } from '@/lib/role-routing';

interface NavbarProps {
  children: React.ReactNode;
}

interface SidebarContextValue {
  isMobileSidebarOpen: boolean;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export const useNavbarSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useNavbarSidebar must be used within the global Navbar');
  }
  return context;
};

export const Navbar: React.FC<NavbarProps> = ({ children }) => {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isLandingPage = pathname === '/';
  const pathSegments = pathname.split('/').filter(Boolean);
  const isWorkspacePage = Boolean(getRoleFromSlug(pathSegments[0]));
  const loggedOutActions =
    pathname === '/login' ? (
      <Link
        href="/signup"
        className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
      >
        Create account
      </Link>
    ) : pathname === '/signup' ? (
      <Link
        href="/login"
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Sign in
      </Link>
    ) : (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Login
        </Link>
        {isLandingPage && (
          <Link
            href="/signup"
            className="hidden rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 sm:inline-flex"
          >
            Get started
          </Link>
        )}
      </div>
    );

  const sidebarContext: SidebarContextValue = {
    isMobileSidebarOpen,
    closeMobileSidebar: () => setIsMobileSidebarOpen(false),
    openMobileSidebar: () => setIsMobileSidebarOpen(true),
  };

  return (
    <SidebarContext.Provider value={sidebarContext}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-3">
            <div className="flex min-w-0 items-center gap-3">
              {isWorkspacePage && (
                <button
                  type="button"
                  onClick={sidebarContext.openMobileSidebar}
                  aria-label="Open navigation menu"
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <Link href="/" className="flex shrink-0 items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-xs">
                  <Hammer className="h-5 w-5" />
                </div>
                <span className="flex flex-col">
                  <span className="text-base font-black leading-none tracking-tight text-slate-900">
                    BuildTrack
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                    ConstructionTech
                  </span>
                </span>
              </Link>
            </div>

            <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-4">
              <GlobalSearch />
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <NotificationsMenu />
              {isWorkspacePage && (
                <div className="hidden items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50/70 px-2.5 py-1.5 text-xs font-semibold text-amber-900 sm:flex">
                  <Coins className="h-3.5 w-3.5 text-amber-600" />
                  <span>BDT</span>
                </div>
              )}
              <AccountMenu
                fallback={loggedOutActions}
                signOutRedirect="/"
              />
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </SidebarContext.Provider>
  );
};
