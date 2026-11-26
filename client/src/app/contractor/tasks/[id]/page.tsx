'use client';

import { useParams } from 'next/navigation';
import { ContractorModulePage } from '@/components/modules/contractor/ContractorModulePage';

export default function ContractorTaskDetailsPage() {
  const params = useParams<{ id: string }>();
  return <ContractorModulePage section="task" itemId={params.id} />;
}
