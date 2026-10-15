import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getCatalog();
  return (
    <DashboardShell
      domains={catalog.domains}
      isDemo={catalog.isDemo}
      isAuthenticated={Boolean(catalog.userId)}
    >
      {children}
    </DashboardShell>
  );
}
