import type { ReactNode } from 'react';
import { RoleWorkspaceLayout } from '@/components/modules/workspace/RoleWorkspaceLayout';

export default function ContractorLayout({ children }: { children: ReactNode }) {
  return <RoleWorkspaceLayout role="Contractor">{children}</RoleWorkspaceLayout>;
}
