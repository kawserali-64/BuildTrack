import mongoose from 'mongoose';
import { MaterialRequestModel } from '../models/MaterialRequest';
import { NotificationModel } from '../models/Notification';
import { ProjectModel } from '../models/Project';
import { TaskModel } from '../models/Task';
import { WorkReportModel } from '../models/WorkReport';
import { HttpError } from '../utils/http-error';

interface PageQuery {
  page?: unknown;
  limit?: unknown;
  search?: unknown;
  status?: unknown;
  taskId?: unknown;
  projectId?: unknown;
}

interface ProgressInput {
  progressPercent: unknown;
  note?: unknown;
}

interface WorkReportInput {
  type: unknown;
  workDate: unknown;
  description: unknown;
  progressPercent: unknown;
  photoUrls?: unknown;
}

interface MaterialRequestInput {
  projectId: unknown;
  taskId: unknown;
  reason: unknown;
  items: unknown;
}

function parsePageQuery(query: PageQuery) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, 'page must be a positive integer and limit must be between 1 and 100.');
  }
  return { page, limit, skip: (page - 1) * limit };
}

function parseSearch(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 100) {
    throw new HttpError(400, 'search must be a string of at most 100 characters.');
  }
  return value.trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function requireObjectId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw new HttpError(400, `${field} must be a valid ID.`);
  }
  return value;
}

function parseProgress(value: unknown): number {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    value === '' ||
    ![0, 25, 50, 75, 100].includes(Number(value))
  ) {
    throw new HttpError(400, 'Progress must be 0, 25, 50, 75, or 100.');
  }
  return Number(value);
}

