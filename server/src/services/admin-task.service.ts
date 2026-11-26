import mongoose from 'mongoose';
import { mongoDb } from '../config/auth';
import { TaskModel } from '../models/Task';
import { HttpError } from '../utils/http-error';

interface AdminTaskQuery {
  page?: unknown;
  limit?: unknown;
  status?: unknown;
  projectId?: unknown;
  contractorId?: unknown;
  search?: unknown;
}

interface SystemTaskRecord {
  _id: mongoose.Types.ObjectId;
  projectId?: { name?: string; location?: string };
  title: string;
  description?: string;
  assignedBy: string;
  assignedContractorIds: string[];
  priority: string;
  status: string;
  dueDate?: Date;
  progressPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskStatuses = ['todo', 'in_progress', 'under_review', 'completed', 'blocked'] as const;
type TaskStatus = (typeof taskStatuses)[number];

function isTaskStatus(value: string): value is TaskStatus {
  return taskStatuses.some((status) => status === value);
}

function parsePageQuery(query: AdminTaskQuery) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, 'page must be a positive integer and limit must be between 1 and 100.');
  }
  return { page, limit, skip: (page - 1) * limit };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listSystemTasks(query: AdminTaskQuery) {
  const { page, limit, skip } = parsePageQuery(query);
  if (query.status !== undefined && (typeof query.status !== 'string' || !isTaskStatus(query.status))) {
    throw new HttpError(400, 'status is invalid.');
  }

  let projectId: string | undefined;
  if (query.projectId !== undefined) {
    if (typeof query.projectId !== 'string' || !mongoose.isValidObjectId(query.projectId)) {
      throw new HttpError(400, 'projectId must be a valid ID.');
    }
    projectId = query.projectId;
  }

  let contractorId: string | undefined;
  if (query.contractorId !== undefined) {
    if (typeof query.contractorId !== 'string' || !query.contractorId.trim() || query.contractorId.length > 200) {
      throw new HttpError(400, 'contractorId must be a valid user ID.');
    }
    contractorId = query.contractorId.trim();
  }

  let search: string | undefined;
  if (query.search !== undefined) {
    if (typeof query.search !== 'string' || query.search.length > 100) {
      throw new HttpError(400, 'search must be a string of at most 100 characters.');
    }
    search = query.search.trim();
  }

  const filter = {
    ...(typeof query.status === 'string' ? { status: query.status } : {}),
    ...(projectId ? { projectId } : {}),
    ...(contractorId ? { assignedContractorIds: contractorId } : {}),
    ...(search
      ? {
          $or: [
            { title: new RegExp(escapeRegExp(search), 'i') },
            { description: new RegExp(escapeRegExp(search), 'i') },
          ],
        }
      : {}),
  };

  const now = new Date();
  const [tasks, total, statusGroups, overdueCount] = await Promise.all([
    TaskModel.find(filter)
      .select('projectId title description assignedBy assignedContractorIds priority status dueDate progressPercent createdAt updatedAt')
      .populate('projectId', 'name location')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<SystemTaskRecord[]>(),
    TaskModel.countDocuments(filter),
    TaskModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    TaskModel.countDocuments({
      dueDate: { $lt: now },
      status: { $nin: ['completed', 'under_review'] },
    }),
  ]);

  const userIds = new Set<string>();
  for (const task of tasks) {
    userIds.add(task.assignedBy);
    for (const contractorIdValue of task.assignedContractorIds) userIds.add(contractorIdValue);
  }
  const userDocuments = userIds.size
    ? await mongoDb
        .collection('user')
        .find(
          { id: { $in: Array.from(userIds) } },
          { projection: { _id: 0, id: 1, name: 1, company: 1 } },
        )
        .toArray()
    : [];
  const userById = new Map<string, { id: string; name: string; company: string }>();
  for (const user of userDocuments) {
    const userId = typeof user.id === 'string'
      ? user.id
      : user._id === undefined
        ? ''
        : String(user._id);
    if (!userId) continue;
    userById.set(userId, {
      id: userId,
      name: typeof user.name === 'string' ? user.name : 'Unknown user',
      company: typeof user.company === 'string' ? user.company : '',
    });
  }
  const data = tasks.map((task) => ({
    ...task,
    assignedBy: userById.get(task.assignedBy) ?? { id: task.assignedBy, name: 'Unknown user', company: '' },
    assignedContractors: task.assignedContractorIds.map(
      (id) => userById.get(id) ?? { id, name: 'Unknown user', company: '' },
    ),
  }));
  const statusCounts: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    under_review: 0,
    completed: 0,
    blocked: 0,
  };
  for (const group of statusGroups) {
    if (typeof group._id === 'string' && isTaskStatus(group._id)) {
      statusCounts[group._id] = group.count;
    }
  }

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    stats: {
      total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      overdue: overdueCount,
      completed: statusCounts.completed,
      statusCounts,
    },
  };
}
