import type { ReactNode } from 'react';
import { RoleWorkspaceLayout } from '@/components/modules/workspace/RoleWorkspaceLayout';

export default function SiteEngineerLayout({ children }: { children: ReactNode }) {
  return <RoleWorkspaceLayout role="Site Engineer">{children}</RoleWorkspaceLayout>;
}
