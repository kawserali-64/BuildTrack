'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useSession } from '@/lib/auth-client';
import {
  getRoleDashboardPath,
  getRoleFromSlug,
  getRoleProfilePath,
  getRoleSlug,
} from '@/lib/role-routing';
import { workspaceRoutes } from '@/lib/workspace-routes';
import {
  Hammer,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const userName = user?.name || 'BuildTrack User';
  const userEmail = user?.email || 'Your workspace';
  const userRole = user?.role || 'Workspace Member';
  const currentRoleSlug = getRoleSlug(userRole);
  const currentRole = getRoleFromSlug(currentRoleSlug);
  const roleRoutes = currentRole ? workspaceRoutes[currentRole] : [];
  const visibleRoutes = roleRoutes.filter((item) => item.showInSidebar !== false);
  const roleDashboardPath = getRoleDashboardPath(userRole);
  const profilePath = getRoleProfilePath(userRole);
  const activePath = visibleRoutes
    .filter((item) => {
      const href = `/${currentRoleSlug}/${item.path}`;
      return pathname === href || pathname.startsWith(`${href}/`);
    })
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const accountSummary = (
    <>
      <Avatar
        initials={initials || 'BT'}
        size="md"
        className="border-0 bg-slate-800 ring-1 ring-white/10"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-bold text-white">{userName}</span>
        <span className="truncate text-[10px] text-slate-400">{userEmail}</span>
        <span className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {userRole}
        </span>
      </span>
    </>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <Link href={roleDashboardPath} onClick={onClose} className="flex items-center gap-3 font-bold tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-900/20">
              <Hammer className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white leading-none">
                BuildTrack
              </span>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mt-1">
                ConstructionTech
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Currency Standard Pill */}
        <div className="px-4 pb-2 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2 text-[11px] text-slate-300">
            <span className="text-slate-400">Workspace currency</span>
            <span className="font-mono font-bold text-amber-400">BDT ৳</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </div>
          {visibleRoutes.map((item) => {
            const href = `/${currentRoleSlug}/${item.path}`;
            const isActive = item.path === activePath;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-amber-400 font-bold text-slate-950 shadow-md shadow-amber-950/20'
                    : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn('shrink-0', isActive ? 'text-slate-950' : 'text-slate-400')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          {isPending ? (
            <div className="h-[4.5rem] animate-pulse rounded-xl bg-white/[0.04]" />
          ) : session ? (
            profilePath ? (
              <Link
                href={profilePath}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3 transition hover:border-white/10 hover:bg-white/[0.07]"
              >
                {accountSummary}
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3">
                {accountSummary}
              </div>
            )
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center rounded-xl bg-amber-400 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Sign in to BuildTrack
            </Link>
          )}
          <p className="px-2 pb-1 pt-3 text-center text-[9px] text-slate-600">
            BuildTrack · Construction intelligence
          </p>
        </div>
      </aside>
    </>
  );
};
