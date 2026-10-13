import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicDemoQuizzes } from "@/lib/quiz-bank";
import { createClient } from "@/lib/supabase/server";
import type { Quiz } from "@/types/roadmap";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  if (!isSupabaseConfigured) {
    return NextResponse.json({ quizzes: getPublicDemoQuizzes(topicId), passedQuizIds: [] }, {
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!uuidPattern.test(topicId)) return NextResponse.json({ error: "잘못된 토픽 ID입니다." }, { status: 400 });
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;
  const [quizzesResult, passesResult] = await Promise.all([
    supabase.from("quizzes").select("id,topic_id,level,question,choices,question_type").eq("topic_id", topicId).order("level"),
    userId ? supabase.from("user_quiz_passes").select("quiz_id").eq("user_id", userId) : Promise.resolve({ data: [], error: null }),
  ]);
  if (quizzesResult.error || passesResult.error) {
    return NextResponse.json({ error: "문제를 불러오지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({
    quizzes: (quizzesResult.data ?? []) as Quiz[],
    passedQuizIds: (passesResult.data ?? []).map((item) => item.quiz_id),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
