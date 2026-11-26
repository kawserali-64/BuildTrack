import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { mongoDb } from '../config/auth';

// ─── Role constants ──────────────────────────────────────────────────────────

const ALL_ASSIGNABLE_ROLES = [
  'Admin',
  'Project Manager',
  'Site Engineer',
  'Finance Manager',
  'Contractor',
];

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the Better Auth 'user' collection. */
const userCollection = () => mongoDb.collection('user');

/** Strips sensitive fields from a user document before returning to client. */
function sanitizeUser(user: Record<string, unknown>) {
  const { password, hashedPassword, ...safe } = user;
  void password;
  void hashedPassword;
  return safe;
}

/** Builds a MongoDB filter from optional query params. */
function buildFilter(query: Record<string, unknown>): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.status && VALID_STATUSES.includes(query.status as string)) {
    filter.status = query.status;
  }
  if (query.role && ALL_ASSIGNABLE_ROLES.includes(query.role as string)) {
    filter.role = query.role;
  }
  return filter;
}

/** Safely parses an integer with a default and clamps to min 1. */
function parsePositiveInt(value: unknown, defaultVal: number): number {
  const n = parseInt(String(value), 10);
  return isNaN(n) || n < 1 ? defaultVal : n;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/users/pending
 * Returns all users with status = 'pending'.
 */
export const getPendingUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userCollection()
      .find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(sanitizeUser),
    });
  } catch (err) {
    console.error('[admin] getPendingUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve pending users.' });
  }
};

/**
 * GET /api/v1/admin/users
 * Lists all users with optional ?status= and ?role= filters and pagination.
 * Query params: status, role, page (default 1), limit (default 20).
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = buildFilter(req.query as Record<string, unknown>);
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      userCollection().find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      userCollection().countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: users.map(sanitizeUser),
    });
  } catch (err) {
    console.error('[admin] getAllUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
};

/**
 * GET /api/v1/admin/users/:id
 * Returns a single user by ID.
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Better Auth stores IDs as plain strings (nanoid), not ObjectIds
    const user = await userCollection().findOne({ id });

    if (!user) {
      res.status(404).json({ success: false, message: `User not found: ${id}` });
      return;
    }

    res.status(200).json({ success: true, data: sanitizeUser(user as Record<string, unknown>) });
  } catch (err) {
    console.error('[admin] getUserById error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve user.' });
  }
};

/**
 * PATCH /api/v1/admin/users/:id/approve
 * Approves a pending user. Optionally accepts { role } body to assign a specific role;
 * falls back to the user's requestedRole.
 *
 * Body: { role?: string }
 */
export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    // Prevent admin from accidentally touching their own record via this endpoint
    if (id === adminId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Administrators cannot approve their own account.',
      });
      return;
    }

    const user = await userCollection().findOne({ id });
    if (!user) {
      res.status(404).json({ success: false, message: `User not found: ${id}` });
      return;
    }

    if (user.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `User is not pending approval. Current status: ${user.status}`,
      });
      return;
    }

    // Determine which role to assign
    const requestedBody = req.body as Record<string, unknown>;
    const assignedRole: string = (() => {
      if (requestedBody.role) {
        if (!ALL_ASSIGNABLE_ROLES.includes(requestedBody.role as string)) {
          return ''; // sentinel for validation error below
        }
        return requestedBody.role as string;
      }
      return (user.requestedRole as string) || 'Project Manager';
    })();

    if (!assignedRole) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Allowed values: [${ALL_ASSIGNABLE_ROLES.join(', ')}]`,
      });
      return;
    }

    const now = new Date();
    await userCollection().updateOne(
      { id },
      {
        $set: {
          status: 'approved',
          role: assignedRole,
          approvedAt: now,
          approvedBy: adminId,
          updatedAt: now,
        },
      }
    );

    const updated = await userCollection().findOne({ id });
    res.status(200).json({
      success: true,
      message: `User approved and assigned role: ${assignedRole}`,
      data: sanitizeUser(updated as Record<string, unknown>),
    });
  } catch (err) {
    console.error('[admin] approveUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve user.' });
  }
};

/**
 * PATCH /api/v1/admin/users/:id/reject
 * Rejects a pending user.
 *
 * Body: { reason?: string }
 */
export const rejectUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    if (id === adminId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Administrators cannot reject their own account.',
      });
      return;
    }

    const user = await userCollection().findOne({ id });
    if (!user) {
      res.status(404).json({ success: false, message: `User not found: ${id}` });
      return;
    }

    if (!['pending', 'approved'].includes(user.status as string)) {
      res.status(400).json({
        success: false,
        message: `Cannot reject user. Current status: ${user.status}`,
      });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const reason: string | undefined =
      typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : undefined;

    const now = new Date();
    await userCollection().updateOne(
      { id },
      {
        $set: {
          status: 'rejected',
          role: 'Unassigned',
          rejectionReason: reason ?? null,
          rejectedAt: now,
          rejectedBy: adminId,
          updatedAt: now,
        },
      }
    );

    const updated = await userCollection().findOne({ id });
    res.status(200).json({
      success: true,
      message: 'User rejected.',
      data: sanitizeUser(updated as Record<string, unknown>),
    });
  } catch (err) {
    console.error('[admin] rejectUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject user.' });
  }
};

/**
 * PATCH /api/v1/admin/users/:id/role
 * Changes the role of an approved user.
 *
 * Body: { role: string }  — required, must be in ALL_ASSIGNABLE_ROLES
 */
export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    // Security: Prevent self-role-escalation
    if (id === adminId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Administrators cannot change their own role.',
      });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const newRole = body.role as string | undefined;

    if (!newRole || !ALL_ASSIGNABLE_ROLES.includes(newRole)) {
      res.status(400).json({
        success: false,
        message: `Invalid or missing "role". Allowed values: [${ALL_ASSIGNABLE_ROLES.join(', ')}]`,
      });
      return;
    }

    const user = await userCollection().findOne({ id });
    if (!user) {
      res.status(404).json({ success: false, message: `User not found: ${id}` });
      return;
    }

    if (user.status !== 'approved') {
      res.status(400).json({
        success: false,
        message: `Role can only be changed for approved users. Current status: ${user.status}`,
      });
      return;
    }

    const now = new Date();
    await userCollection().updateOne(
      { id },
      { $set: { role: newRole, updatedAt: now } }
    );

    const updated = await userCollection().findOne({ id });
    res.status(200).json({
      success: true,
      message: `User role changed to: ${newRole}`,
      data: sanitizeUser(updated as Record<string, unknown>),
    });
  } catch (err) {
    console.error('[admin] changeUserRole error:', err);
    res.status(500).json({ success: false, message: 'Failed to change user role.' });
  }
};
