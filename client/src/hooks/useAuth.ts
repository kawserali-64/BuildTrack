'use client';

import { useSession } from '@/lib/auth-client';
import type { AuthUser, UserRole } from '@/types/auth.types';

export const useAuth = () => {
  const { data: session, isPending } = useSession();
  const user = session?.user as Partial<AuthUser> | undefined;
  const role: UserRole = user?.role || 'Unassigned';

  const canAccess = (allowedRoles: UserRole[]): boolean =>
    role === 'Admin' || allowedRoles.includes(role);

  return {
    user,
    role,
    isPending,
    isAuthenticated: Boolean(session),
    canAccess,
    isAdmin: role === 'Admin',
    isPM: role === 'Project Manager',
    isSiteEngineer: role === 'Site Engineer',
    isFinance: role === 'Finance Manager',
    isContractor: role === 'Contractor',
  };
};
