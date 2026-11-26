// Extends Express Request with Better Auth user and session payloads.
// This file is loaded automatically by TypeScript via typeRoots / include globs.

declare namespace Express {
  interface Request {
    /** Authenticated user populated by the `authenticate` middleware. */
    user?: {
      id: string;
      email: string;
      name: string;
      /** Server-controlled role (never trusted from client). */
      role: string;
      /** Approval lifecycle status: pending | approved | rejected | suspended */
      status: string;
      /** Role the user requested at signup time. */
      requestedRole: string;
      company?: string | null;
      phone?: string | null;
      approvedAt?: Date | null;
      approvedBy?: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    /** Raw Better Auth session object populated alongside req.user. */
    session?: object;
  }
}
