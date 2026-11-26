import {
  Building2,
  CheckSquare,
  ClipboardList,
  HardHat,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    title: 'Project Setup & Assignment',
    description:
      'Create building projects, set dates and planned budgets, and assign Contractors to the right work.',
    icon: Building2,
    tag: 'Project Manager',
  },
  {
    title: 'Tasks & Deadlines',
    description:
      'Break project work into clear tasks, set priorities and deadlines, and monitor task status on a Kanban board.',
    icon: CheckSquare,
    tag: 'Work Planning',
  },
  {
    title: 'Progress Updates',
    description:
      'Contractors update assigned task progress and keep Project Managers informed as work moves forward.',
    icon: ClipboardList,
    tag: 'Live Progress',
  },
  {
    title: 'Daily & Delay Reports',
    description:
      'Submit daily work reports, describe site delays, and attach photos using image links.',
    icon: ClipboardList,
    tag: 'Site Reporting',
  },
  {
    title: 'Material Requests',
    description:
      'Contractors request materials for assigned work, and Project Managers review and respond to requests.',
    icon: Package,
    tag: 'Request Review',
  },
  {
    title: 'Completion Review',
    description:
      'Submit completed work for review. Project Managers approve or reject completion reports.',
    icon: HardHat,
    tag: 'Project Manager & Contractor',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] space-y-12 px-3">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Badge variant="accent" size="sm" dot>
            Comprehensive Modules
          </Badge>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Everything Your Jobsite Needs
          </h2>
          <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
            Keep Project Managers and Contractors aligned from project setup through task
            completion with clear, shared workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, icon: Icon, tag }) => (
            <Card key={title} className="border-slate-200 transition-shadow hover:shadow-md">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-500/10">
                    <Icon className="h-6 w-6 text-amber-500" />
                  </div>
                  <Badge variant="secondary" size="sm">
                    {tag}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
