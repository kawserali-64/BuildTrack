import type { Request } from 'express';
import * as projectManagerService from '../services/project-manager.service';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';

function currentUserId(req: Request): string {
  if (!req.user) throw new HttpError(401, 'Authentication required.');
  return req.user.id;
}

export const getProjects = asyncHandler(async (req, res) => {
  const data = await projectManagerService.listManagerProjects(currentUserId(req), req.query);
  res.status(200).json({ success: true, ...data });
});

export const getTasks = asyncHandler(async (req, res) => {
  const data = await projectManagerService.listManagerTasks(currentUserId(req), req.query);
  res.status(200).json({ success: true, ...data });
});

export const getContractors = asyncHandler(async (req, res) => {
  const data = await projectManagerService.listAssignableContractors(req.query);
  res.status(200).json({ success: true, ...data });
});

export const createProject = asyncHandler(async (req, res) => {
  const data = await projectManagerService.createManagerProject(currentUserId(req), req.body);
  res.status(201).json({ success: true, data });
});

export const createTask = asyncHandler(async (req, res) => {
  const data = await projectManagerService.createManagerTask(currentUserId(req), {
    ...req.body,
    projectId: req.params.projectId,
  });
  res.status(201).json({ success: true, data });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const data = await projectManagerService.updateManagerTaskStatus(
    currentUserId(req),
    req.params.taskId,
    req.body,
  );
  res.status(200).json({ success: true, data });
});

export const getMaterialRequests = asyncHandler(async (req, res) => {
  const data = await projectManagerService.listManagerMaterialRequests(currentUserId(req), req.query);
  res.status(200).json({ success: true, ...data });
});

export const reviewMaterialRequest = asyncHandler(async (req, res) => {
  const data = await projectManagerService.reviewManagerMaterialRequest(
    currentUserId(req),
    req.params.requestId,
    req.body,
  );
  res.status(200).json({ success: true, data });
});

export const getWorkReports = asyncHandler(async (req, res) => {
  const data = await projectManagerService.listManagerWorkReports(currentUserId(req), req.query);
  res.status(200).json({ success: true, ...data });
});

export const reviewWorkReport = asyncHandler(async (req, res) => {
  const data = await projectManagerService.reviewManagerWorkReport(
    currentUserId(req),
    req.params.reportId,
    req.body,
  );
  res.status(200).json({ success: true, data });
});
