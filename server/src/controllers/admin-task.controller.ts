import type { Request } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';
import { listSystemTasks } from '../services/admin-task.service';

export const getSystemTasks = asyncHandler(async (req: Request, res) => {
  if (!req.user) throw new HttpError(401, 'Authentication required.');
  const result = await listSystemTasks(req.query);
  res.status(200).json({ success: true, ...result });
});
