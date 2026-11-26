'use client';

import React from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  DollarSign,
  HardHat,
  Package,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';
import type { WorkspaceRole } from '@/lib/role-routing';
import type { UserRole } from '@/types/auth.types';

interface DashboardPanel {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface DashboardContent {
  heading: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  panels: DashboardPanel[];
}

const dashboardContent: Record<UserRole, DashboardContent> = {
  Admin: {
    heading: 'Company overview',
    description: 'Manage company-wide projects, user access, and operational activity.',
    emptyTitle: 'No company activity yet',
    emptyDescription: 'Project and team activity will appear here as your workspace is populated.',
    panels: [
      { title: 'Project portfolio', description: 'Create and monitor company construction projects.', icon: Building2 },
      { title: 'User access', description: 'Manage team accounts, roles, and permissions.', icon: Users },
      { title: 'System settings', description: 'Configure company-wide workspace preferences.', icon: Settings },
    ],
  },
  'Project Manager': {
    heading: 'Project delivery',
    description: 'Coordinate project plans, task dependencies, milestones, and site reports.',
    emptyTitle: 'No managed projects yet',
    emptyDescription: 'Projects assigned to you and their delivery updates will appear here.',
    panels: [
      { title: 'Projects & milestones', description: 'Review schedules, targets, and project completion.', icon: Building2 },
      { title: 'Tasks & blockers', description: 'Track assignments, deadlines, and task dependencies.', icon: CheckSquare },
      { title: 'Site reports', description: 'Review progress reports and reported delays.', icon: ClipboardList },
    ],
  },
  'Site Engineer': {
    heading: 'Site operations',
    description: 'Focus on assigned site activities, progress reporting, and material usage.',
    emptyTitle: 'No site activities assigned',
    emptyDescription: 'Your assigned work and site updates will appear here.',
    panels: [
      { title: 'Assigned site work', description: 'Review active site tasks and their deadlines.', icon: Building2 },
      { title: 'Daily progress', description: 'Record work updates and report construction delays.', icon: ClipboardList },
      { title: 'Material usage', description: 'Track site consumption and material availability.', icon: Package },
    ],
  },
  'Finance Manager': {
    heading: 'Financial overview',
    description: 'Monitor project budgets, expense activity, and cost reports.',
    emptyTitle: 'No financial records available',
    emptyDescription: 'Project budgets and expenses will appear here when available to you.',
    panels: [
      { title: 'Project budgets', description: 'Compare planned budgets with actual project costs.', icon: DollarSign },
      { title: 'Expenses', description: 'Review recorded expenses and their supporting details.', icon: Receipt },
      { title: 'Financial reports', description: 'Review project-level spending and budget utilization.', icon: BarChart3 },
    ],
  },
  Contractor: {
    heading: 'Assigned work',
    description: 'Review your work packages, deadlines, progress updates, and material requests.',
    emptyTitle: 'No work assigned yet',
    emptyDescription: 'Projects and tasks assigned to your contractor account will appear here.',
    panels: [
      { title: 'My projects', description: 'View construction projects assigned to your company.', icon: Building2 },
      { title: 'Tasks & deadlines', description: 'Review assigned tasks and their due dates.', icon: CalendarDays },
      { title: 'Progress & materials', description: 'Submit work updates and track material requests.', icon: HardHat },
    ],
  },
  Unassigned: {
    heading: 'Workspace access pending',
    description: 'Your account does not currently have a workspace role.',
    emptyTitle: 'No role assigned',
    emptyDescription: 'Contact a BuildTrack administrator to get access to role-specific workspace features.',
    panels: [],
  },
};

interface RoleDashboardProps {
  role: WorkspaceRole;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({ role }) => {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; email?: string } | undefined;
  const content = dashboardContent[role];

  return (
    <div className="space-y-6 pb-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="accent" size="sm" dot className="font-bold">
              {role}
            </Badge>
            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-mono font-bold text-amber-700">
              Currency: BDT (৳)
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {content.heading}, {user?.name || 'User'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{content.description}</p>
          {user?.email && <p className="mt-2 text-xs text-slate-400">{user.email}</p>}
        </section>

        <section aria-label={`${role} dashboard panels`} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {content.panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <Card key={panel.title} className="h-full">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">{panel.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{panel.description}</p>
                  <div className="mt-5 flex-1 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-xs text-slate-500">
                    {content.emptyTitle}
                    <p className="mt-1 leading-relaxed">{content.emptyDescription}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {content.panels.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-slate-500">
              {content.emptyDescription}
            </CardContent>
          </Card>
        )}
    </div>
  );
};
