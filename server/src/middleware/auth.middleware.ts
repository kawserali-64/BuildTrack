import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../config/auth';

/**
 * Authentication middleware — verifies the Better Auth session cookie.
 *
 * ALLOWED statuses (pass through):
 *   'active'   — set by signup hook for all public role registrations
 *   'approved' — set by Admin approval action or seedAdmin bootstrap
 *
 * BLOCKED statuses:
 *   'pending'   — 403: account awaiting admin approval
 *   'rejected'  — 403: registration denied
 *   'suspended' — 403: account suspended by admin
 *
 * No session at all → 401
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!sessionData || !sessionData.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: No active session. Please log in.',
      });
      return;
    }

    const { user, session } = sessionData;
    const status: string = (user as any).status ?? 'pending';

    // ── Active statuses — allowed through ────────────────────────────────────
    const ALLOWED_STATUSES = new Set(['active', 'approved']);

    if (!ALLOWED_STATUSES.has(status)) {
      // Provide a specific, actionable message per blocked status
      if (status === 'pending') {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_PENDING',
          message:
            'Your account is awaiting Administrator approval. You will be notified once your account is activated.',
        });
      } else if (status === 'rejected') {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_REJECTED',
          message:
            'Your registration request was not approved. Please contact support.',
        });
      } else if (status === 'suspended') {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message:
            'Your account has been suspended. Please contact an Administrator.',
        });
      } else {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_INACTIVE',
          message: `Account access denied. Status: ${status}`,
        });
      }
      return;
    }

    // ── Attach real session data to request ───────────────────────────────────
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: (user as any).role ?? 'Unassigned',
      status,
      requestedRole: (user as any).requestedRole ?? '',
      company: (user as any).company ?? null,
      phone: (user as any).phone ?? null,
      approvedAt: (user as any).approvedAt ?? null,
      approvedBy: (user as any).approvedBy ?? null,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };

    req.session = session as object;

    next();
  } catch (err) {
    console.error('[authenticate] Error verifying session:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};
