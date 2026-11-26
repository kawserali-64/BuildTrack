import { Router } from 'express';
import * as contractorController from '../controllers/contractor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('Contractor'));

router.get('/dashboard', contractorController.getDashboard);
router.get('/projects', contractorController.getProjects);
router.get('/projects/:projectId', contractorController.getProject);
router.get('/tasks', contractorController.getTasks);
router.get('/tasks/:taskId', contractorController.getTask);
router.get('/tasks/:taskId/reports', contractorController.getTaskReports);
router.patch('/tasks/:taskId/start', contractorController.startTask);
router.patch('/tasks/:taskId/progress', contractorController.updateTaskProgress);
router.post('/tasks/:taskId/reports', contractorController.submitWorkReport);
router.get('/work-reports', contractorController.getWorkReports);
router.get('/material-requests', contractorController.getMaterialRequests);
router.post('/material-requests', contractorController.createMaterialRequest);
router.get('/deadlines', contractorController.getDeadlines);
router.get('/notifications', contractorController.getNotifications);
router.patch('/notifications/:notificationId/read', contractorController.readNotification);
router.get('/profile', contractorController.getProfile);

export default router;
