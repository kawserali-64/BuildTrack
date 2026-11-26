import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import mongoose from 'mongoose';
import { ProjectModel } from '../src/models/Project';
import { TaskModel } from '../src/models/Task';
import { getAssignedProject, getAssignedTaskDetails, updateAssignedTaskProgress } from '../src/services/contractor.service';

const restorers: Array<() => void> = [];

function replaceMethod(target: object, key: string, value: unknown) {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, writable: true, value });
  restorers.push(() => {
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else Reflect.deleteProperty(target, key);
  });
}

afterEach(() => {
  while (restorers.length) restorers.pop()?.();
});

test('contractors can only read projects that list their authenticated user ID', async () => {
  let receivedFilter: unknown;
  replaceMethod(ProjectModel, 'findOne', (filter: unknown) => {
    receivedFilter = filter;
    return {
      select() {
        return this;
      },
      async lean() {
        return null;
      },
    };
  });

  await assert.rejects(
    getAssignedProject('contractor-a', '65f000000000000000000001'),
    (error: unknown) => error instanceof Error && 'statusCode' in error && error.statusCode === 404,
  );
  assert.deepEqual(receivedFilter, {
    _id: '65f000000000000000000001',
    contractorIds: 'contractor-a',
  });
});

test('task reads require both project membership and explicit task assignment', async () => {
  const projectId = new mongoose.Types.ObjectId('65f000000000000000000002');
  let receivedProjectFilter: unknown;
  let receivedTaskFilter: unknown;
  replaceMethod(ProjectModel, 'find', (filter: unknown) => {
    receivedProjectFilter = filter;
    return { distinct: async () => [projectId] };
  });
  replaceMethod(TaskModel, 'findOne', (filter: unknown) => {
    receivedTaskFilter = filter;
    return {
      select() {
        return this;
      },
      populate() {
        return this;
      },
      async lean() {
        return null;
      },
    };
  });

  await assert.rejects(
    getAssignedTaskDetails('contractor-a', '65f000000000000000000003'),
    (error: unknown) => error instanceof Error && 'statusCode' in error && error.statusCode === 404,
  );
  assert.deepEqual(receivedProjectFilter, { contractorIds: 'contractor-a' });
  assert.deepEqual(receivedTaskFilter, {
    _id: '65f000000000000000000003',
    projectId: { $in: [projectId] },
    assignedContractorIds: 'contractor-a',
  });
});

test('progress updates fail without changing a task not assigned to the contractor', async () => {
  const projectId = new mongoose.Types.ObjectId('65f000000000000000000004');
  let receivedTaskFilter: unknown;
  replaceMethod(ProjectModel, 'find', () => ({ distinct: async () => [projectId] }));
  replaceMethod(TaskModel, 'findOne', (filter: unknown) => {
    receivedTaskFilter = filter;
    return null;
  });

  await assert.rejects(
    updateAssignedTaskProgress('contractor-a', '65f000000000000000000005', { progressPercent: 75 }),
    (error: unknown) => error instanceof Error && 'statusCode' in error && error.statusCode === 404,
  );
  assert.deepEqual(receivedTaskFilter, {
    _id: '65f000000000000000000005',
    projectId: { $in: [projectId] },
    assignedContractorIds: 'contractor-a',
  });
});

