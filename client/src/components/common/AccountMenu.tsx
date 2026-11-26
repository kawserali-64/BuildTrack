'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { authClient, useSession } from '@/lib/auth-client';
import { getRoleDashboardPath, getRoleProfilePath } from '@/lib/role-routing';

interface AccountMenuProps {
  fallback: React.ReactNode;
  authenticatedAction?: React.ReactNode;
  signOutRedirect?: string;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  fallback,
  authenticatedAction,
  signOutRedirect = '/login',
}) => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const userName = user?.name || 'BuildTrack User';
  const userEmail = user?.email || '';
  const userRole = user?.role || 'Workspace Member';
  const dashboardPath = getRoleDashboardPath(userRole);
  const profilePath = getRoleProfilePath(userRole);
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(result.error.message || 'Unable to sign out. Please try again.');
        return;
      }
      router.replace(signOutRedirect);
      router.refresh();
    } catch (error) {
      console.error('[account-menu] Sign out failed:', error);
      setSignOutError('Unable to sign out. Please try again.');
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {isPending ? (
        <div
          aria-label="Loading account"
          className="h-9 w-9 animate-pulse rounded-full bg-slate-100"
        />
      ) : session ? (
        <>
          {authenticatedAction}
          <nav aria-label="Account navigation" className="flex items-center gap-1">
            <Link
              href={dashboardPath}
              aria-label="Dashboard"
              title="Dashboard"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:w-auto lg:gap-1.5 lg:px-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden text-xs font-semibold lg:inline">Dashboard</span>
            </Link>
            {profilePath && (
              <Link
                href={profilePath}
                aria-label="Profile settings"
                title="Profile settings"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:w-auto lg:gap-1.5 lg:px-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden text-xs font-semibold lg:inline">Profile Settings</span>
              </Link>
            )}
          </nav>
          <div
            aria-label={`Signed in as ${userName}, ${userRole}`}
            title={userEmail ? `${userName} - ${userEmail}` : `${userName} - ${userRole}`}
            className="flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1"
          >
            <Avatar
              initials={initials || 'BT'}
              size="sm"
              className="border-0 bg-slate-900 ring-2 ring-amber-100"
            />
            <span className="hidden min-w-0 xl:block">
              <span className="block max-w-28 truncate text-xs font-bold text-slate-800">
                {userName}
              </span>
              <span className="block max-w-28 truncate text-[10px] text-slate-500">
                {userRole}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Logout"
            title="Logout"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:w-auto lg:gap-1.5 lg:px-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden text-xs font-semibold lg:inline">Logout</span>
          </button>
        </>
      ) : (
        fallback
      )}
      {signOutError && (
        <div
          role="alert"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-w-xs rounded-xl border border-red-200 bg-white px-4 py-3 text-xs font-medium text-red-700 shadow-lg"
        >
          <div className="mb-1 flex items-center gap-2 font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sign out failed
          </div>
          {signOutError}
        </div>
      )}
    </div>
  );
};
