'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import { getRoleDashboardPath } from '@/lib/role-routing';
import type { WorkspaceRole } from '@/lib/role-routing';

interface RoleWorkspaceLayoutProps {
  role: WorkspaceRole;
  children: React.ReactNode;
}

export function RoleWorkspaceLayout({ role, children }: RoleWorkspaceLayoutProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const userRole = user?.role;
  const hasAccess = Boolean(session && userRole === role);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace('/login');
    } else if (userRole !== role) {
      router.replace(getRoleDashboardPath(userRole));
    }
  }, [isPending, role, router, session, userRole]);

  if (!hasAccess) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Skeleton className="mb-3 h-6 w-32" />
            <Skeleton className="mb-2 h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
