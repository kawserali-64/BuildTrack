'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type ManagerSection =
  | 'projects'
  | 'create-project'
  | 'tasks'
  | 'kanban'
  | 'contractors'
  | 'budgets'
  | 'expenses'
  | 'analytics'
  | 'milestones'
  | 'materials'
  | 'reports';

interface ContractorOption {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface ManagerProject {
  _id: string;
  name: string;
  location?: string;
  status: string;
  startDate?: string;
  expectedEndDate?: string;
  budget?: number;
  contractorIds: string[];
  progressPercent: number;
}

interface ManagerTask {
  _id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  progressPercent: number;
  projectId?: string | { name?: string };
  assignedContractorIds: string[];
}

interface ManagerMaterialRequest {
  _id: string;
  contractorId: string;
  status: string;
  reason: string;
  items: Array<{ name: string; quantity: number; unit: string }>;
  projectId?: { name?: string };
  taskId?: { title?: string };
  createdAt: string;
}

interface ManagerWorkReport {
  _id: string;
  contractorId: string;
  type: string;
  reviewStatus: string;
  workDate: string;
  description: string;
  progressPercent: number;
  projectId?: { name?: string };
  taskId?: { title?: string };
  photoUrls: string[];
}

interface ListResult<T> {
  data: T[];
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <Card><CardContent className="space-y-4 p-5"><h2 className="text-sm font-bold text-slate-900">{title}</h2>{children}</CardContent></Card>;
}

export function ProjectManagerModulePage({ section }: { section: ManagerSection }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [projects, setProjects] = useState<ManagerProject[]>([]);
  const [tasks, setTasks] = useState<ManagerTask[]>([]);
  const [contractors, setContractors] = useState<ContractorOption[]>([]);
  const [requests, setRequests] = useState<ManagerMaterialRequest[]>([]);
  const [workReports, setWorkReports] = useState<ManagerWorkReport[]>([]);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [projectContractors, setProjectContractors] = useState<string[]>([]);
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskContractors, setTaskContractors] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        if (section === 'projects') {
          const response = await apiClient.get<ListResult<ManagerProject>>('/project-manager/projects?limit=100');
          if (active) setProjects(response.data.data);
        } else if (section === 'create-project') {
          const response = await apiClient.get<ListResult<ContractorOption>>('/project-manager/contractors?limit=100');
          if (active) setContractors(response.data.data);
        } else if (section === 'tasks') {
          const [projectResponse, contractorResponse, taskResponse] = await Promise.all([
            apiClient.get<ListResult<ManagerProject>>('/project-manager/projects?limit=100'),
            apiClient.get<ListResult<ContractorOption>>('/project-manager/contractors?limit=100'),
            apiClient.get<ListResult<ManagerTask>>('/project-manager/tasks?limit=100'),
          ]);
          if (active) {
            setProjects(projectResponse.data.data);
            setContractors(contractorResponse.data.data);
            setTasks(taskResponse.data.data);
            setTaskProjectId((current) => current || projectResponse.data.data[0]?._id || '');
          }
        } else if (section === 'kanban') {
          const [projectResponse, taskResponse] = await Promise.all([
            apiClient.get<ListResult<ManagerProject>>('/project-manager/projects?limit=100'),
            apiClient.get<ListResult<ManagerTask>>('/project-manager/tasks?limit=100'),
          ]);
          if (active) {
            setProjects(projectResponse.data.data);
            setTasks(taskResponse.data.data);
          }
        } else if (section === 'contractors') {
          const [contractorResponse, projectResponse] = await Promise.all([
            apiClient.get<ListResult<ContractorOption>>('/project-manager/contractors?limit=100'),
            apiClient.get<ListResult<ManagerProject>>('/project-manager/projects?limit=100'),
          ]);
          if (active) {
            setContractors(contractorResponse.data.data);
            setProjects(projectResponse.data.data);
          }
        } else if (section === 'budgets') {
          const response = await apiClient.get<ListResult<ManagerProject>>('/project-manager/projects?limit=100');
          if (active) setProjects(response.data.data);
        } else if (section === 'expenses' || section === 'analytics' || section === 'milestones') {
          const [projectResponse, taskResponse, reportResponse] = await Promise.all([
            apiClient.get<ListResult<ManagerProject>>('/project-manager/projects?limit=100'),
            apiClient.get<ListResult<ManagerTask>>('/project-manager/tasks?limit=100'),
            apiClient.get<ListResult<ManagerWorkReport>>('/project-manager/work-reports?limit=100'),
          ]);
          if (active) {
            setProjects(projectResponse.data.data);
            setTasks(taskResponse.data.data);
            setWorkReports(reportResponse.data.data);
          }
        } else if (section === 'materials') {
          const response = await apiClient.get<ListResult<ManagerMaterialRequest>>('/project-manager/material-requests?limit=100');
          if (active) setRequests(response.data.data);
        } else if (section === 'reports') {
          const response = await apiClient.get<ListResult<ManagerWorkReport>>('/project-manager/work-reports?limit=100');
          if (active) setWorkReports(response.data.data);
        }
      } catch (loadError) {
        if (active) setError(errorText(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [section, reloadKey]);

  const selectedProject = projects.find((project) => project._id === taskProjectId);
  const availableTaskContractors = contractors.filter((contractor) =>
    selectedProject?.contractorIds.includes(contractor.id),
  );

  function toggleSelected(values: string[], setValues: (value: string[]) => void, id: string) {
    setValues(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.post('/project-manager/projects', {
        name: projectName,
        description,
        location,
        budget: budget ? Number(budget) : 0,
        startDate: startDate || undefined,
        expectedEndDate: expectedEndDate || undefined,
        contractorIds: projectContractors,
      });
      setNotice('Project created and assigned Contractors notified.');
      setProjectName('');
      setDescription('');
      setLocation('');
      setBudget('');
      setStartDate('');
      setExpectedEndDate('');
      setProjectContractors([]);
      setReloadKey((value) => value + 1);
    } catch (submitError) {
      setError(errorText(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.post(`/project-manager/projects/${taskProjectId}/tasks`, {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        contractorIds: taskContractors,
      });
      setNotice('Task assigned. Selected Contractors have been notified.');
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskContractors([]);
      setReloadKey((value) => value + 1);
    } catch (submitError) {
      setError(errorText(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function reviewRequest(requestId: string, status: 'approved' | 'rejected') {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.patch(`/project-manager/material-requests/${requestId}/review`, {
        status,
        reviewNote: reviewNotes[requestId] || '',
      });
      setNotice(`Material request ${status}. The Contractor has been notified.`);
      setReloadKey((value) => value + 1);
    } catch (reviewError) {
      setError(errorText(reviewError));
    } finally {
      setSaving(false);
    }
  }

  async function reviewWorkReport(reportId: string, status: 'approved' | 'rejected') {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.patch(`/project-manager/work-reports/${reportId}/review`, { status });
      setNotice(status === 'approved' ? 'Completion report approved; task marked completed.' : 'Completion report rejected; Contractor notified.');
      setReloadKey((value) => value + 1);
    } catch (reviewError) {
      setError(errorText(reviewError));
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'blocked') {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.patch(`/project-manager/tasks/${taskId}/status`, { status });
      setNotice(`Task status changed to ${status.replace('_', ' ')}.`);
      setReloadKey((value) => value + 1);
    } catch (statusError) {
      setError(errorText(statusError));
    } finally {
      setSaving(false);
    }
  }

  const title = section === 'projects'
    ? 'My projects'
    : section === 'create-project'
      ? 'Create project'
      : section === 'tasks'
        ? 'Assign tasks'
        : section === 'kanban'
          ? 'Kanban board'
          : section === 'contractors'
            ? 'Contractors'
            : section === 'budgets'
              ? 'Project budgets'
              : section === 'expenses'
                ? 'Expense monitoring'
                : section === 'analytics'
                  ? 'Project analytics'
                  : section === 'milestones'
                    ? 'Project milestones'
                    : section === 'materials'
                      ? 'Review material requests'
                      : 'Work reports';

  return (
    <section className="space-y-5 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <Badge variant="accent" size="sm" dot className="font-bold">Project Manager</Badge>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Assignments and material reviews are restricted to projects you manage.</p>
      </header>
      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
      {loading ? (
        <Card><CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading…</CardContent></Card>
      ) : (
        <>
          {section === 'projects' && <Panel title="Projects you manage">{projects.length ? <div className="divide-y divide-slate-100">{projects.map((project) => <article key={project._id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><h2 className="font-semibold text-slate-900">{project.name}</h2><p className="mt-1 text-xs text-slate-500">{project.location || 'Location not set'} · {project.contractorIds.length} Contractors · {project.progressPercent}% complete</p></div><Badge variant="secondary">{project.status.replace('_', ' ')}</Badge></article>)}</div> : <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">You do not manage any projects yet.</p>}</Panel>}

          {section === 'create-project' && (
            <Panel title="Project details & Contractor assignment">
              <form onSubmit={createProject} className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-slate-600 sm:col-span-2">Project name<input required maxLength={160} value={projectName} onChange={(event) => setProjectName(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                <label className="space-y-1 text-xs font-medium text-slate-600 sm:col-span-2">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={3} className="w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
                <label className="space-y-1 text-xs font-medium text-slate-600">Location<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={300} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                <label className="space-y-1 text-xs font-medium text-slate-600">Total budget (BDT)<input type="number" min="0" step="any" value={budget} onChange={(event) => setBudget(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                <label className="space-y-1 text-xs font-medium text-slate-600">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                <label className="space-y-1 text-xs font-medium text-slate-600">Expected end date<input type="date" value={expectedEndDate} onChange={(event) => setExpectedEndDate(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                <fieldset className="space-y-2 sm:col-span-2"><legend className="text-xs font-semibold text-slate-700">Assign Contractors</legend>{contractors.length ? <div className="grid gap-2 sm:grid-cols-2">{contractors.map((contractor) => <label key={contractor.email} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={projectContractors.includes(contractor.id)} onChange={() => toggleSelected(projectContractors, setProjectContractors, contractor.id)} className="mt-1 accent-amber-500" /><span><span className="block font-medium text-slate-800">{contractor.name}{contractor.company ? ` · ${contractor.company}` : ''}</span><span className="text-xs text-slate-500">{contractor.email}</span></span></label>)}</div> : <p className="text-sm text-slate-500">No active Contractor accounts are available.</p>}</fieldset>
                <div className="sm:col-span-2"><Button type="submit" isLoading={saving}>Create project</Button></div>
              </form>
            </Panel>
          )}

          {section === 'tasks' && (
            <>
            <Panel title="Create and assign a task">
              {projects.length ? <form onSubmit={createTask} className="space-y-3">
                <label className="block space-y-1 text-xs font-medium text-slate-600">Project<select required value={taskProjectId} onChange={(event) => { setTaskProjectId(event.target.value); setTaskContractors([]); }} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
                <label className="block space-y-1 text-xs font-medium text-slate-600">Task title<input required maxLength={200} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                <label className="block space-y-1 text-xs font-medium text-slate-600">Description<textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} maxLength={5000} rows={3} className="w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
                <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs font-medium text-slate-600">Priority<select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{['low', 'medium', 'high', 'urgent'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="space-y-1 text-xs font-medium text-slate-600">Deadline<input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label></div>
                <fieldset className="space-y-2"><legend className="text-xs font-semibold text-slate-700">Assign to Contractor(s)</legend>{availableTaskContractors.length ? <div className="grid gap-2 sm:grid-cols-2">{availableTaskContractors.map((contractor) => <label key={contractor.email} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={taskContractors.includes(contractor.id)} onChange={() => toggleSelected(taskContractors, setTaskContractors, contractor.id)} className="accent-amber-500" /><span>{contractor.name} <span className="text-xs text-slate-500">({contractor.email})</span></span></label>)}</div> : <p className="text-sm text-slate-500">Assign a Contractor to this project before assigning a task.</p>}</fieldset>
                <Button type="submit" isLoading={saving} disabled={!availableTaskContractors.length}>Assign task</Button>
              </form> : <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Create a project and assign Contractors before creating tasks.</p>}
            </Panel>
            <Panel title="Tasks in projects you manage">
              {tasks.length ? <div className="space-y-3">{tasks.map((task) => {
                const assignedNames = task.assignedContractorIds.map((id) =>
                  contractors.find((contractor) => contractor.id === id)?.name || 'Contractor',
                );
                const projectName = typeof task.projectId === 'object' && task.projectId !== null
                  ? task.projectId.name
                  : 'Project';
                return <article key={task._id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-900">{task.title}</h3><Badge variant="secondary">{task.status.replace('_', ' ')}</Badge></div><p className="mt-1 text-xs text-slate-500">{projectName} · {task.priority} priority · Deadline {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'not set'}</p><p className="mt-2 text-sm text-slate-600">{task.description || 'No description provided.'}</p><p className="mt-2 text-xs text-slate-600">{task.progressPercent}% progress · Assigned to: {assignedNames.length ? assignedNames.join(', ') : 'No Contractor assigned'}</p>{task.status !== 'completed' && task.status !== 'under_review' && <label className="mt-3 block max-w-xs space-y-1 text-xs font-medium text-slate-600">Manage task status<select defaultValue={task.status} disabled={saving} onChange={(event) => void updateTaskStatus(task._id, event.target.value as 'todo' | 'in_progress' | 'blocked')} className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="todo">Todo</option><option value="in_progress">In progress</option><option value="blocked">Blocked / problem</option></select></label>}</article>;
              })}</div> : <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">No tasks have been created for your projects yet.</p>}
            </Panel>
            </>
          )}

          {section === 'kanban' && (
            <div className="grid gap-4 lg:grid-cols-4">
              {([
                ['todo', 'To do'],
                ['in_progress', 'In progress'],
                ['blocked', 'Blocked'],
                ['under_review', 'Under review'],
              ] as const).map(([status, label]) => (
                <Panel key={status} title={`${label} (${tasks.filter((task) => task.status === status).length})`}>
                  {tasks.filter((task) => task.status === status).length ? (
                    <div className="space-y-3">
                      {tasks.filter((task) => task.status === status).map((task) => (
                        <article key={task._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Deadline: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'not set'} · {task.progressPercent}% progress
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No tasks in this stage.</p>
                  )}
                </Panel>
              ))}
            </div>
          )}

          {section === 'contractors' && (
            <Panel title="Active Contractors">
              {contractors.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {contractors.map((contractor) => {
                    const assignedProjects = projects.filter((project) => project.contractorIds.includes(contractor.id));
                    return (
                      <article key={contractor.id} className="rounded-lg border border-slate-200 p-4">
                        <h2 className="font-semibold text-slate-900">{contractor.name}</h2>
                        <p className="mt-1 text-xs text-slate-500">{contractor.email}</p>
                        {contractor.company && <p className="mt-1 text-sm text-slate-600">{contractor.company}</p>}
                        <p className="mt-3 text-xs font-medium text-slate-600">
                          {assignedProjects.length
                            ? `Assigned to: ${assignedProjects.map((project) => project.name).join(', ')}`
                            : 'Not assigned to a project'}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  No active Contractor accounts are available yet.
                </p>
              )}
            </Panel>
          )}

          {section === 'budgets' && (
            <Panel title="Managed project budgets">
              {projects.length ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <article key={project._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                      <div>
                        <h2 className="font-semibold text-slate-900">{project.name}</h2>
                        <p className="mt-1 text-xs text-slate-500">{project.location || 'Location not set'} · {project.status.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-700">BDT {project.budget?.toLocaleString() ?? '0'}</p>
                        <p className="text-xs text-slate-500">{project.progressPercent}% project progress</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Create a project to add and review its budget.
                </p>
              )}
            </Panel>
          )}

          {section === 'analytics' && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Projects', projects.length],
                  ['Tasks', tasks.length],
                  ['Completed tasks', tasks.filter((task) => task.status === 'completed').length],
                  ['Blocked tasks', tasks.filter((task) => task.status === 'blocked').length],
                ].map(([label, count]) => (
                  <Card key={String(label)}>
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">{String(label)}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{String(count)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Panel title="Project progress">
                {projects.length ? (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project._id}>
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-800">{project.name}</span>
                          <span className="font-semibold text-amber-700">{project.progressPercent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-amber-500" style={{ width: `${project.progressPercent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Create a project to see delivery analytics.</p>
                )}
              </Panel>
              <Panel title="Recent work reports">
                {workReports.length ? (
                  <div className="space-y-2">
                    {workReports.slice(0, 8).map((report) => (
                      <div key={report._id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                        <span className="text-slate-700">{report.taskId?.title || 'Task'}</span>
                        <span className="font-semibold text-slate-600">{report.progressPercent}% · {report.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No work reports have been submitted.</p>
                )}
              </Panel>
            </>
          )}

          {section === 'expenses' && (
            <Panel title="Project budget utilization">
              {projects.length ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <article key={project._id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="font-semibold text-slate-900">{project.name}</h2>
                          <p className="mt-1 text-xs text-slate-500">Approved budget and current delivery status</p>
                        </div>
                        <Badge variant="secondary">{project.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">Planned budget: <strong>BDT {(project.budget ?? 0).toLocaleString()}</strong></p>
                      <p className="mt-1 text-xs text-slate-500">Actual expense records are not available in the current system. Add an expense module when expense transaction data is connected.</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Create a project to review project budget information.</p>
              )}
            </Panel>
          )}

          {section === 'milestones' && (
            <Panel title="Project deadlines and task milestones">
              {projects.length ? (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const projectTasks = tasks.filter((task) =>
                      typeof task.projectId === 'object' && task.projectId !== null
                        ? task.projectId.name === project.name
                        : false,
                    );
                    return (
                      <article key={project._id} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h2 className="font-semibold text-slate-900">{project.name}</h2>
                          <span className="text-xs font-medium text-slate-500">Expected end: {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        {projectTasks.length ? (
                          <div className="mt-3 space-y-2">
                            {projectTasks.filter((task) => task.dueDate).map((task) => (
                              <div key={task._id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                                <span className="text-slate-700">{task.title}</span>
                                <span className="text-xs text-slate-500">{new Date(task.dueDate as string).toLocaleDateString()} · {task.status.replace('_', ' ')} · {task.progressPercent}%</span>
                              </div>
                            ))}
                            {!projectTasks.some((task) => task.dueDate) && <p className="text-xs text-slate-500">No task deadlines have been set.</p>}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-500">No milestones/tasks assigned to this project.</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Create a project and assign tasks to build milestones.</p>
              )}
            </Panel>
          )}

          {section === 'materials' && (
            <Panel title="Material requests for your projects">
              {requests.length ? <div className="space-y-3">{requests.map((request) => <article key={request._id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold text-slate-900">{request.projectId?.name || 'Project'} · {request.taskId?.title || 'Task'}</h2><Badge variant="secondary">{request.status}</Badge></div><p className="mt-2 text-sm text-slate-700">{request.items.map((item) => `${item.quantity} ${item.unit} ${item.name}`).join(', ')}</p><p className="mt-1 text-sm text-slate-500">{request.reason}</p><p className="mt-1 text-xs text-slate-400">Contractor ID: {request.contractorId} · {new Date(request.createdAt).toLocaleDateString()}</p>{request.status === 'pending' && <div className="mt-3 space-y-2"><textarea value={reviewNotes[request._id] || ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [request._id]: event.target.value }))} maxLength={1000} rows={2} placeholder="Optional review note" className="w-full rounded-lg border border-slate-300 p-2 text-sm" /><div className="flex gap-2"><Button size="sm" isLoading={saving} onClick={() => void reviewRequest(request._id, 'approved')}>Approve</Button><Button size="sm" variant="outline" disabled={saving} onClick={() => void reviewRequest(request._id, 'rejected')}>Reject</Button></div></div>}</article>)}</div> : <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">No material requests have been submitted for your projects.</p>}
            </Panel>
          )}

          {section === 'reports' && (
            <Panel title="Contractor work and completion reports">
              {workReports.length ? <div className="space-y-3">{workReports.map((report) => <article key={report._id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold text-slate-900">{report.projectId?.name || 'Project'} · {report.taskId?.title || 'Task'}</h2><Badge variant="secondary">{report.type === 'completion' ? report.reviewStatus : report.type === 'delay' ? 'delay / problem' : 'daily report'}</Badge></div><p className="mt-2 text-sm text-slate-600">{report.description}</p><p className="mt-1 text-xs text-slate-500">{report.progressPercent}% progress · {new Date(report.workDate).toLocaleDateString()} · Contractor {report.contractorId}</p>{report.photoUrls.length > 0 && <div className="mt-2 flex gap-3">{report.photoUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs text-amber-700 underline">View photo</a>)}</div>}{report.type === 'completion' && report.reviewStatus === 'pending' && <div className="mt-3 flex gap-2"><Button size="sm" isLoading={saving} onClick={() => void reviewWorkReport(report._id, 'approved')}>Approve completion</Button><Button size="sm" variant="outline" disabled={saving} onClick={() => void reviewWorkReport(report._id, 'rejected')}>Reject</Button></div>}</article>)}</div> : <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">No work reports are available for the projects you manage.</p>}
            </Panel>
          )}
        </>
      )}
    </section>
  );
}
