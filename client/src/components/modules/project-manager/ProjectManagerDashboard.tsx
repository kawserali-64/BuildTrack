'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Package,
  TriangleAlert,
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Project {
  _id: string;
  name: string;
  status: string;
  location?: string;
  budget?: number;
  progressPercent: number;
  expectedEndDate?: string;
  contractorIds?: string[];
}

interface Task {
  _id: string;
  title: string;
  status: string;
  dueDate?: string;
  progressPercent: number;
  projectId?: { name?: string };
}

interface WorkReport {
  _id: string;
  type: string;
  reviewStatus: string;
  workDate: string;
  description: string;
  taskId?: { title?: string };
}

interface MaterialRequest {
  _id: string;
  status: string;
}

interface ListResult<T> {
  data: T[];
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : 'Dashboard data could not be loaded.';
}

function formatCurrency(value: number) {
  return `৳${value.toLocaleString('en-BD')}`;
}

const cardStyle = [
  'from-amber-500 to-orange-500',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
];

export function ProjectManagerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const [projectResponse, taskResponse, reportResponse, requestResponse] = await Promise.all([
          apiClient.get<ListResult<Project>>('/project-manager/projects?limit=100'),
          apiClient.get<ListResult<Task>>('/project-manager/tasks?limit=100'),
          apiClient.get<ListResult<WorkReport>>('/project-manager/work-reports?limit=100'),
          apiClient.get<ListResult<MaterialRequest>>('/project-manager/material-requests?status=pending&limit=100'),
        ]);
        if (active) {
          setProjects(projectResponse.data.data);
          setTasks(taskResponse.data.data);
          setReports(reportResponse.data.data);
          setRequests(requestResponse.data.data);
        }
      } catch (loadError) {
        if (active) setError(messageFromError(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const now = new Date();
  const upcomingTasks = tasks
    .filter((task) => task.dueDate && task.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime())
    .slice(0, 5);
  const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const blockedTasks = tasks.filter((task) => task.status === 'blocked').length;
  const pendingCompletions = reports.filter(
    (report) => report.type === 'completion' && report.reviewStatus === 'pending',
  ).length;

  const metrics = [
    { label: 'Managed projects', value: String(projects.length), icon: Building2, hint: 'Your active portfolio' },
    { label: 'Total tasks', value: String(tasks.length), icon: ClipboardList, hint: `${completedTasks} completed` },
    { label: 'Blocked tasks', value: String(blockedTasks), icon: TriangleAlert, hint: 'Need attention' },
    { label: 'Total planned budget', value: formatCurrency(totalBudget), icon: Banknote, hint: 'Across your projects' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative">
          <Badge variant="accent" size="sm" dot className="font-bold">Project Manager</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Project overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Review your managed projects, tasks, budgets, and pending actions at a glance.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/project-manager/projects/create" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
              <Building2 className="h-4 w-4" /> Create project
            </Link>
            <Link href="/project-manager/tasks" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
              Manage tasks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <Card><CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading dashboard…</CardContent></Card>
      ) : (
        <>
          <section aria-label="Project summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, hint }, index) => (
              <Card key={label} className="overflow-hidden border-slate-200 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="relative p-5">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${cardStyle[index]} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 truncate text-2xl font-black text-slate-900">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{hint}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">Project portfolio</h2>
                    <p className="mt-1 text-xs text-slate-500">Your managed projects and key details</p>
                  </div>
                  <Link href="/project-manager/projects" className="text-xs font-semibold text-amber-700 hover:underline">All projects <ArrowRight className="inline h-3 w-3" /></Link>
                </div>
                {projects.length ? (
                  <div className="space-y-4">
                    {projects.slice(0, 6).map((project) => (
                      <article key={project._id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition hover:border-amber-300 hover:shadow-sm">
                        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
                        <div className="pl-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{project.name}</h3>
                              <p className="mt-1 text-xs text-slate-500">{project.location || 'Location not set'}</p>
                            </div>
                            <Badge variant="secondary">{project.status.replace('_', ' ')}</Badge>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-amber-50/80 px-3 py-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">Planned budget</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">{formatCurrency(project.budget || 0)}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Expected end</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">{project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : 'Not set'}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-slate-500">{project.contractorIds?.length || 0} assigned contractor{project.contractorIds?.length === 1 ? '' : 's'}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">No projects yet</p>
                    <p className="mt-1 text-xs text-slate-500">Create a project to see its portfolio summary here.</p>
                    <Link href="/project-manager/projects/create" className="mt-3 inline-block text-xs font-bold text-amber-700 hover:underline">Create project</Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900">Needs your attention</h2>
                      <p className="mt-1 text-xs text-slate-500">Items waiting for your review</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{requests.length + pendingCompletions}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/project-manager/materials" className="rounded-xl border border-amber-100 bg-amber-50 p-4 transition hover:border-amber-300">
                      <Package className="h-5 w-5 text-amber-700" />
                      <p className="mt-3 text-2xl font-black text-slate-900">{requests.length}</p>
                      <p className="text-xs font-medium text-slate-600">Pending materials</p>
                    </Link>
                    <Link href="/project-manager/reports" className="rounded-xl border border-sky-100 bg-sky-50 p-4 transition hover:border-sky-300">
                      <CheckCircle2 className="h-5 w-5 text-sky-700" />
                      <p className="mt-3 text-2xl font-black text-slate-900">{pendingCompletions}</p>
                      <p className="text-xs font-medium text-slate-600">Completion reviews</p>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900">Upcoming deadlines</h2>
                      <p className="mt-1 text-xs text-slate-500">Upcoming task deadlines</p>
                    </div>
                    <CalendarDays className="h-5 w-5 text-slate-400" />
                  </div>
                  {upcomingTasks.length ? (
                    <div className="space-y-3">
                      {upcomingTasks.map((task) => {
                        const dueDate = new Date(task.dueDate as string);
                        const overdue = dueDate < now;
                        return (
                          <div key={task._id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                            <span className={`mt-0.5 rounded-lg p-2 ${overdue ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                              {overdue ? <AlertCircle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-800">{task.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{task.projectId?.name || 'Project'} · {dueDate.toLocaleDateString()}</p>
                            </div>
                            {overdue && <span className="text-[10px] font-bold uppercase text-red-600">Overdue</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No upcoming deadlines.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
