'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, Bell, Building2, CalendarDays, CheckCircle2, Loader2, type LucideIcon } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type ContractorSection =
  | 'dashboard'
  | 'projects'
  | 'project'
  | 'tasks'
  | 'task'
  | 'my-work'
  | 'progress'
  | 'material-requests'
  | 'work-reports'
  | 'deadlines'
  | 'notifications'
  | 'profile';

interface ProjectSummary {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  startDate?: string;
  expectedEndDate?: string;
  status?: string;
  progressPercent?: number;
}

interface TaskSummary {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  progressPercent?: number;
  projectId?: string | { _id?: string; name?: string; location?: string };
}

interface MaterialRequest {
  _id: string;
  status: string;
  reason: string;
  items: Array<{ name: string; quantity: number; unit: string }>;
  createdAt: string;
  projectId?: { name?: string };
  taskId?: { title?: string };
  reviewNote?: string;
}

interface WorkReport {
  _id: string;
  type: string;
  workDate: string;
  description: string;
  progressPercent: number;
  reviewStatus?: string;
  photoUrls: string[];
  projectId?: { name?: string };
  taskId?: { title?: string };
}

interface ContractorNotification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
}

interface DashboardData {
  projectCount: number;
  activeTaskCount: number;
  overdueTaskCount: number;
  pendingRequestCount: number;
  upcomingDeadlines: TaskSummary[];
}

interface ContractorProfile {
  user: {
    name: string;
    email: string;
    company?: string | null;
    phone?: string | null;
    role: string;
  };
  workSummary: {
    projectCount: number;
    taskCount: number;
    completedTaskCount: number;
  };
}

interface PageResult<T> {
  data: T[];
}

const sectionTitles: Record<ContractorSection, string> = {
  dashboard: 'Contractor dashboard',
  projects: 'My projects',
  project: 'Project details',
  tasks: 'My tasks',
  task: 'Task details',
  'my-work': 'My work',
  progress: 'Task progress update',
  'material-requests': 'Material requests',
  'work-reports': 'Work reports',
  deadlines: 'Schedule & deadlines',
  notifications: 'Notifications',
  profile: 'My profile',
};

function displayDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : 'Not set';
}

function projectName(task: TaskSummary) {
  return typeof task.projectId === 'object' && task.projectId !== null
    ? task.projectId.name || 'Project'
    : 'Assigned project';
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{children}</p>;
}

function TaskRows({ tasks }: { tasks: TaskSummary[] }) {
  if (!tasks.length) return <EmptyState>No tasks have been assigned to you yet.</EmptyState>;
  return (
    <div className="divide-y divide-slate-100">
      {tasks.map((task) => (
        <Link
          key={task._id}
          href={`/contractor/tasks/${task._id}`}
          className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-amber-700"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800">{task.title}</p>
            <p className="mt-1 text-xs text-slate-500">{projectName(task)} · Due {displayDate(task.dueDate)}</p>
          </div>
          <span className="text-xs font-semibold text-slate-600">{task.progressPercent ?? 0}% · {(task.status || 'todo').replace('_', ' ')}</span>
        </Link>
      ))}
    </div>
  );
}

