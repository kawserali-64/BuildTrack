import { Router } from 'express';
import * as projectManagerController from '../controllers/project-manager.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('Project Manager'));

router.get('/projects', projectManagerController.getProjects);
router.post('/projects', projectManagerController.createProject);
router.get('/tasks', projectManagerController.getTasks);
router.get('/contractors', projectManagerController.getContractors);
router.post('/projects/:projectId/tasks', projectManagerController.createTask);
router.patch('/tasks/:taskId/status', projectManagerController.updateTaskStatus);
router.get('/material-requests', projectManagerController.getMaterialRequests);
router.patch('/material-requests/:requestId/review', projectManagerController.reviewMaterialRequest);
router.get('/work-reports', projectManagerController.getWorkReports);
router.patch('/work-reports/:reportId/review', projectManagerController.reviewWorkReport);

export default router;
