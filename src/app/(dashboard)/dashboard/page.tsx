import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { getCatalog, getDomainSummaries } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LearningDashboardPage() {
  const catalog = await getCatalog();
  let learningDays: string[] = [];
  if (catalog.userId) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("user_learning_days")
      .select("activity_date").eq("user_id", catalog.userId)
      .order("activity_date", { ascending: false }).limit(400);
    if (error) throw new Error(`학습 일수를 불러오지 못했습니다: ${error.message}`);
    learningDays = (data ?? []).map((item) => item.activity_date);
  }
  return <DashboardOverview
    domains={getDomainSummaries(catalog)}
    topics={catalog.topics}
    progress={catalog.progress}
    learningDays={learningDays}
    isDemo={catalog.isDemo}
    asOf={new Date().toISOString()}
  />;
}