export function ContractorModulePage({
  section,
  itemId,
}: {
  section: ContractorSection;
  itemId?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [task, setTask] = useState<TaskSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [notifications, setNotifications] = useState<ContractorNotification[]>([]);
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [progressPercent, setProgressPercent] = useState('25');
  const [progressNote, setProgressNote] = useState('');
  const [reportType, setReportType] = useState<'daily' | 'completion' | 'delay'>('daily');
  const [reportDescription, setReportDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('1');
  const [materialUnit, setMaterialUnit] = useState('bag');
  const [materialReason, setMaterialReason] = useState('');
  const [materialProjectId, setMaterialProjectId] = useState('');
  const [materialTaskId, setMaterialTaskId] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        if (section === 'dashboard' || section === 'my-work') {
          const [dashboardResponse, tasksResponse] = await Promise.all([
            apiClient.get<{ data: DashboardData }>('/contractor/dashboard'),
            apiClient.get<PageResult<TaskSummary>>('/contractor/tasks?limit=100'),
          ]);
          if (active) {
            setDashboard(dashboardResponse.data.data);
            setTasks(tasksResponse.data.data);
          }
        } else if (section === 'projects') {
          const response = await apiClient.get<PageResult<ProjectSummary>>('/contractor/projects?limit=100');
          if (active) setProjects(response.data.data);
        } else if (section === 'project' && itemId) {
          const [projectResponse, tasksResponse] = await Promise.all([
            apiClient.get<{ data: ProjectSummary }>(`/contractor/projects/${itemId}`),
            apiClient.get<PageResult<TaskSummary>>(`/contractor/tasks?projectId=${itemId}&limit=100`),
          ]);
          if (active) {
            setProject(projectResponse.data.data);
            setTasks(tasksResponse.data.data);
          }
        } else if (section === 'tasks') {
          const response = await apiClient.get<PageResult<TaskSummary>>('/contractor/tasks?limit=100');
          if (active) setTasks(response.data.data);
        } else if (section === 'task' && itemId) {
          const [taskResponse, reportsResponse] = await Promise.all([
            apiClient.get<{ data: TaskSummary }>(`/contractor/tasks/${itemId}`),
            apiClient.get<PageResult<WorkReport>>(`/contractor/tasks/${itemId}/reports?limit=100`),
          ]);
          if (active) {
            setTask(taskResponse.data.data);
            setReports(reportsResponse.data.data);
            setSelectedTaskId(itemId);
          }
        } else if (section === 'progress') {
          const response = await apiClient.get<PageResult<TaskSummary>>('/contractor/tasks?limit=100');
          if (active) setTasks(response.data.data);
        } else if (section === 'material-requests') {
          const [requestResponse, projectResponse, taskResponse] = await Promise.all([
            apiClient.get<PageResult<MaterialRequest>>('/contractor/material-requests?limit=100'),
            apiClient.get<PageResult<ProjectSummary>>('/contractor/projects?limit=100'),
            apiClient.get<PageResult<TaskSummary>>('/contractor/tasks?limit=100'),
          ]);
          if (active) {
            setRequests(requestResponse.data.data);
            setProjects(projectResponse.data.data);
            setTasks(taskResponse.data.data);
            const firstProject = projectResponse.data.data[0];
            const firstTask = taskResponse.data.data.find((item) => {
              const taskProjectId = typeof item.projectId === 'string' ? item.projectId : item.projectId?._id;
              return taskProjectId === firstProject?._id;
            });
            setMaterialProjectId((current) => current || firstProject?._id || '');
            setMaterialTaskId((current) => current || firstTask?._id || '');
          }
        } else if (section === 'work-reports') {
          const [reportResponse, taskResponse] = await Promise.all([
            apiClient.get<PageResult<WorkReport>>('/contractor/work-reports?limit=100'),
            apiClient.get<PageResult<TaskSummary>>('/contractor/tasks?limit=100'),
          ]);
          if (active) {
            setReports(reportResponse.data.data);
            setTasks(taskResponse.data.data);
            setSelectedTaskId((current) => current || taskResponse.data.data[0]?._id || '');
          }
        } else if (section === 'deadlines') {
          const response = await apiClient.get<{ data: TaskSummary[] }>('/contractor/deadlines');
          if (active) setTasks(response.data.data);
        } else if (section === 'notifications') {
          const response = await apiClient.get<PageResult<ContractorNotification>>('/contractor/notifications?limit=100');
          if (active) setNotifications(response.data.data);
        } else if (section === 'profile') {
          const response = await apiClient.get<{ data: ContractorProfile }>('/contractor/profile');
          if (active) setProfile(response.data.data);
        }
      } catch (loadError) {
        if (active) setError(messageFromError(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [section, itemId, reloadKey]);

  async function submitProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTaskId) return setError('Select an assigned task first.');
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.patch(`/contractor/tasks/${selectedTaskId}/progress`, {
        progressPercent: Number(progressPercent),
        note: progressNote,
      });
      setProgressNote('');
      setNotice('Task progress updated.');
      setReloadKey((value) => value + 1);
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function startTask() {
    if (!itemId) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.patch(`/contractor/tasks/${itemId}/start`);
      setNotice('Task started. Status changed to in progress.');
      setReloadKey((value) => value + 1);
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTaskId) return setError('Select an assigned task first.');
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.post(`/contractor/tasks/${selectedTaskId}/reports`, {
        type: reportType,
        description: reportDescription,
        progressPercent: reportType === 'completion' ? 100 : Number(progressPercent),
        photoUrls: photoUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
      });
      setReportDescription('');
      setPhotoUrls('');
      setNotice(
        reportType === 'completion'
          ? 'Completion report submitted for review.'
          : reportType === 'delay'
            ? 'Delay/problem report submitted to your Project Manager.'
            : 'Work report submitted.',
      );
      setReloadKey((value) => value + 1);
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function submitMaterialRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiClient.post('/contractor/material-requests', {
        projectId: materialProjectId,
        taskId: materialTaskId,
        reason: materialReason,
        items: [{ name: materialName, quantity: Number(materialQuantity), unit: materialUnit }],
      });
      setMaterialName('');
      setMaterialReason('');
      setNotice('Material request submitted to your Project Manager.');
      setReloadKey((value) => value + 1);
    } catch (submitError) {
      setError(messageFromError(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function markNotificationRead(notificationId: string) {
    setError('');
    try {
      await apiClient.patch(`/contractor/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification,
        ),
      );
      window.dispatchEvent(new Event('contractor-notifications-updated'));
    } catch (readError) {
      setError(messageFromError(readError));
    }
  }

  const title = sectionTitles[section];
  const metrics: Array<{ label: string; count: number; icon: LucideIcon }> = [
    { label: 'Assigned projects', count: dashboard?.projectCount ?? 0, icon: Building2 },
    { label: 'Active tasks', count: dashboard?.activeTaskCount ?? 0, icon: CheckCircle2 },
    { label: 'Overdue tasks', count: dashboard?.overdueTaskCount ?? 0, icon: CalendarDays },
    { label: 'Pending material requests', count: dashboard?.pendingRequestCount ?? 0, icon: Bell },
  ];

  return (
    <section className="space-y-5 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <Badge variant="accent" size="sm" dot className="font-bold">Contractor workspace</Badge>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Only projects and tasks assigned to your account are available here.</p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{notice}
        </div>
      )}
      {loading ? (
        <Card><CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading your assigned work…</CardContent></Card>
      ) : (
        <>
          {(section === 'dashboard' || section === 'my-work') && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map(({ label, count, icon: Icon }) => (
                  <Card key={label}><CardContent className="flex items-center gap-3 p-4"><span className="rounded-lg bg-amber-50 p-2 text-amber-700"><Icon className="h-5 w-5" /></span><div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900">{count}</p></div></CardContent></Card>
                ))}
              </div>
              <Panel title="Your assigned tasks"><TaskRows tasks={tasks.slice(0, 8)} /></Panel>
              <Panel title="Upcoming deadlines"><TaskRows tasks={dashboard?.upcomingDeadlines ?? []} /></Panel>
            </>
          )}

          {section === 'projects' && (
            <Panel title="Assigned projects">
              {projects.length ? <div className="grid gap-3 md:grid-cols-2">{projects.map((item) => (
                <Link key={item._id} href={`/contractor/projects/${item._id}`} className="rounded-xl border border-slate-200 p-4 hover:border-amber-400">
                  <div className="flex items-start justify-between gap-3"><h2 className="font-bold text-slate-900">{item.name}</h2><Badge variant="secondary">{(item.status || 'planning').replace('_', ' ')}</Badge></div>
                  <p className="mt-2 text-sm text-slate-500">{item.location || 'Location not set'}</p>
                  <p className="mt-3 text-xs text-slate-600">{item.progressPercent ?? 0}% complete · Ends {displayDate(item.expectedEndDate)}</p>
                </Link>
              ))}</div> : <EmptyState>No projects have been assigned to your account.</EmptyState>}
            </Panel>
          )}

          {section === 'project' && project && (
            <>
              <Panel title={project.name}>
                <p className="text-sm leading-6 text-slate-600">{project.description || 'No project description provided.'}</p>
                <div className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Location:</span> {project.location || 'Not set'}</p><p><span className="text-slate-500">Status:</span> {project.status || 'planning'}</p><p><span className="text-slate-500">Start:</span> {displayDate(project.startDate)}</p><p><span className="text-slate-500">Expected end:</span> {displayDate(project.expectedEndDate)}</p></div>
                <p className="text-sm font-semibold text-amber-700">{project.progressPercent ?? 0}% project progress</p>
              </Panel>
              <Panel title="Your tasks in this project"><TaskRows tasks={tasks} /></Panel>
            </>
          )}

          {section === 'tasks' && <Panel title="Tasks assigned to you"><TaskRows tasks={tasks} /></Panel>}
          {section === 'task' && task && (
            <>
              <Panel title={task.title}>
                <p className="text-sm leading-6 text-slate-600">{task.description || 'No task description provided.'}</p>
                <div className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Project:</span> {projectName(task)}</p><p><span className="text-slate-500">Priority:</span> {task.priority || 'medium'}</p><p><span className="text-slate-500">Deadline:</span> {displayDate(task.dueDate)}</p><p><span className="text-slate-500">Status:</span> {(task.status || 'todo').replace('_', ' ')}</p></div>
                <p className="text-sm font-semibold text-amber-700">{task.progressPercent ?? 0}% complete</p>
                {task.status !== 'completed' && task.status !== 'under_review' && (
                  <Button size="sm" isLoading={saving} onClick={() => void startTask()} disabled={task.status === 'in_progress'}>
                    {task.status === 'in_progress' ? 'Work in progress' : 'Start work'}
                  </Button>
                )}
              </Panel>
              <ProgressForm tasks={[task]} selectedTaskId={task._id} setSelectedTaskId={setSelectedTaskId} progressPercent={progressPercent} setProgressPercent={setProgressPercent} progressNote={progressNote} setProgressNote={setProgressNote} saving={saving} onSubmit={submitProgress} />
              <ReportForm tasks={[task]} selectedTaskId={task._id} setSelectedTaskId={setSelectedTaskId} reportType={reportType} setReportType={setReportType} progressPercent={progressPercent} setProgressPercent={setProgressPercent} reportDescription={reportDescription} setReportDescription={setReportDescription} photoUrls={photoUrls} setPhotoUrls={setPhotoUrls} saving={saving} onSubmit={submitReport} />
              <ReportsList reports={reports} />
            </>
          )}

          {section === 'progress' && (
            <ProgressForm tasks={tasks} selectedTaskId={selectedTaskId} setSelectedTaskId={setSelectedTaskId} progressPercent={progressPercent} setProgressPercent={setProgressPercent} progressNote={progressNote} setProgressNote={setProgressNote} saving={saving} onSubmit={submitProgress} />
          )}

          {section === 'material-requests' && (
            <>
              <Panel title="Request materials for an assigned task">
                <form onSubmit={submitMaterialRequest} className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-slate-600">Project<select required value={materialProjectId} onChange={(event) => { setMaterialProjectId(event.target.value); setMaterialTaskId(''); }} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="">Select project</option>{projects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
                  <label className="space-y-1 text-xs font-medium text-slate-600">Assigned task<select required value={materialTaskId} onChange={(event) => setMaterialTaskId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="">Select task</option>{tasks.filter((item) => typeof item.projectId === 'object' && item.projectId?._id === materialProjectId || typeof item.projectId === 'string' && item.projectId === materialProjectId).map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label>
                  <label className="space-y-1 text-xs font-medium text-slate-600">Material name<input required value={materialName} onChange={(event) => setMaterialName(event.target.value)} placeholder="Cement" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                  <div className="grid grid-cols-2 gap-2"><label className="space-y-1 text-xs font-medium text-slate-600">Quantity<input required type="number" min="0.001" step="any" value={materialQuantity} onChange={(event) => setMaterialQuantity(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="space-y-1 text-xs font-medium text-slate-600">Unit<input required value={materialUnit} onChange={(event) => setMaterialUnit(event.target.value)} placeholder="bag" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label></div>
                  <label className="space-y-1 text-xs font-medium text-slate-600 sm:col-span-2">Reason<textarea required value={materialReason} onChange={(event) => setMaterialReason(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
                  <div className="sm:col-span-2"><Button type="submit" isLoading={saving} disabled={!projects.length || !tasks.length}>Submit request</Button></div>
                </form>
              </Panel>
              <Panel title="Request history">
                {requests.length ? <div className="space-y-3">{requests.map((request) => <article key={request._id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-800">{request.items.map((item) => `${item.quantity} ${item.unit} ${item.name}`).join(', ')}</h3><Badge variant="secondary">{request.status}</Badge></div><p className="mt-1 text-xs text-slate-500">{request.projectId?.name || 'Project'} · {request.taskId?.title || 'Task'} · {displayDate(request.createdAt)}</p><p className="mt-2 text-sm text-slate-600">{request.reason}</p>{request.reviewNote && <p className="mt-2 text-xs text-slate-500">Manager note: {request.reviewNote}</p>}</article>)}</div> : <EmptyState>You have not submitted any material requests.</EmptyState>}
              </Panel>
            </>
          )}

          {section === 'work-reports' && (
            <>
              <ReportForm tasks={tasks} selectedTaskId={selectedTaskId} setSelectedTaskId={setSelectedTaskId} reportType={reportType} setReportType={setReportType} progressPercent={progressPercent} setProgressPercent={setProgressPercent} reportDescription={reportDescription} setReportDescription={setReportDescription} photoUrls={photoUrls} setPhotoUrls={setPhotoUrls} saving={saving} onSubmit={submitReport} />
              <ReportsList reports={reports} />
            </>
          )}

          {section === 'deadlines' && <Panel title="Assigned task schedule"><TaskRows tasks={tasks} /></Panel>}

          {section === 'notifications' && (
            <Panel title="Your notifications">
              {notifications.length ? <div className="divide-y divide-slate-100">{notifications.map((item) => <div key={item._id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"><div><p className="text-sm font-semibold text-slate-800">{item.title} {!item.readAt && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-500" />}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-1 text-xs text-slate-400">{displayDate(item.createdAt)}</p></div>{!item.readAt && <Button variant="outline" size="sm" onClick={() => void markNotificationRead(item._id)}>Mark read</Button>}</div>)}</div> : <EmptyState>You have no notifications.</EmptyState>}
            </Panel>
          )}

          {section === 'profile' && profile && (
            <Panel title="Account & work profile">
              <div className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Name:</span> {profile.user.name}</p><p><span className="text-slate-500">Email:</span> {profile.user.email}</p><p><span className="text-slate-500">Company:</span> {profile.user.company || 'Not set'}</p><p><span className="text-slate-500">Phone:</span> {profile.user.phone || 'Not set'}</p><p><span className="text-slate-500">Role:</span> {profile.user.role}</p></div>
              <div className="grid gap-3 sm:grid-cols-3">{[['Assigned projects', profile.workSummary.projectCount], ['Assigned tasks', profile.workSummary.taskCount], ['Completed tasks', profile.workSummary.completedTaskCount]].map(([label, count]) => <div key={String(label)} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{String(label)}</p><p className="mt-1 font-bold text-slate-900">{String(count)}</p></div>)}</div>
            </Panel>
          )}
        </>
      )}
    </section>
  );
}

function ProgressForm({
  tasks,
  selectedTaskId,
  setSelectedTaskId,
  progressPercent,
  setProgressPercent,
  progressNote,
  setProgressNote,
  saving,
  onSubmit,
}: {
  tasks: TaskSummary[];
  selectedTaskId: string;
  setSelectedTaskId: (value: string) => void;
  progressPercent: string;
  setProgressPercent: (value: string) => void;
  progressNote: string;
  setProgressNote: (value: string) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel title="Update task progress">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1 text-xs font-medium text-slate-600">Assigned task<select required value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="">Select task</option>{tasks.map((item) => <option key={item._id} value={item._id}>{item.title} · {projectName(item)}</option>)}</select></label>
        <label className="block space-y-1 text-xs font-medium text-slate-600">Progress<select value={progressPercent} onChange={(event) => setProgressPercent(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">{[0, 25, 50, 75, 100].map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
        <label className="block space-y-1 text-xs font-medium text-slate-600">Update note (optional)<textarea value={progressNote} onChange={(event) => setProgressNote(event.target.value)} rows={3} maxLength={2000} className="w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
        <Button type="submit" isLoading={saving} disabled={!tasks.length}>Save progress</Button>
      </form>
    </Panel>
  );
}

function ReportForm({
  tasks,
  selectedTaskId,
  setSelectedTaskId,
  reportType,
  setReportType,
  progressPercent,
  setProgressPercent,
  reportDescription,
  setReportDescription,
  photoUrls,
  setPhotoUrls,
  saving,
  onSubmit,
}: {
  tasks: TaskSummary[];
  selectedTaskId: string;
  setSelectedTaskId: (value: string) => void;
  reportType: 'daily' | 'completion' | 'delay';
  setReportType: (value: 'daily' | 'completion' | 'delay') => void;
  progressPercent: string;
  setProgressPercent: (value: string) => void;
  reportDescription: string;
  setReportDescription: (value: string) => void;
  photoUrls: string;
  setPhotoUrls: (value: string) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel title="Submit a work report">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1 text-xs font-medium text-slate-600">Assigned task<select required value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="">Select task</option>{tasks.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label>
        <label className="block space-y-1 text-xs font-medium text-slate-600">Report type<select value={reportType} onChange={(event) => setReportType(event.target.value as 'daily' | 'completion' | 'delay')} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="daily">Daily work report</option><option value="delay">Delay/problem report</option><option value="completion">Work completion report</option></select></label>
        {reportType === 'daily' && <label className="block space-y-1 text-xs font-medium text-slate-600">Progress<select value={progressPercent} onChange={(event) => setProgressPercent(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">{[0, 25, 50, 75, 100].map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>}
        <label className="block space-y-1 text-xs font-medium text-slate-600">Work description<textarea required value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} rows={4} maxLength={5000} className="w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
        <label className="block space-y-1 text-xs font-medium text-slate-600">Progress photo URLs (one URL per line)<textarea value={photoUrls} onChange={(event) => setPhotoUrls(event.target.value)} rows={2} placeholder="https://…" className="w-full rounded-lg border border-slate-300 p-3 text-sm" /><span className="text-slate-400">Image uploads are not configured yet; only existing HTTP(S) image links can be submitted.</span></label>
        <Button type="submit" isLoading={saving} disabled={!tasks.length}>{reportType === 'completion' ? 'Submit completion report' : reportType === 'delay' ? 'Submit delay report' : 'Submit daily report'}</Button>
      </form>
    </Panel>
  );
}

function ReportsList({ reports }: { reports: WorkReport[] }) {
  return (
    <Panel title="Submitted reports">
      {reports.length ? <div className="space-y-3">{reports.map((report) => <article key={report._id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-800">{report.type === 'completion' ? `Completion report · ${report.reviewStatus || 'pending'}` : report.type === 'delay' ? 'Delay/problem report' : 'Daily work report'} · {report.progressPercent}%</h3><span className="text-xs text-slate-500">{displayDate(report.workDate)}</span></div><p className="mt-2 text-sm text-slate-600">{report.description}</p><p className="mt-1 text-xs text-slate-500">{report.projectId?.name || 'Project'} · {report.taskId?.title || 'Task'}</p>{report.photoUrls.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{report.photoUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-xs font-medium text-amber-700 underline">View photo</a>)}</div>}</article>)}</div> : <EmptyState>No work reports have been submitted yet.</EmptyState>}
    </Panel>
  );
}
