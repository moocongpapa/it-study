import { Suspense } from "react";
import { RoadmapCanvas } from "@/components/roadmap/RoadmapCanvas";
import { getCatalog } from "@/lib/catalog";
import { buildRoadmapGraph } from "@/lib/graph";

export default async function CompleteRoadmapPage() {
  const catalog = await getCatalog();
  const graph = buildRoadmapGraph(catalog.topics, catalog.prerequisites, catalog.progress);
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">지식 지도를 준비하고 있습니다...</div>}>
      <RoadmapCanvas
        domain={null}
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
