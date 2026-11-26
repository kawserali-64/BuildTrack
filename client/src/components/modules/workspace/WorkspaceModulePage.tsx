import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface WorkspaceModulePageProps {
  title: string;
  role: string;
}

export function WorkspaceModulePage({ title, role }: WorkspaceModulePageProps) {
  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <Badge variant="accent" size="sm" dot className="font-bold">
          {role}
        </Badge>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          This page is ready for its role-specific workflow.
        </p>
      </header>
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">Module not implemented yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Project data and actions are not available on this page yet.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
