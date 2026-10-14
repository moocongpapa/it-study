import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RoadmapCanvas } from "@/components/roadmap/RoadmapCanvas";
import { getCatalog } from "@/lib/catalog";
import { buildRoadmapGraph } from "@/lib/graph";

export default async function DomainRoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const domain = catalog.domains.find((item) => item.slug === slug);
  if (!domain) notFound();

  const topics = catalog.topics.filter((topic) => topic.domain_id === domain.id);
  const graph = buildRoadmapGraph(topics, catalog.prerequisites, catalog.progress);

  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">도메인 지도를 준비하고 있습니다...</div>}>
      <RoadmapCanvas
        domain={domain}
        allDomains={catalog.domains}
        initialNodes={graph.nodes}
        initialEdges={graph.edges}
        allTopics={catalog.topics}
        allPrerequisites={catalog.prerequisites}
        initialProgress={catalog.progress}
        isDemo={catalog.isDemo}
        isAuthenticated={Boolean(catalog.userId)}
      />
    </Suspense>
  );
}
