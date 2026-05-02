import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { requireOwner } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOwner();

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={user.email} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
