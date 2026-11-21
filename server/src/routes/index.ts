import { Router, Request, Response } from 'express';
import healthRoutes from './health.routes';

const router = Router();

// Mount health routes under /health
router.use('/', healthRoutes);

// Root API v1 info
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to BuildTrack REST API v1',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
    },
  });
});

export default router;
