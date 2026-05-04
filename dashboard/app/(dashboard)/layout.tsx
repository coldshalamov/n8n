import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { CommandPaletteRoot } from '@/components/CommandPalette';
import { GlobalDialogs } from '@/components/GlobalDialogs';
import { TopBar } from '@/components/TopBar';
import { requireOwner } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ActivityLog, Contractor, Property } from '@/lib/db.types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOwner();
  const supabase = await createClient();

  // Pre-load lightweight indexes for the command palette so cmd-K is instant.
  const [propsRes, contractorsRes, activityRes] = await Promise.all([
    supabase.from('properties').select('id,address,city,status').order('address').limit(200),
    supabase
      .from('contractors')
      .select('id,company_name,trade')
      .order('company_name')
      .limit(200),
    supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const activity = (activityRes.data ?? []) as ActivityLog[];

  const propertyOptions = ((propsRes.data ?? []) as Pick<Property, 'id' | 'address'>[]).map((p) => ({
    id: p.id,
    address: p.address,
  }));
  const contractorOptions = ((contractorsRes.data ?? []) as Pick<Contractor, 'id' | 'company_name' | 'trade'>[]).map((c) => ({
    id: c.id,
    company_name: c.company_name,
    trade: c.trade,
  }));

  const propIndex = ((propsRes.data ?? []) as Pick<Property, 'id' | 'address' | 'city' | 'status'>[]).map((p) => ({
    id: p.id,
    label: p.address,
    sub: p.city ?? '',
    status: p.status,
  }));
  const contractorIndex = ((contractorsRes.data ?? []) as Pick<Contractor, 'id' | 'company_name' | 'trade'>[]).map((c) => ({
    id: c.id,
    label: c.company_name,
    sub: c.trade ?? '',
  }));

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={user.email} />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileNav />
        <TopBar activity={activity} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="canvas space-y-8">{children}</div>
        </main>
        <footer className="border-t border-line/60 px-4 py-4 text-[11px] text-ink-faint sm:px-6 lg:px-8">
          <div className="canvas flex flex-wrap items-center justify-between gap-2">
            <span>RehabOps · operating console</span>
            <span className="num">Signed in as {user.email}</span>
          </div>
        </footer>
      </div>
      <CommandPaletteRoot
        properties={propIndex}
        contractors={contractorIndex}
      />
      <GlobalDialogs
        properties={propertyOptions}
        contractors={contractorOptions}
      />
    </div>
  );
}
