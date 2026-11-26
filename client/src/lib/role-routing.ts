import type { UserRole } from '@/types/auth.types';

export type WorkspaceRole = Exclude<UserRole, 'Unassigned'>;

export function getRoleFromSlug(slug: string | undefined): WorkspaceRole | undefined {
  switch (slug) {
    case 'admin':
      return 'Admin';
    case 'project-manager':
      return 'Project Manager';
    case 'site-engineer':
      return 'Site Engineer';
    case 'finance-manager':
      return 'Finance Manager';
    case 'contractor':
      return 'Contractor';
    default:
      return undefined;
  }
}

export function getRoleSlug(role: string | null | undefined): string | undefined {
  switch (role) {
    case 'Admin':
      return 'admin';
    case 'Project Manager':
      return 'project-manager';
    case 'Site Engineer':
      return 'site-engineer';
    case 'Finance Manager':
      return 'finance-manager';
    case 'Contractor':
      return 'contractor';
    default:
      return undefined;
  }
}

export function getRoleDashboardPath(role: string | null | undefined): string {
  const slug = getRoleSlug(role);
  return slug ? `/${slug}/dashboard` : '/';
}

export function getRoleProfilePath(role: string | null | undefined): string | undefined {
  switch (role) {
    case 'Admin':
      return '/admin/profile';
    case 'Project Manager':
      return '/project-manager/profile';
    case 'Site Engineer':
      return '/site-engineer/profile';
    case 'Finance Manager':
      return '/finance-manager/profile';
    case 'Contractor':
      return '/contractor/profile';
    default:
      return undefined;
  }
}
