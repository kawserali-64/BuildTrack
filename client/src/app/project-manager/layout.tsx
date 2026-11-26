import type { ReactNode } from 'react';
import { RoleWorkspaceLayout } from '@/components/modules/workspace/RoleWorkspaceLayout';

export default function ProjectManagerLayout({ children }: { children: ReactNode }) {
  return <RoleWorkspaceLayout role="Project Manager">{children}</RoleWorkspaceLayout>;
}
