import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'ok',
    message: 'BuildTrack API server is operational',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      readyState: dbState,
    },
  });
});

export default router;
