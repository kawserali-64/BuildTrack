import { ArrowRight, Building2, Coins, Hammer, HardHat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const roles = [
  {
    role: 'Project Manager',
    icon: Building2,
    color: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white text-blue-950',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Create projects, assign Contractors and tasks, set deadlines, track progress, and review material and completion reports.',
  },
  {
    role: 'Site Engineer',
    icon: HardHat,
    color: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-950',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Manage on-site work, tasks, and daily progress reporting.',
  },
  {
    role: 'Finance Manager',
    icon: Coins,
    color: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-950',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Handle budgets, expenses, payments, and financial reporting.',
  },
  {
    role: 'Contractor',
    icon: Hammer,
    color: 'border-purple-200 bg-gradient-to-br from-purple-50 to-white text-purple-950',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'View assigned projects and tasks, start work, update progress, submit daily or delay reports, and request materials.',
  },
];

export function RolesSection() {
  return (
    <section id="roles" className="border-t border-slate-200 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] space-y-12 px-3">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Badge variant="default" size="sm">
            Project Team Workflows
          </Badge>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Built for Every Project Role
          </h2>
          <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
            Project Managers, Site Engineers, Finance Managers, and Contractors work together to
            keep every project moving.
          </p>
        </div>

        <div className="mx-auto grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {roles.map(({ role, icon: Icon, color, badgeColor, desc }) => (
            <article
              key={role}
              className={`relative flex min-h-64 flex-col justify-between overflow-hidden rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${color}`}
            >
              <div className="absolute -right-7 -top-7 opacity-[0.08]">
                <Icon className="h-36 w-36" />
              </div>
              <div className="relative space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
                  {role}
                </span>
                <p className="text-sm leading-relaxed text-slate-700">{desc}</p>
              </div>
              <span className="relative inline-flex items-center gap-1 pt-5 text-xs font-bold text-slate-600">
                {role} workflow
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
