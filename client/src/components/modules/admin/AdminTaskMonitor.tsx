'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Clock3, ListTodo, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AdminTask {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate?: string;
  progressPercent: number;
  projectId?: { name?: string; location?: string };
  assignedBy: { name: string };
  assignedContractors: Array<{ id: string; name: string; company?: string }>;
}

interface TaskResponse {
  success: boolean;
  data: AdminTask[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  stats: {
    total: number;
    overdue: number;
    completed: number;
    statusCounts: Record<string, number>;
  };
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : 'No deadline';
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load system tasks.';
}

export function AdminTaskMonitor() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [stats, setStats] = useState<TaskResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    async function loadTasks() {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      try {
        const response = await apiClient.get<TaskResponse>(`/admin/tasks?${params.toString()}`);
        if (active) {
          setTasks(response.data.data);
          setStats(response.data.stats);
          setTotalPages(response.data.totalPages);
        }
      } catch (loadError) {
        if (active) setError(errorText(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTasks();
    return () => {
      active = false;
    };
  }, [page, search, status]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setStatus(statusInput);
  }

  const summary = [
    { label: 'All system tasks', value: stats?.total ?? 0, icon: ListTodo },
    { label: 'Overdue tasks', value: stats?.overdue ?? 0, icon: Clock3 },
    { label: 'Completed tasks', value: stats?.completed ?? 0, icon: CheckCircle2 },
  ];

  return (
    <section className="space-y-5 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <Badge variant="accent" size="sm" dot className="font-bold">Admin · Read-only monitoring</Badge>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">System task monitor</h1>
        <p className="mt-1 text-sm text-slate-500">Review tasks across every project, Project Manager, and Contractor. Task creation and assignment remain with Project Managers.</p>
      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      <div className="grid gap-3 sm:grid-cols-3">
        {summary.map(({ label, value, icon: Icon }) => (
          <Card key={label}><CardContent className="flex items-center gap-3 p-4"><span className="rounded-lg bg-amber-50 p-2 text-amber-700"><Icon className="h-5 w-5" /></span><div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900">{value}</p></div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <form onSubmit={applyFilters} className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
            <label className="sr-only" htmlFor="admin-task-search">Search tasks</label>
            <input id="admin-task-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search title or description" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" />
            <label className="sr-only" htmlFor="admin-task-status">Filter by status</label>
            <select id="admin-task-status" value={statusInput} onChange={(event) => setStatusInput(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">All statuses</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="under_review">Under review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            <Button type="submit">Apply filters</Button>
          </form>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading all tasks…</div>
          ) : tasks.length ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <article key={task._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-slate-900">{task.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{task.projectId?.name || 'Unknown project'}{task.projectId?.location ? ` · ${task.projectId.location}` : ''}</p>
                    </div>
                    <Badge variant="secondary">{task.status.replace('_', ' ')}</Badge>
                  </div>
                  {task.description && <p className="mt-3 text-sm leading-5 text-slate-600">{task.description}</p>}
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                    <p>Assigned by: <span className="font-semibold text-slate-800">{task.assignedBy.name}</span></p>
                    <p>Deadline: <span className="font-semibold text-slate-800">{formatDate(task.dueDate)}</span></p>
                    <p>Priority: <span className="font-semibold capitalize text-slate-800">{task.priority}</span></p>
                    <p>Progress: <span className="font-semibold text-slate-800">{task.progressPercent}%</span></p>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-600">Assigned Contractors</p>
                    {task.assignedContractors.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {task.assignedContractors.map((contractor) => <span key={contractor.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{contractor.name}{contractor.company ? ` · ${contractor.company}` : ''}</span>)}
                      </div>
                    ) : <p className="mt-1 text-xs text-slate-500">No Contractor assigned.</p>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No tasks match the selected filters.</p>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
