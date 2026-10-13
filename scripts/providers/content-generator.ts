import type { TopicContent } from "../schemas/content-schema.ts";

export interface TopicBrief {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  domainTitle: string;
  prerequisiteTitles: string[];
}

export interface ContentGenerator {
  generate(topic: TopicBrief, signal?: AbortSignal): Promise<TopicContent>;
}
