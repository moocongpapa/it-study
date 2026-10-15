import type { Topic, TopicPrerequisite, TopicStatus, UserNodeProgress } from "@/types/roadmap";

export function buildTopicLearningStates(topics: Topic[], prerequisites: TopicPrerequisite[], progress: UserNodeProgress[]) {
  const savedByTopic = new Map(progress.map((item) => [item.topic_id, item]));
  const completed = new Set(progress.filter((item) => item.is_completed).map((item) => item.topic_id));
  const unmet = new Map<string, number>();
  for (const edge of prerequisites) {
    if (!completed.has(edge.from_topic_id)) unmet.set(edge.to_topic_id, (unmet.get(edge.to_topic_id) ?? 0) + 1);
  }
  return new Map(topics.map((topic) => {
    const saved = savedByTopic.get(topic.id);
    const unmetPrerequisites = unmet.get(topic.id) ?? 0;
    const status: TopicStatus = saved?.is_completed ? "completed" : unmetPrerequisites > 0 ? "locked" : saved ? "in_progress" : "available";
    return [topic.id, { status, unmetPrerequisites }] as const;
  }));
}
