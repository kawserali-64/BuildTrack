import { Router, Request, Response } from 'express';
import healthRoutes from './health.routes';
import adminRoutes from './admin.routes';
import contractorRoutes from './contractor.routes';
import projectManagerRoutes from './project-manager.routes';

const router = Router();

// Mount health routes
router.use('/', healthRoutes);

// Mount admin routes under /admin
router.use('/admin', adminRoutes);
router.use('/contractor', contractorRoutes);
router.use('/project-manager', projectManagerRoutes);

// Root API v1 info
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to BuildTrack REST API v1',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      admin: {
        pendingUsers: '/api/v1/admin/users/pending',
        allUsers: '/api/v1/admin/users',
        userById: '/api/v1/admin/users/:id',
        approveUser: 'PATCH /api/v1/admin/users/:id/approve',
        rejectUser: 'PATCH /api/v1/admin/users/:id/reject',
        changeRole: 'PATCH /api/v1/admin/users/:id/role',
        allTasks: '/api/v1/admin/tasks',
      },
      contractor: {
        dashboard: '/api/v1/contractor/dashboard',
        assignedProjects: '/api/v1/contractor/projects',
        assignedTasks: '/api/v1/contractor/tasks',
        progress: 'PATCH /api/v1/contractor/tasks/:taskId/progress',
        workReports: '/api/v1/contractor/work-reports',
        materialRequests: '/api/v1/contractor/material-requests',
        deadlines: '/api/v1/contractor/deadlines',
        notifications: '/api/v1/contractor/notifications',
        profile: '/api/v1/contractor/profile',
      },
      projectManager: {
        projects: '/api/v1/project-manager/projects',
        managedTasks: '/api/v1/project-manager/tasks',
        contractors: '/api/v1/project-manager/contractors',
        assignTasks: 'POST /api/v1/project-manager/projects/:projectId/tasks',
        materialRequests: '/api/v1/project-manager/material-requests',
        workReports: '/api/v1/project-manager/work-reports',
      },
    },
  });
});

export default router;
