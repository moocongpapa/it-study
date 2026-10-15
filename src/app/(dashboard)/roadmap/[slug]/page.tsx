import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TopicList } from "@/components/roadmap/TopicList";
import { getCatalog } from "@/lib/catalog";

export default async function DomainRoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const domain = catalog.domains.find((item) => item.slug === slug);
  if (!domain) notFound();

  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">학습 주제를 불러오고 있습니다...</div>}>
      <TopicList
        domain={domain}
        allDomains={catalog.domains}
        allTopics={catalog.topics}
        allPrerequisites={catalog.prerequisites}
        initialProgress={catalog.progress}
        isDemo={catalog.isDemo}
        isAuthenticated={Boolean(catalog.userId)}
      />
    </Suspense>
  );
}
