import type {
  Topic,
  TopicFlowEdge,
  TopicFlowNode,
  TopicPrerequisite,
  TopicStatus,
  UserNodeProgress,
} from "@/types/roadmap";

export function buildRoadmapGraph(
  visibleTopics: Topic[],
  allPrerequisites: TopicPrerequisite[],
  progress: UserNodeProgress[],
): { nodes: TopicFlowNode[]; edges: TopicFlowEdge[] } {
  const visibleIds = new Set(visibleTopics.map((topic) => topic.id));
  const progressByTopic = new Map(progress.map((item) => [item.topic_id, item]));
  const completedIds = new Set(progress.filter((item) => item.is_completed).map((item) => item.topic_id));
  const unmetByTopic = new Map<string, number>();

  for (const edge of allPrerequisites) {
    if (!completedIds.has(edge.from_topic_id)) {
      unmetByTopic.set(edge.to_topic_id, (unmetByTopic.get(edge.to_topic_id) ?? 0) + 1);
    }
  }

  const nodes: TopicFlowNode[] = visibleTopics.map((topic) => {
    const saved = progressByTopic.get(topic.id);
    const unmetPrerequisites = unmetByTopic.get(topic.id) ?? 0;
    let status: TopicStatus = "available";
    if (saved?.is_completed) status = "completed";
    else if (unmetPrerequisites > 0) status = "locked";
    else if (saved) status = "in_progress";

    return {
      id: topic.id,
      type: "topic",
      position: { x: 0, y: 0 },
      data: { topic, status, unmetPrerequisites },
      draggable: false,
    };
  });

  const edges: TopicFlowEdge[] = allPrerequisites
    .filter((edge) => visibleIds.has(edge.from_topic_id) && visibleIds.has(edge.to_topic_id))
    .map((edge) => ({
      id: `prereq:${edge.from_topic_id}:${edge.to_topic_id}`,
      source: edge.from_topic_id,
      target: edge.to_topic_id,
      type: "smoothstep",
      animated: completedIds.has(edge.from_topic_id),
      style: {
        stroke: completedIds.has(edge.from_topic_id) ? "#4ade80" : "#405368",
        strokeWidth: 2,
      },
    }));

  return { nodes, edges };
}
