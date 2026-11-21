export type UserRole =
  | 'Admin'
  | 'Project Manager'
  | 'Site Engineer'
  | 'Finance Manager'
  | 'Contractor';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
