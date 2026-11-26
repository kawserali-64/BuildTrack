import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { mongoDb } from '../config/auth';
import { MaterialRequestModel } from '../models/MaterialRequest';
import { NotificationModel } from '../models/Notification';
import { ProjectModel } from '../models/Project';
import { TaskModel } from '../models/Task';
import { WorkReportModel } from '../models/WorkReport';
import { HttpError } from '../utils/http-error';

interface PageQuery {
  page?: unknown;
  limit?: unknown;
  status?: unknown;
}

interface CreateProjectInput {
  name: unknown;
  description?: unknown;
  location?: unknown;
  startDate?: unknown;
  expectedEndDate?: unknown;
  budget?: unknown;
  contractorIds?: unknown;
  status?: unknown;
}

interface CreateTaskInput {
  projectId: unknown;
  title: unknown;
  description?: unknown;
  priority?: unknown;
  dueDate?: unknown;
  contractorIds?: unknown;
}

function parsePageQuery(query: PageQuery) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, 'page must be a positive integer and limit must be between 1 and 100.');
  }
  return { page, limit, skip: (page - 1) * limit };
}

function requireText(value: unknown, field: string, maxLength: number, optional = false): string {
  if (value === undefined && optional) return '';
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > maxLength) {
    throw new HttpError(400, `${field} must be a string of at most ${maxLength} characters.`);
  }
  return value.trim();
}

function parseObjectId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw new HttpError(400, `${field} must be a valid ID.`);
  }
  return value;
}

function parseDate(value: unknown, field: string): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `${field} must be a valid date.`);
  return date;
}

function parseContractorIds(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 200) {
    throw new HttpError(400, 'contractorIds must be an array of at most 200 user IDs.');
  }
  const ids = value.map((id) => {
    if (typeof id !== 'string' || !id.trim() || id.length > 200) {
      throw new HttpError(400, 'Each contractor ID must be a valid user ID.');
    }
    return id.trim();
  });
  if (new Set(ids).size !== ids.length) {
    throw new HttpError(400, 'contractorIds cannot contain duplicates.');
  }
  return ids;
}

function getUserId(user: { id?: unknown; _id?: unknown }): string {
  if (typeof user.id === 'string' && user.id.trim()) return user.id;
  if (user._id instanceof ObjectId) return user._id.toHexString();
  if (typeof user._id === 'string' && user._id.trim()) return user._id;
  return '';
}

async function validateActiveContractors(ids: string[]) {
  if (ids.length === 0) return;
  const collection = mongoDb.collection('user');
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const userFilter = { role: 'Contractor', status: { $in: ['active', 'approved'] } };
  const [usersById, usersByMongoId] = await Promise.all([
    collection
      .find({ ...userFilter, id: { $in: ids } }, { projection: { _id: 1, id: 1 } })
      .toArray(),
    objectIds.length
      ? collection
          .find({ ...userFilter, _id: { $in: objectIds } }, { projection: { _id: 1, id: 1 } })
          .toArray()
      : Promise.resolve([]),
  ]);
  const users = [...usersById, ...usersByMongoId];
  const activeIds = new Set(users.map((user) => getUserId(user)));
  if (activeIds.size !== ids.length) {
    throw new HttpError(400, 'Every assigned user must be an active Contractor account.');
  }
}

async function syncProjectProgress(projectId: unknown) {
  const tasks = await TaskModel.find({ projectId }).select('progressPercent').lean();
  if (!tasks.length) return;
  const average = Math.round(
    tasks.reduce((sum, task) => sum + Number(task.progressPercent || 0), 0) / tasks.length,
  );
  await ProjectModel.findByIdAndUpdate(projectId, { $set: { progressPercent: average } });
}

export async function updateManagerTaskStatus(
  managerId: string,
  taskIdValue: unknown,
  input: { status?: unknown; note?: unknown },
) {
  const taskId = parseObjectId(taskIdValue, 'taskId');
  if (typeof input.status !== 'string' || !['todo', 'in_progress', 'blocked'].includes(input.status)) {
    throw new HttpError(400, 'status must be todo, in_progress, or blocked.');
  }
  const projectIds = await ProjectModel.find({ managerId }).distinct('_id');
  const task = await TaskModel.findOne({ _id: taskId, projectId: { $in: projectIds } });
  if (!task) throw new HttpError(404, 'Task not found for this Project Manager.');
  if (task.status === 'completed' || task.status === 'under_review') {
    throw new HttpError(409, 'Completed or pending-review tasks cannot be changed through this action.');
  }
  task.status = input.status;
  await task.save();

  const note = requireText(input.note, 'note', 2000, true);
  await NotificationModel.insertMany(
    task.assignedContractorIds.map((recipientId: string) => ({
      recipientId,
      type: 'task_status_updated',
      title: 'Task status updated',
      message: `Your task "${task.title}" status changed to ${task.status}.${note ? ` Note: ${note}` : ''}`,
      relatedProjectId: task.projectId,
      relatedTaskId: task._id,
    })),
  );
  return task;
}

