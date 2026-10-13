import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCatalog, getDomainSummaries } from "@/lib/catalog";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getCatalog();
  const completedTopics = catalog.progress.filter((item) => item.is_completed).length;
  return (
    <DashboardShell
      domains={getDomainSummaries(catalog)}
      topicDomainMap={Object.fromEntries(catalog.topics.map((topic) => [topic.id, topic.domain_id]))}
      totalTopics={catalog.topics.length}
      completedTopics={completedTopics}
      isDemo={catalog.isDemo}
      isAuthenticated={Boolean(catalog.userId)}
    >
      {children}
    </DashboardShell>
  );
}
