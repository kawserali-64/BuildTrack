'use client';

import { useParams } from 'next/navigation';
import { ContractorModulePage } from '@/components/modules/contractor/ContractorModulePage';

export default function ContractorProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  return <ContractorModulePage section="project" itemId={params.id} />;
}