export async function listManagerProjects(managerId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const projectStatuses = ['planning', 'ongoing', 'on_hold', 'completed', 'cancelled'];
  if (query.status !== undefined && (typeof query.status !== 'string' || !projectStatuses.includes(query.status))) {
    throw new HttpError(400, 'status is invalid.');
  }
  const filter = {
    managerId,
    ...(typeof query.status === 'string' ? { status: query.status } : {}),
  };
  const [data, total] = await Promise.all([
    ProjectModel.find(filter)
      .select('name description location startDate expectedEndDate budget status progressPercent contractorIds createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProjectModel.countDocuments(filter),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function listManagerTasks(managerId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const taskStatuses = ['todo', 'in_progress', 'under_review', 'completed', 'blocked'];
  if (query.status !== undefined && (typeof query.status !== 'string' || !taskStatuses.includes(query.status))) {
    throw new HttpError(400, 'status is invalid.');
  }
  const projectIds = await ProjectModel.find({ managerId }).distinct('_id');
  const filter = {
    projectId: { $in: projectIds },
    assignedBy: managerId,
    ...(typeof query.status === 'string' ? { status: query.status } : {}),
  };
  const [data, total] = await Promise.all([
    TaskModel.find(filter)
      .select('projectId title description assignedContractorIds priority status dueDate progressPercent createdAt updatedAt')
      .populate('projectId', 'name')
      .sort({ dueDate: 1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TaskModel.countDocuments(filter),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function listAssignableContractors(query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const filter = { role: 'Contractor', status: { $in: ['active', 'approved'] } };
  const [users, total] = await Promise.all([
    mongoDb
      .collection('user')
      .find(filter, { projection: { _id: 1, id: 1, name: 1, email: 1, company: 1 } })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    mongoDb.collection('user').countDocuments(filter),
  ]);
  const data = users.map((user) => {
    const id = getUserId(user);
    if (!id) throw new HttpError(500, 'A Contractor account is missing its user ID.');
    return {
      id,
      name: typeof user.name === 'string' ? user.name : 'Contractor',
      email: typeof user.email === 'string' ? user.email : '',
      company: typeof user.company === 'string' ? user.company : '',
    };
  });
  if (new Set(data.map((user) => user.id)).size !== data.length) {
    throw new HttpError(500, 'Contractor accounts contain duplicate user IDs.');
  }
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function createManagerProject(managerId: string, input: CreateProjectInput) {
  const name = requireText(input.name, 'name', 160);
  const description = requireText(input.description, 'description', 5000, true);
  const location = requireText(input.location, 'location', 300, true);
  const startDate = parseDate(input.startDate, 'startDate');
  const expectedEndDate = parseDate(input.expectedEndDate, 'expectedEndDate');
  if (startDate && expectedEndDate && expectedEndDate < startDate) {
    throw new HttpError(400, 'expectedEndDate cannot be earlier than startDate.');
  }
  if (
    input.budget !== undefined &&
    (typeof input.budget !== 'number' && typeof input.budget !== 'string' || input.budget === '')
  ) {
    throw new HttpError(400, 'budget must be a non-negative number.');
  }
  const budget = input.budget === undefined ? 0 : Number(input.budget);
  if (!Number.isFinite(budget) || budget < 0) {
    throw new HttpError(400, 'budget must be a non-negative number.');
  }
  const allowedStatuses = ['planning', 'ongoing', 'on_hold', 'completed', 'cancelled'];
  const status = input.status === undefined ? 'planning' : input.status;
  if (typeof status !== 'string' || !allowedStatuses.includes(status)) {
    throw new HttpError(400, 'status is invalid.');
  }
  const contractorIds = parseContractorIds(input.contractorIds);
  await validateActiveContractors(contractorIds);

  const project = await ProjectModel.create({
    name,
    description,
    location,
    startDate,
    expectedEndDate,
    budget,
    managerId,
    contractorIds,
    status,
  });
  if (contractorIds.length) {
    await NotificationModel.insertMany(
      contractorIds.map((recipientId) => ({
        recipientId,
        type: 'project_assigned',
        title: 'Project assigned',
        message: `You have been assigned to "${project.name}".`,
        relatedProjectId: project._id,
      })),
    );
  }
  return project;
}

export async function createManagerTask(managerId: string, input: CreateTaskInput) {
  const projectId = parseObjectId(input.projectId, 'projectId');
  const project = await ProjectModel.findOne({ _id: projectId, managerId }).select('contractorIds name');
  if (!project) throw new HttpError(404, 'Project not found for this Project Manager.');

  const title = requireText(input.title, 'title', 200);
  const description = requireText(input.description, 'description', 5000, true);
  const priority = input.priority === undefined ? 'medium' : input.priority;
  if (
    typeof priority !== 'string' ||
    !['low', 'medium', 'high', 'urgent'].includes(priority)
  ) {
    throw new HttpError(400, 'priority must be low, medium, high, or urgent.');
  }
  const dueDate = parseDate(input.dueDate, 'dueDate');
  const assignedContractorIds = parseContractorIds(input.contractorIds);
  const projectContractors = new Set(project.contractorIds);
  if (assignedContractorIds.some((id) => !projectContractors.has(id))) {
    throw new HttpError(400, 'Tasks can only be assigned to Contractors assigned to this project.');
  }
  await validateActiveContractors(assignedContractorIds);

  const task = await TaskModel.create({
    projectId,
    title,
    description,
    priority,
    dueDate,
    assignedBy: managerId,
    assignedContractorIds,
  });
  if (assignedContractorIds.length) {
    await NotificationModel.insertMany(
      assignedContractorIds.map((recipientId) => ({
        recipientId,
        type: 'task_assigned',
        title: 'New task assigned',
        message: `You have been assigned "${task.title}" in "${project.name}". Deadline: ${dueDate?.toLocaleDateString() || 'not set'}.`,
        relatedProjectId: project._id,
        relatedTaskId: task._id,
      })),
    );
  }
  return task;
}

export async function listManagerMaterialRequests(managerId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const projects = await ProjectModel.find({ managerId }).distinct('_id');
  const requestStatuses = ['pending', 'approved', 'rejected'];
  if (query.status !== undefined && (typeof query.status !== 'string' || !requestStatuses.includes(query.status))) {
    throw new HttpError(400, 'status is invalid.');
  }
  const filter = {
    projectId: { $in: projects },
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

export async function reviewManagerMaterialRequest(
  managerId: string,
  requestIdValue: unknown,
  input: { status?: unknown; reviewNote?: unknown },
) {
  const requestId = parseObjectId(requestIdValue, 'requestId');
  if (input.status !== 'approved' && input.status !== 'rejected') {
    throw new HttpError(400, 'status must be approved or rejected.');
  }
  const reviewNote = requireText(input.reviewNote, 'reviewNote', 1000, true);
  const request = await MaterialRequestModel.findById(requestId);
  if (!request) throw new HttpError(404, 'Material request not found.');
  const project = await ProjectModel.findOne({ _id: request.projectId, managerId }).select('name');
  if (!project) throw new HttpError(404, 'Material request not found for this Project Manager.');
  if (request.status !== 'pending') {
    throw new HttpError(409, 'This material request has already been reviewed.');
  }

  request.status = input.status;
  request.reviewedBy = managerId;
  request.reviewedAt = new Date();
  request.reviewNote = reviewNote;
  await request.save();
  await NotificationModel.create({
    recipientId: request.contractorId,
    type: 'material_request_reviewed',
    title: `Material request ${request.status}`,
    message: `Your material request for "${project.name}" was ${request.status}.`,
    relatedProjectId: request.projectId,
    relatedTaskId: request.taskId,
  });
  return request;
}

export async function listManagerWorkReports(managerId: string, query: PageQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  const projects = await ProjectModel.find({ managerId }).distinct('_id');
  const filter = { projectId: { $in: projects } };
  const [data, total] = await Promise.all([
    WorkReportModel.find(filter)
      .populate('projectId', 'name')
      .populate('taskId', 'title')
      .sort({ workDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WorkReportModel.countDocuments(filter),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function reviewManagerWorkReport(
  managerId: string,
  reportIdValue: unknown,
  input: { status?: unknown; reviewNote?: unknown },
) {
  const reportId = parseObjectId(reportIdValue, 'reportId');
  if (input.status !== 'approved' && input.status !== 'rejected') {
    throw new HttpError(400, 'status must be approved or rejected.');
  }
  const reviewNote = requireText(input.reviewNote, 'reviewNote', 1000, true);
  const report = await WorkReportModel.findById(reportId);
  if (!report || report.type !== 'completion') {
    throw new HttpError(404, 'Completion report not found.');
  }
  const project = await ProjectModel.findOne({ _id: report.projectId, managerId }).select('name');
  if (!project) throw new HttpError(404, 'Completion report not found for this Project Manager.');
  if (report.reviewStatus !== 'pending') {
    throw new HttpError(409, 'This completion report has already been reviewed.');
  }

  const task = await TaskModel.findOne({ _id: report.taskId, projectId: report.projectId });
  if (!task || task.status !== 'under_review') {
    throw new HttpError(409, 'The task is no longer waiting for completion review.');
  }
  report.reviewStatus = input.status;
  report.reviewedBy = managerId;
  report.reviewedAt = new Date();
  report.reviewNote = reviewNote;
  task.status = input.status === 'approved' ? 'completed' : 'in_progress';
  if (input.status === 'approved') task.progressPercent = 100;
  await Promise.all([report.save(), task.save()]);
  await syncProjectProgress(task.projectId);
  await NotificationModel.create({
    recipientId: report.contractorId,
    type: 'completion_report_reviewed',
    title: `Completion report ${report.reviewStatus}`,
    message: `Your completion report for "${task.title}" was ${report.reviewStatus}.`,
    relatedProjectId: report.projectId,
    relatedTaskId: report.taskId,
  });
  return report;
}