function parseText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new HttpError(400, `${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function parseOptionalText(value: unknown, field: string, maxLength: number): string {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new HttpError(400, `${field} must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

async function getAssignedProjectIds(contractorId: string) {
  return ProjectModel.find({ contractorIds: contractorId }).distinct('_id');
}

async function getAssignedTask(contractorId: string, taskIdValue: unknown) {
  const taskId = requireObjectId(taskIdValue, 'taskId');
  const projectIds = await getAssignedProjectIds(contractorId);
  const task = await TaskModel.findOne({
    _id: taskId,
    projectId: { $in: projectIds },
    assignedContractorIds: contractorId,
  });
  if (!task) throw new HttpError(404, 'Assigned task not found.');
  return task;
}

async function syncProjectProgress(projectId: unknown) {
  const tasks = await TaskModel.find({ projectId }).select('progressPercent').lean();
  if (!tasks.length) return;
  const average = Math.round(
    tasks.reduce((sum, task) => sum + Number(task.progressPercent || 0), 0) / tasks.length,
  );
  await ProjectModel.findByIdAndUpdate(projectId, { $set: { progressPercent: average } });
}

export async function startAssignedTask(contractorId: string, taskIdValue: unknown) {
  const task = await getAssignedTask(contractorId, taskIdValue);
  if (task.status === 'completed' || task.status === 'under_review') {
    throw new HttpError(409, 'This task can no longer be started.');
  }
  task.status = 'in_progress';
  await task.save();

  const project = await ProjectModel.findById(task.projectId).select('managerId');
  if (project) {
    await NotificationModel.create({
      recipientId: project.managerId,
      type: 'task_started',
      title: 'Task started',
      message: `A Contractor started "${task.title}".`,
      relatedProjectId: task.projectId,
      relatedTaskId: task._id,
    });
  }
  return task;
}

export async function getDashboard(contractorId: string) {
  const projectIds = await getAssignedProjectIds(contractorId);
  const taskFilter = {
    projectId: { $in: projectIds },
    assignedContractorIds: contractorId,
  };
  const now = new Date();
  const [
    projectCount,
    activeTaskCount,
    overdueTaskCount,
    pendingRequestCount,
    upcomingDeadlines,
  ] = await Promise.all([
    ProjectModel.countDocuments({ _id: { $in: projectIds }, status: { $ne: 'cancelled' } }),
    TaskModel.countDocuments({ ...taskFilter, status: { $in: ['todo', 'in_progress', 'under_review', 'blocked'] } }),
    TaskModel.countDocuments({
      ...taskFilter,
      dueDate: { $lt: now },
      status: { $nin: ['completed', 'under_review'] },
    }),
    MaterialRequestModel.countDocuments({ contractorId, status: 'pending' }),
    TaskModel.find({
      ...taskFilter,
      dueDate: { $gte: now },
      status: { $nin: ['completed', 'under_review'] },
    })
      .select('title dueDate status priority projectId')
      .populate('projectId', 'name')
      .sort({ dueDate: 1 })
      .limit(5)
      .lean(),
  ]);
  return { projectCount, activeTaskCount, overdueTaskCount, pendingRequestCount, upcomingDeadlines };
}

export async function listAssignedProjects(contractorId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const search = parseSearch(query.search);
  const filter = {
    contractorIds: contractorId,
    ...(search
      ? {
          $or: [
            { name: new RegExp(escapeRegExp(search), 'i') },
            { location: new RegExp(escapeRegExp(search), 'i') },
          ],
        }
      : {}),
  };
  const [data, total] = await Promise.all([
    ProjectModel.find(filter)
      .select('name description location startDate expectedEndDate status progressPercent createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProjectModel.countDocuments(filter),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getAssignedProject(contractorId: string, projectIdValue: unknown) {
  const projectId = requireObjectId(projectIdValue, 'projectId');
  const project = await ProjectModel.findOne({
    _id: projectId,
    contractorIds: contractorId,
  })
    .select('name description location startDate expectedEndDate status progressPercent createdAt updatedAt')
    .lean();
  if (!project) throw new HttpError(404, 'Assigned project not found.');
  return project;
}

export async function listAssignedTasks(contractorId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const search = parseSearch(query.search);
  const projectIds = await getAssignedProjectIds(contractorId);
  const projectId = query.projectId === undefined
    ? undefined
    : requireObjectId(query.projectId, 'projectId');
  if (projectId && !projectIds.some((id) => String(id) === projectId)) {
    throw new HttpError(404, 'Assigned project not found.');
  }
  const taskStatuses = ['todo', 'in_progress', 'under_review', 'completed', 'blocked'];
  if (query.status !== undefined && (typeof query.status !== 'string' || !taskStatuses.includes(query.status))) {
    throw new HttpError(400, 'status is invalid.');
  }
  const filter = {
    projectId: { $in: projectIds },
    assignedContractorIds: contractorId,
    ...(projectId ? { projectId } : {}),
    ...(typeof query.status === 'string' ? { status: query.status } : {}),
    ...(search
      ? { title: new RegExp(escapeRegExp(search), 'i') }
      : {}),
  };
  const [data, total] = await Promise.all([
    TaskModel.find(filter)
      .select('projectId title description priority status dueDate progressPercent progressHistory createdAt updatedAt')
      .populate('projectId', 'name location status')
      .sort({ dueDate: 1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TaskModel.countDocuments(filter),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getAssignedTaskDetails(contractorId: string, taskIdValue: unknown) {
  const taskId = requireObjectId(taskIdValue, 'taskId');
  const projectIds = await getAssignedProjectIds(contractorId);
  const task = await TaskModel.findOne({
    _id: taskId,
    projectId: { $in: projectIds },
    assignedContractorIds: contractorId,
  })
    .select('projectId title description priority status dueDate progressPercent progressHistory createdAt updatedAt')
    .populate('projectId', 'name location status progressPercent')
    .lean();
  if (!task) throw new HttpError(404, 'Assigned task not found.');
  return task;
}

export async function updateAssignedTaskProgress(
  contractorId: string,
  taskIdValue: unknown,
  input: ProgressInput,
) {
  const progressPercent = parseProgress(input.progressPercent);
  const note = parseOptionalText(input.note, 'note', 2000);
  const task = await getAssignedTask(contractorId, taskIdValue);
  if (task.status === 'completed' || task.status === 'under_review') {
    throw new HttpError(409, 'Tasks awaiting completion review or already completed cannot be changed.');
  }

  task.progressPercent = progressPercent;
  task.status = progressPercent === 0 ? 'todo' : 'in_progress';
  task.progressHistory.push({
    progressPercent,
    note,
    updatedBy: contractorId,
    updatedAt: new Date(),
  });
  await task.save();
  await syncProjectProgress(task.projectId);
  const project = await ProjectModel.findById(task.projectId).select('managerId');
  if (project) {
    await NotificationModel.create({
      recipientId: project.managerId,
      type: 'task_progress_updated',
      title: 'Task progress updated',
      message: `A Contractor updated "${task.title}" to ${progressPercent}%.`,
      relatedProjectId: task.projectId,
      relatedTaskId: task._id,
    });
  }
  return task;
}

export async function submitWorkReport(
  contractorId: string,
  taskIdValue: unknown,
  input: WorkReportInput,
) {
  const task = await getAssignedTask(contractorId, taskIdValue);
  if (task.status === 'completed' || task.status === 'under_review') {
    throw new HttpError(409, 'Tasks awaiting completion review or already completed cannot receive new reports.');
  }
  if (input.type !== 'daily' && input.type !== 'completion' && input.type !== 'delay') {
    throw new HttpError(400, 'type must be daily, completion, or delay.');
  }
  const type = input.type;
  const progressPercent = type === 'completion' ? 100 : type === 'delay' ? task.progressPercent : parseProgress(input.progressPercent);
  const description = parseText(input.description, 'description', 5000);
  const workDate = input.workDate === undefined ? new Date() : new Date(String(input.workDate));
  if (Number.isNaN(workDate.getTime())) throw new HttpError(400, 'workDate must be a valid date.');
  const photoUrlsValue = input.photoUrls === undefined ? [] : input.photoUrls;
  if (
    !Array.isArray(photoUrlsValue) ||
    photoUrlsValue.length > 10 ||
    photoUrlsValue.some((value) => {
      if (typeof value !== 'string') return true;
      try {
        const url = new URL(value);
        return !['http:', 'https:'].includes(url.protocol);
      } catch {
        return true;
      }
    })
  ) {
    throw new HttpError(400, 'photoUrls must contain up to 10 valid HTTP or HTTPS URLs.');
  }

  const project = await ProjectModel.findById(task.projectId).select('managerId');
  if (!project) throw new HttpError(404, 'Assigned project not found.');

  const report = await WorkReportModel.create({
    projectId: task.projectId,
    taskId: task._id,
    contractorId,
    type,
    workDate,
    description,
    progressPercent,
    reviewStatus: type === 'completion' ? 'pending' : 'not_required',
    photoUrls: photoUrlsValue,
  });

  if (type === 'completion') {
    task.progressPercent = 100;
    task.status = 'under_review';
  } else if (type === 'delay') {
    task.status = 'blocked';
  } else {
    task.progressPercent = progressPercent;
    task.status = progressPercent === 0 ? 'todo' : 'in_progress';
  }
  task.progressHistory.push({
    progressPercent,
    note: description,
    updatedBy: contractorId,
    updatedAt: new Date(),
  });
  await task.save();
  await syncProjectProgress(task.projectId);
  await NotificationModel.create({
    recipientId: project.managerId,
    type: 'progress_report_submitted',
    title: type === 'completion' ? 'Work completion submitted' : 'Work report submitted',
    message: `A contractor submitted a ${type} report for "${task.title}".`,
    relatedProjectId: task.projectId,
    relatedTaskId: task._id,
  });
  return report;
}

export async function listWorkReports(contractorId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const taskId = query.taskId === undefined
    ? undefined
    : requireObjectId(query.taskId, 'taskId');
  if (taskId) await getAssignedTask(contractorId, taskId);
  const filter = { contractorId, ...(taskId ? { taskId } : {}) };
  const [data, total] = await Promise.all([
    WorkReportModel.find(filter)
      .populate('projectId', 'name location')
      .populate('taskId', 'title status')
      .sort({ workDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WorkReportModel.countDocuments(filter),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function createMaterialRequest(
  contractorId: string,
  input: MaterialRequestInput,
) {
  const projectId = requireObjectId(input.projectId, 'projectId');
  const task = await getAssignedTask(contractorId, input.taskId);
  if (String(task.projectId) !== projectId) {
    throw new HttpError(400, 'The selected task does not belong to the selected project.');
  }
  const reason = parseText(input.reason, 'reason', 2000);
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 50) {
    throw new HttpError(400, 'items must contain between 1 and 50 requested materials.');
  }

  const items = input.items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new HttpError(400, `items[${index}] must be an object.`);
    }
    const material = item as Record<string, unknown>;
    const name = parseText(material.name, `items[${index}].name`, 120);
    const unit = parseText(material.unit, `items[${index}].unit`, 30);
    const quantity = Number(material.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new HttpError(400, `items[${index}].quantity must be greater than zero.`);
    }
    const note = parseOptionalText(material.note, `items[${index}].note`, 500);
    return { name, unit, quantity, note };
  });

  const project = await ProjectModel.findOne({
    _id: projectId,
    contractorIds: contractorId,
  }).select('managerId');
  if (!project) throw new HttpError(404, 'Assigned project not found.');

  const request = await MaterialRequestModel.create({
    projectId,
    taskId: task._id,
    contractorId,
    items,
    reason,
  });
  await NotificationModel.create({
    recipientId: project.managerId,
    type: 'material_request_submitted',
    title: 'Material request submitted',
    message: `A contractor requested materials for "${task.title}".`,
    relatedProjectId: projectId,
    relatedTaskId: task._id,
  });
  return request;
}

export async function listMaterialRequests(contractorId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const requestStatuses = ['pending', 'approved', 'rejected'];
  if (query.status !== undefined && (typeof query.status !== 'string' || !requestStatuses.includes(query.status))) {
    throw new HttpError(400, 'status is invalid.');
  }
  const filter = {
    contractorId,
    ...(typeof query.status === 'string' ? { status: query.status } : {}),
  };
  const [data, total] = await Promise.all([
    MaterialRequestModel.find(filter)
      .populate('projectId', 'name')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MaterialRequestModel.countDocuments(filter),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function listUpcomingDeadlines(contractorId: string) {
  const projectIds = await getAssignedProjectIds(contractorId);
  return TaskModel.find({
    projectId: { $in: projectIds },
    assignedContractorIds: contractorId,
    dueDate: { $ne: null },
    status: { $nin: ['completed', 'under_review'] },
  })
    .select('projectId title priority status dueDate progressPercent')
    .populate('projectId', 'name location')
    .sort({ dueDate: 1 })
    .limit(100)
    .lean();
}

export async function listNotifications(contractorId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const [data, total, unreadCount] = await Promise.all([
    NotificationModel.find({ recipientId: contractorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NotificationModel.countDocuments({ recipientId: contractorId }),
    NotificationModel.countDocuments({ recipientId: contractorId, readAt: null }),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit), unreadCount };
}

export async function markNotificationRead(contractorId: string, notificationIdValue: unknown) {
  const notificationId = requireObjectId(notificationIdValue, 'notificationId');
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, recipientId: contractorId },
    { $set: { readAt: new Date() } },
    { new: true },
  ).lean();
  if (!notification) throw new HttpError(404, 'Notification not found.');
  return notification;
}

export async function getContractorProfile(
  contractorId: string,
  profile: {
    id: string;
    name: string;
    email: string;
    company?: string | null;
    phone?: string | null;
    role: string;
  },
) {
  const projectIds = await getAssignedProjectIds(contractorId);
  const [projectCount, taskCount, completedTaskCount] = await Promise.all([
    ProjectModel.countDocuments({ _id: { $in: projectIds } }),
    TaskModel.countDocuments({
      projectId: { $in: projectIds },
      assignedContractorIds: contractorId,
    }),
    TaskModel.countDocuments({
      projectId: { $in: projectIds },
      assignedContractorIds: contractorId,
      status: 'completed',
    }),
  ]);
  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      company: profile.company ?? null,
      phone: profile.phone ?? null,
      role: profile.role,
    },
    workSummary: { projectCount, taskCount, completedTaskCount },
  };
}
