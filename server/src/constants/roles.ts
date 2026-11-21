export const ROLES = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  SITE_ENGINEER: 'Site Engineer',
  FINANCE_MANAGER: 'Finance Manager',
  CONTRACTOR: 'Contractor',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: RoleType[] = [
  ROLES.ADMIN,
  ROLES.PROJECT_MANAGER,
  ROLES.SITE_ENGINEER,
  ROLES.FINANCE_MANAGER,
  ROLES.CONTRACTOR,
];
