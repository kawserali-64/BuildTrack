import type { ReactNode } from 'react';
import { RoleWorkspaceLayout } from '@/components/modules/workspace/RoleWorkspaceLayout';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleWorkspaceLayout role="Admin">{children}</RoleWorkspaceLayout>;
}
