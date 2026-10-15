import { Suspense } from "react";
import { TopicList } from "@/components/roadmap/TopicList";
import { getCatalog } from "@/lib/catalog";

export default async function CompleteRoadmapPage() {
  const catalog = await getCatalog();
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">학습 주제를 불러오고 있습니다...</div>}>
      <TopicList
        domain={null}
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
