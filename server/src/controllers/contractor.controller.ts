import type { Request, Response } from 'express';
import * as contractorService from '../services/contractor.service';
import { asyncHandler } from '../utils/async-handler';
import { HttpError } from '../utils/http-error';

function currentUser(req: Request) {
  if (!req.user) throw new HttpError(401, 'Authentication required.');
  return req.user;
}

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await contractorService.getDashboard(currentUser(req).id);
  res.status(200).json({ success: true, data });
});

export const getProjects = asyncHandler(async (req, res) => {
  const data = await contractorService.listAssignedProjects(currentUser(req).id, req.query);
  res.status(200).json({ success: true, ...data });
});

export const getProject = asyncHandler(async (req, res) => {
  const data = await contractorService.getAssignedProject(currentUser(req).id, req.params.projectId);
  res.status(200).json({ success: true, data });
});

export const getTasks = asyncHandler(async (req, res) => {
  const data = await contractorService.listAssignedTasks(currentUser(req).id, req.query);
  res.status(200).json({ success: true, ...data });
});

export const getTask = asyncHandler(async (req, res) => {
  const data = await contractorService.getAssignedTaskDetails(currentUser(req).id, req.params.taskId);
  res.status(200).json({ success: true, data });
});

export const updateTaskProgress = asyncHandler(async (req, res) => {
  const data = await contractorService.updateAssignedTaskProgress(
    currentUser(req).id,
    req.params.taskId,
    req.body,
  );
  res.status(200).json({ success: true, data });
});

export const startTask = asyncHandler(async (req, res) => {
  const data = await contractorService.startAssignedTask(
    currentUser(req).id,
    req.params.taskId,
  );
  res.status(200).json({ success: true, data });
});

export const submitWorkReport = asyncHandler(async (req, res) => {
  const data = await contractorService.submitWorkReport(
    currentUser(req).id,
    req.params.taskId,
    req.body,
  );
  res.status(201).json({ success: true, data });
});

export const getWorkReports = asyncHandler(async (req, res) => {
  const data = await contractorService.listWorkReports(currentUser(req).id, req.query);
  res.status(200).json({ success: true, ...data });
});

export const createMaterialRequest = asyncHandler(async (req, res) => {
  const data = await contractorService.createMaterialRequest(currentUser(req).id, req.body);
  res.status(201).json({ success: true, data });
});

export const getMaterialRequests = asyncHandler(async (req, res) => {
  const data = await contractorService.listMaterialRequests(currentUser(req).id, req.query);
  res.status(200).json({ success: true, ...data });
});

export const getDeadlines = asyncHandler(async (req, res) => {
  const data = await contractorService.listUpcomingDeadlines(currentUser(req).id);
  res.status(200).json({ success: true, data });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const data = await contractorService.listNotifications(currentUser(req).id, req.query);
  res.status(200).json({ success: true, ...data });
});

export const readNotification = asyncHandler(async (req, res) => {
  const data = await contractorService.markNotificationRead(
    currentUser(req).id,
    req.params.notificationId,
  );
  res.status(200).json({ success: true, data });
});

export const getProfile = asyncHandler(async (req, res) => {
  const data = await contractorService.getContractorProfile(currentUser(req).id, currentUser(req));
  res.status(200).json({ success: true, data });
});

export const getTaskReports = asyncHandler(async (req, res) => {
  const data = await contractorService.listWorkReports(currentUser(req).id, {
    ...req.query,
    taskId: req.params.taskId,
  });
  res.status(200).json({ success: true, ...data });
});
