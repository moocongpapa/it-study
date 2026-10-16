import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ topicId: string }> }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "미리보기에서는 브라우저에 진도를 저장합니다." }, { status: 400 });
  }
  const { topicId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topicId)) {
    return NextResponse.json({ error: "잘못된 토픽 ID입니다." }, { status: 400 });
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "학습 상태 요청이 올바르지 않습니다." }, { status: 400 });
  }
  const input = body as { isCompleted?: unknown; selfAssessment?: unknown };
  // Default preserves the previous self-assessment endpoint contract.
  const completed = input.isCompleted === undefined ? true : input.isCompleted;
  const assessment = input.selfAssessment ?? null;
  if (typeof completed !== "boolean" || (assessment !== null &&
      (!Number.isInteger(assessment) || Number(assessment) < 1 || Number(assessment) > 5))) {
    return NextResponse.json({ error: "학습 상태 또는 이해도 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data, error } = await supabase.rpc("set_topic_completion", {
    p_topic_id: topicId, p_completed: completed, p_self_assessment: assessment,
  });
  if (error) {
    const status = error.code === "P0002" ? 404 : error.code === "22023" ? 400 : 500;
    return NextResponse.json({ error: status === 404 ? "토픽을 찾지 못했습니다." : "완료 상태를 저장하지 못했습니다. 다시 시도해 주세요." }, { status });
  }
  revalidatePath("/roadmap", "layout");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true, progress: data });
}
