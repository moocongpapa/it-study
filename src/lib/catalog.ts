import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import demoCatalog from "@/lib/demo-catalog.json";
import starterContent from "../../content/starter-content.json";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
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

function demoCatalogResult(): Catalog {
  return {
    domains: demo.domains,
    topics: demo.topics,
    prerequisites: demo.prerequisites,
    progress: [],
    userId: null,
    isDemo: true,
  };
}

async function demoArticle(topicSlug: string, fullPreview = false): Promise<Article | null> {
  const topic = demo.topics.find((item) => item.slug === topicSlug);
  if(fullPreview && topic) {
    const library=(await import("../../content/readable-library.json")).default;
    const row=library.find((item)=>item.slug===topicSlug);
    if(row)return {id:`demo-${topicSlug}`,topic_id:topic.id,...row,is_published:true,created_at:"",updated_at:""};
  }
  const existing = demo.articles.find((article) => article.topic_id === topic?.id);
  if (existing) return existing;
  const starter = starterContent.find((item) => item.slug === topicSlug);
  if (!starter || !topic) return null;
  return {
    id: `demo-${starter.slug}`,
    topic_id: topic.id,
    level_1_mental_model: starter.level_1_mental_model,
    level_2_core_engineering: starter.level_2_core_engineering,
    level_3_troubleshooting: starter.level_3_troubleshooting,
    level_4_architecture_tradeoffs: starter.level_4_architecture_tradeoffs,
    is_published: true,
    created_at: "",
    updated_at: "",
  };
}

export const getCatalog = cache(async (): Promise<Catalog> => {
  if (!isSupabaseConfigured) return demoCatalogResult();

  try {
    const supabase = await createClient();
    const [domainsResult, topicsResult, edgesResult, claimsResult] = await Promise.all([
      supabase.from("domains").select("*").order("display_order"),
      supabase.from("topics").select("*").order("display_order"),
      supabase.from("topic_prerequisites").select("*"),
      supabase.auth.getClaims(),
    ]);

    const firstError = domainsResult.error ?? topicsResult.error ?? edgesResult.error;
    if (firstError) throw new Error(`로드맵 데이터를 불러오지 못했습니다: ${firstError.message}`);
    if (!domainsResult.data?.length || !topicsResult.data?.length) {
      throw new Error("도메인 또는 토픽 시드 데이터가 없습니다.");
    }

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
  } catch (error) {
    unstable_rethrow(error);
    console.error("[catalog] 학습 DB 조회 실패, 데모 데이터 표시:", error);
    return demoCatalogResult();
  }
});

export async function getArticle(topicSlug: string): Promise<Article | null> {
  if (!isSupabaseConfigured) return demoArticle(topicSlug, true);
  const { data, error } = await createPublicClient().from("articles")
    .select("id,topic_id,level_1_mental_model,level_2_core_engineering,level_3_troubleshooting,level_4_architecture_tradeoffs,is_published,created_at,updated_at,topics!inner(slug)")
    .eq("topics.slug", topicSlug).eq("is_published", true).maybeSingle();
  if (error) throw new Error(`아티클 조회 실패: ${error.message}`);
  if (!data) return null;
  // Keep the API shape independent of the joined lookup metadata.
  const article = { ...data };
  Reflect.deleteProperty(article, "topics");
  return article as Article;
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
