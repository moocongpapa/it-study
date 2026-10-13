import { cache } from "react";
import demoCatalog from "@/lib/demo-catalog.json";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Article,
  Catalog,
  Domain,
  DomainSummary,
  Topic,
  TopicPrerequisite,
  UserNodeProgress,
} from "@/types/roadmap";

const demo = demoCatalog as unknown as Omit<Catalog, "progress" | "userId" | "isDemo"> & {
  articles: Article[];
};

export const getCatalog = cache(async (): Promise<Catalog> => {
  if (!isSupabaseConfigured) {
    return {
      domains: demo.domains,
      topics: demo.topics,
      prerequisites: demo.prerequisites,
      progress: [],
      userId: null,
      isDemo: true,
    };
  }

  const supabase = await createClient();
  const [domainsResult, topicsResult, edgesResult, claimsResult] = await Promise.all([
    supabase.from("domains").select("*").order("display_order"),
    supabase.from("topics").select("*").order("display_order"),
    supabase.from("topic_prerequisites").select("*"),
    supabase.auth.getClaims(),
  ]);

  const firstError = domainsResult.error ?? topicsResult.error ?? edgesResult.error;
  if (firstError) throw new Error(`로드맵 데이터를 불러오지 못했습니다: ${firstError.message}`);

  const userId = claimsResult.data?.claims?.sub ?? null;
  let progress: UserNodeProgress[] = [];
  if (userId) {
    const result = await supabase
      .from("user_node_progress")
      .select("topic_id,is_completed,current_level,self_assessment,completed_at,last_reviewed_at,next_review_at,review_interval_days,ease_factor,review_count")
      .eq("user_id", userId);
    if (result.error) throw new Error(`학습 상태를 불러오지 못했습니다: ${result.error.message}`);
    progress = (result.data ?? []) as UserNodeProgress[];
  }

  return {
    domains: (domainsResult.data ?? []) as Domain[],
    topics: (topicsResult.data ?? []) as Topic[],
    prerequisites: (edgesResult.data ?? []) as TopicPrerequisite[],
    progress,
    userId,
    isDemo: false,
  };
});

export async function getArticle(topicSlug: string): Promise<Article | null> {
  if (!isSupabaseConfigured) {
    const topic = demo.topics.find((item) => item.slug === topicSlug);
    return demo.articles.find((article) => article.topic_id === topic?.id) ?? null;
  }

  const supabase = await createClient();
  const topicResult = await supabase
    .from("topics")
    .select("id")
    .eq("slug", topicSlug)
    .maybeSingle();
  if (topicResult.error) throw new Error(topicResult.error.message);
  if (!topicResult.data) return null;

  const articleResult = await supabase
    .from("articles")
    .select("*")
    .eq("topic_id", topicResult.data.id)
    .eq("is_published", true)
    .maybeSingle();
  if (articleResult.error) throw new Error(articleResult.error.message);
  return (articleResult.data as Article | null) ?? null;
}

export function getDomainSummaries(catalog: Catalog): DomainSummary[] {
  const completed = new Set(catalog.progress.filter((item) => item.is_completed).map((item) => item.topic_id));
  const counts = new Map<string, { total: number; completed: number }>();

  for (const topic of catalog.topics) {
    const count = counts.get(topic.domain_id) ?? { total: 0, completed: 0 };
    count.total += 1;
    if (completed.has(topic.id)) count.completed += 1;
    counts.set(topic.domain_id, count);
  }

  return catalog.domains.map((domain) => ({
    ...domain,
    topicCount: counts.get(domain.id)?.total ?? 0,
    completedCount: counts.get(domain.id)?.completed ?? 0,
  }));
}
