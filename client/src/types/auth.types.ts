/**
 * Auth-related TypeScript types for BuildTrack.
 * These types describe accounts and sessions managed by Better Auth.
 */

/** The four roles a user can request at signup. Admin is never public. */
export type PublicRole =
  | 'Project Manager'
  | 'Site Engineer'
  | 'Finance Manager'
  | 'Contractor';

/** All roles that exist in the system (server-side). */
export type UserRole = 'Admin' | PublicRole | 'Unassigned';

/** Account lifecycle status (server-controlled). */
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

/** The four public roles available at signup — ordered for display. */
export const PUBLIC_ROLES: PublicRole[] = [
  'Project Manager',
  'Site Engineer',
  'Finance Manager',
  'Contractor',
];

/** Descriptions shown next to each role option on the signup form. */
export const ROLE_DESCRIPTIONS: Record<PublicRole, string> = {
  'Project Manager': 'Plan, schedule, and oversee construction projects end-to-end.',
  'Site Engineer': 'Manage on-site work, tasks, and daily progress reporting.',
  'Finance Manager': 'Handle budgets, expenses, payments, and financial reporting.',
  'Contractor': 'View assigned work, submit progress, and track materials.',
};

/**
 * The shape of the authenticated user returned by Better Auth's session.
 * Includes the custom fields configured in server/src/config/auth.ts.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** Server-controlled role. Never set by client. */
  role: UserRole;
  /** Account lifecycle status. Never set by client. */
  status: UserStatus;
  /** The role the user requested at signup. */
  requestedRole: PublicRole;
  company?: string | null;
  phone?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
