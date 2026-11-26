import type { ReactNode } from 'react';
import { RoleWorkspaceLayout } from '@/components/modules/workspace/RoleWorkspaceLayout';

export default function FinanceManagerLayout({ children }: { children: ReactNode }) {
  return <RoleWorkspaceLayout role="Finance Manager">{children}</RoleWorkspaceLayout>;
}
