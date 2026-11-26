import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import {
  getPendingUsers,
  getAllUsers,
  getUserById,
  approveUser,
  rejectUser,
  changeUserRole,
} from '../controllers/admin.controller';
import { getSystemTasks } from '../controllers/admin-task.controller';

const router = Router();

// All admin routes require: valid session + approved status + Admin role
router.use(authenticate, requireAdmin);

// ── User management ──────────────────────────────────────────────────────────

/** GET /api/v1/admin/users/pending — list all pending users */
router.get('/users/pending', getPendingUsers);

/** GET /api/v1/admin/users — list all users (filterable: ?status=&role=&page=&limit=) */
router.get('/users', getAllUsers);

/** GET /api/v1/admin/users/:id — get a single user */
router.get('/users/:id', getUserById);

/** PATCH /api/v1/admin/users/:id/approve — approve a pending user */
router.patch('/users/:id/approve', approveUser);

/** PATCH /api/v1/admin/users/:id/reject — reject a user */
router.patch('/users/:id/reject', rejectUser);

/** PATCH /api/v1/admin/users/:id/role — change an approved user's role */
router.patch('/users/:id/role', changeUserRole);

/** GET /api/v1/admin/tasks — read-only, system-wide task monitoring */
router.get('/tasks', getSystemTasks);

export default router;
