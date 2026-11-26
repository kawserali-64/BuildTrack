'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { getRoleFromSlug, getRoleSlug } from '@/lib/role-routing';
import { workspaceRoutes } from '@/lib/workspace-routes';

export function GlobalSearch() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending } = useSession();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const user = session?.user as { role?: string } | undefined;
  const roleSlug = getRoleSlug(user?.role);
  const role = getRoleFromSlug(roleSlug);
  const routes = role
    ? workspaceRoutes[role].filter((route) => route.showInSidebar !== false)
    : [];
  const normalizedQuery = query.trim().toLowerCase();
  const matches = (normalizedQuery
    ? routes.filter(
        (route) =>
          route.label.toLowerCase().includes(normalizedQuery) ||
          route.path.toLowerCase().includes(normalizedQuery),
      )
    : routes
  ).slice(0, 7);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  const selectRoute = (path: string) => {
    if (!roleSlug) return;
    router.push(`/${roleSlug}/${path}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' && matches[0]) {
      event.preventDefault();
      selectRoute(matches[0].path);
    }
  };

  const renderInput = () => (
    <input
      type="search"
      aria-label="Global Search"
      placeholder={role ? 'Search modules and pages...' : 'Sign in to search workspace'}
      value={query}
      disabled={isPending || !role}
      onFocus={() => setIsOpen(true)}
      onChange={(event) => {
        setQuery(event.target.value);
        setIsOpen(true);
      }}
      onKeyDown={handleKeyDown}
      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-70"
    />
  );

  return (
    <div ref={searchRef} className="relative flex min-w-0 flex-1 items-center md:max-w-md">
      <label className="relative hidden w-full md:block">
        <span className="sr-only">Global Search</span>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {renderInput()}
      </label>

      <button
        type="button"
        aria-label="Open Global Search"
        disabled={isPending || !role}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      {isOpen && role && (
        <div className="fixed inset-x-3 top-20 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl md:absolute md:inset-x-auto md:left-0 md:right-0 md:top-[calc(100%+0.5rem)]">
          <label className="relative block border-b border-slate-100 p-2 md:hidden">
            <span className="sr-only">Global Search</span>
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            {renderInput()}
          </label>
          <p className="px-3.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace pages
          </p>
          <div className="max-h-[min(60vh,24rem)] overflow-y-auto p-1.5">
            {matches.length > 0 ? (
              matches.map((route) => {
                const Icon = route.icon;
                return (
                  <button
                    key={route.path}
                    type="button"
                    onClick={() => selectRoute(route.path)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-amber-50 hover:text-slate-950"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="flex-1">{route.label}</span>
                    <span className="text-[10px] text-slate-400">{route.path}</span>
                  </button>
                );
              })
            ) : (
              <p className="px-2.5 py-4 text-center text-xs text-slate-500">
                No matching workspace pages.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
