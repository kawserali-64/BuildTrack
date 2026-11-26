import { Request, Response, NextFunction } from 'express';

/**
 * Role-based authorization middleware factory.
 *
 * Usage:
 *   router.get('/admin/users', authenticate, authorizeRoles('Admin'), handler)
 *   router.get('/projects', authenticate, authorizeRoles('Admin', 'Project Manager'), handler)
 *
 * Assumes `authenticate` middleware has already run and populated req.user.
 * Returns 403 if the user's role is not in the allowed list.
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
};

/** Convenience alias: restricts access to Admin role only. */
export const requireAdmin = authorizeRoles('Admin');
