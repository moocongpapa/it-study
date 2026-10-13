import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { initialReviewSchedule } from "@/lib/spaced-repetition";

export async function PATCH(request: Request, { params }: { params: Promise<{ topicId: string }> }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "미리보기에서는 브라우저에 진도를 저장합니다." }, { status: 400 });
  }

  const { topicId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topicId)) {
    return NextResponse.json({ error: "잘못된 토픽 ID입니다." }, { status: 400 });
  }
  const body = await request.json().catch(() => null) as { selfAssessment?: unknown } | null;
  const selfAssessment = body?.selfAssessment;
  if (!Number.isInteger(selfAssessment) || Number(selfAssessment) < 1 || Number(selfAssessment) > 5) {
    return NextResponse.json({ error: "이해도는 1부터 5까지 선택해 주세요." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const [topicResult, edgesResult, progressResult, quizzesResult] = await Promise.all([
    supabase.from("topics").select("id").eq("id", topicId).maybeSingle(),
    supabase.from("topic_prerequisites").select("from_topic_id").eq("to_topic_id", topicId),
    supabase.from("user_node_progress").select("topic_id,is_completed,completed_at").eq("user_id", userId),
    supabase.from("quizzes").select("id").eq("topic_id", topicId).limit(1),
  ]);
  if (topicResult.error || edgesResult.error || progressResult.error || quizzesResult.error) {
    return NextResponse.json({ error: "학습 상태를 확인하지 못했습니다." }, { status: 500 });
  }
  if (!topicResult.data) return NextResponse.json({ error: "토픽을 찾지 못했습니다." }, { status: 404 });
  if (quizzesResult.data?.length) return NextResponse.json({ error: "이 토픽은 4개 레벨의 퀴즈를 모두 통과해야 완료됩니다." }, { status: 409 });

  const completed = new Set((progressResult.data ?? []).filter((item) => item.is_completed).map((item) => item.topic_id));
  const current = (progressResult.data ?? []).find((item) => item.topic_id === topicId);
  if (current?.is_completed) return NextResponse.json({ ok: true, alreadyCompleted: true });
  if ((edgesResult.data ?? []).some((edge) => !completed.has(edge.from_topic_id))) {
    return NextResponse.json({ error: "선수 토픽을 먼저 완료해 주세요." }, { status: 409 });
  }

  const schedule = initialReviewSchedule();
  const { error } = await supabase.from("user_node_progress").upsert({
    user_id: userId,
    topic_id: topicId,
    is_completed: true,
    current_level: 4,
    self_assessment: Number(selfAssessment),
    completed_at: schedule.lastReviewedAt,
    last_reviewed_at: schedule.lastReviewedAt,
    next_review_at: schedule.nextReviewAt,
    review_interval_days: schedule.intervalDays,
    ease_factor: schedule.easeFactor,
    review_count: schedule.reviewCount,
  }, { onConflict: "user_id,topic_id" });
  if (error) return NextResponse.json({ error: "완료 상태를 저장하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true, completedAt: schedule.lastReviewedAt });
}
