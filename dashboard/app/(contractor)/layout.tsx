import { PortalShell } from '@/components/PortalShell';
import { requireContractor } from '@/lib/auth';

export default async function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireContractor();
  return (
    <PortalShell contractorName={user.contractor?.company_name ?? user.email ?? ''}>
      {children}
    </PortalShell>
  );
}
