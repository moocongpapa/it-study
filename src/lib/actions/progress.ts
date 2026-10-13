"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { checkDemoQuizAnswer, demoQuizBank } from "@/lib/quiz-bank";
import { calculateNextReview, initialReviewSchedule } from "@/lib/spaced-repetition";
import { createClient } from "@/lib/supabase/server";
import type { QuizFeedback, TopicProgressResult, UserNodeProgress } from "@/types/roadmap";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authenticatedClient() {
  if (!isSupabaseConfigured) throw new Error("Supabase 연결이 필요합니다.");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error("로그인이 필요합니다.");
  return { supabase, userId };
}

/** The passedQuiz argument is a UI intent only; pass rows are rechecked on the server. */
export async function updateTopicProgress(topicId: string, level: number, passedQuiz: boolean): Promise<TopicProgressResult> {
  if (!uuidPattern.test(topicId) || !Number.isInteger(level) || level < 1 || level > 4 || typeof passedQuiz !== "boolean") {
    throw new Error("학습 상태 요청이 올바르지 않습니다.");
  }
  const { supabase, userId } = await authenticatedClient();
  const [topicResult, prerequisitesResult, progressResult, quizzesResult, passesResult, allEdgesResult] = await Promise.all([
    supabase.from("topics").select("id").eq("id", topicId).maybeSingle(),
    supabase.from("topic_prerequisites").select("from_topic_id").eq("to_topic_id", topicId),
    supabase.from("user_node_progress").select("topic_id,is_completed,current_level,completed_at,next_review_at").eq("user_id", userId),
    supabase.from("quizzes").select("id,level").eq("topic_id", topicId),
    supabase.from("user_quiz_passes").select("quiz_id").eq("user_id", userId),
    supabase.from("topic_prerequisites").select("from_topic_id,to_topic_id"),
  ]);
  if (topicResult.error || prerequisitesResult.error || progressResult.error || quizzesResult.error || passesResult.error || allEdgesResult.error) {
    throw new Error("학습 상태를 확인하지 못했습니다.");
  }
  if (!topicResult.data) throw new Error("토픽을 찾지 못했습니다.");

  const progress = (progressResult.data ?? []) as Pick<UserNodeProgress, "topic_id" | "is_completed" | "current_level" | "completed_at" | "next_review_at">[];
  const completedIds = new Set(progress.filter((item) => item.is_completed).map((item) => item.topic_id));
  if ((prerequisitesResult.data ?? []).some((edge) => !completedIds.has(edge.from_topic_id))) {
    throw new Error("선수 토픽을 먼저 완료해 주세요.");
  }
  const existing = progress.find((item) => item.topic_id === topicId);
  const quizzes = quizzesResult.data ?? [];
  const passedIds = new Set((passesResult.data ?? []).map((item) => item.quiz_id));
  const hasAllLevels = [1, 2, 3, 4].every((candidate) => quizzes.some((quiz) => quiz.level === candidate));
  const allPassed = quizzes.length > 0 && hasAllLevels && quizzes.every((quiz) => passedIds.has(quiz.id));
  const currentLevel = quizzes.length
    ? ([1, 2, 3, 4].find((candidate) => quizzes.filter((quiz) => quiz.level === candidate).some((quiz) => !passedIds.has(quiz.id))) ?? 4)
    : existing?.current_level ?? 1;
  const isCompleted = Boolean(existing?.is_completed || allPassed);
  let nextReviewAt = existing?.next_review_at ?? null;

  if (passedQuiz && quizzes.length && !existing?.is_completed) {
    const completedNow = allPassed;
    const schedule = completedNow ? initialReviewSchedule() : null;
    const { error } = await supabase.from("user_node_progress").upsert({
      user_id: userId,
      topic_id: topicId,
      is_completed: completedNow,
      current_level: completedNow ? 4 : currentLevel,
      completed_at: completedNow ? schedule?.lastReviewedAt : null,
      ...(schedule ? {
        last_reviewed_at: schedule.lastReviewedAt,
        next_review_at: schedule.nextReviewAt,
        review_interval_days: schedule.intervalDays,
        ease_factor: schedule.easeFactor,
        review_count: schedule.reviewCount,
      } : {}),
    }, { onConflict: "user_id,topic_id" });
    if (error) throw new Error(`진도를 저장하지 못했습니다: ${error.message}`);
    if (schedule) nextReviewAt = schedule.nextReviewAt;
    revalidatePath("/roadmap", "layout");
    revalidatePath("/dashboard");
  }

  const unlockedTopicIds: string[] = [];
  if (isCompleted) {
    completedIds.add(topicId);
    const allEdges = allEdgesResult.data ?? [];
    const successors = [...new Set(allEdges.filter((edge) => edge.from_topic_id === topicId).map((edge) => edge.to_topic_id))];
    for (const successor of successors) {
      if (!completedIds.has(successor) && allEdges.filter((edge) => edge.to_topic_id === successor)
        .every((edge) => completedIds.has(edge.from_topic_id))) unlockedTopicIds.push(successor);
    }
  }
  return { isCompleted, currentLevel, nextReviewAt, unlockedTopicIds };
}

export async function submitQuizAnswer(
  topicId: string,
  quizId: string,
  answer: { choiceIndex: number | null; shortAnswer: string | null },
): Promise<QuizFeedback> {
  if (typeof topicId !== "string" || typeof quizId !== "string" || !answer ||
      (answer.choiceIndex !== null && (!Number.isInteger(answer.choiceIndex) || answer.choiceIndex < 0 || answer.choiceIndex > 5)) ||
      (answer.shortAnswer !== null && (typeof answer.shortAnswer !== "string" || answer.shortAnswer.length > 500))) {
    throw new Error("답안 형식이 올바르지 않습니다.");
  }
  if (!isSupabaseConfigured || !uuidPattern.test(topicId)) {
    const quiz = demoQuizBank.find((item) => item.id === quizId && item.topic_id === topicId);
    const feedback = quiz ? checkDemoQuizAnswer(quizId, answer.choiceIndex, answer.shortAnswer) : null;
    if (!feedback) throw new Error("문제를 찾지 못했습니다.");
    return feedback;
  }
  if (!uuidPattern.test(topicId) || !uuidPattern.test(quizId)) throw new Error("문제 ID가 올바르지 않습니다.");
  const { supabase, userId } = await authenticatedClient();
  const [quizResult, prerequisitesResult, progressResult] = await Promise.all([
    supabase.from("quizzes").select("id,topic_id,level,question_type").eq("id", quizId).maybeSingle(),
    supabase.from("topic_prerequisites").select("from_topic_id").eq("to_topic_id", topicId),
    supabase.from("user_node_progress").select("topic_id,is_completed").eq("user_id", userId).eq("is_completed", true),
  ]);
  if (quizResult.error || prerequisitesResult.error || progressResult.error) throw new Error("문제를 확인하지 못했습니다.");
  const quiz = quizResult.data;
  if (!quiz || quiz.topic_id !== topicId) throw new Error("문제를 찾지 못했습니다.");
  const completed = new Set((progressResult.data ?? []).map((item) => item.topic_id));
  if ((prerequisitesResult.data ?? []).some((edge) => !completed.has(edge.from_topic_id))) {
    throw new Error("선수 토픽을 먼저 완료해 주세요.");
  }
  if (quiz.question_type === "multiple_choice" && answer.choiceIndex === null) throw new Error("선택지를 골라 주세요.");
  if (quiz.question_type === "short_answer" && !answer.shortAnswer?.trim()) throw new Error("단답을 입력해 주세요.");

  const { data, error } = await supabase.rpc("submit_quiz_answer", {
    p_quiz_id: quizId,
    p_choice_index: answer.choiceIndex,
    p_short_answer: answer.shortAnswer,
  });
  if (error || !data?.length) throw new Error("답안을 채점하지 못했습니다.");
  const result = data[0] as { passed: boolean; correct_answer: string; explanation: string; topic_id: string; level: number };
  const feedback: QuizFeedback = {
    passed: result.passed,
    correctAnswer: result.correct_answer,
    explanation: result.explanation,
  };
  if (result.passed) feedback.progress = await updateTopicProgress(topicId, result.level, true);
  return feedback;
}

export async function reviewTopic(topicId: string, quality: number): Promise<UserNodeProgress> {
  if (!uuidPattern.test(topicId) || !Number.isInteger(quality) || quality < 1 || quality > 5) {
    throw new Error("복습 입력이 올바르지 않습니다.");
  }
  const { supabase, userId } = await authenticatedClient();
  const { data: existing, error: readError } = await supabase.from("user_node_progress")
    .select("topic_id,is_completed,current_level,self_assessment,completed_at,last_reviewed_at,next_review_at,review_interval_days,ease_factor,review_count")
    .eq("user_id", userId).eq("topic_id", topicId).maybeSingle();
  if (readError || !existing?.is_completed) throw new Error("완료한 토픽만 복습할 수 있습니다.");
  const schedule = calculateNextReview({
    reviewCount: existing.review_count,
    easeFactor: Number(existing.ease_factor),
    quality,
  });
  const { data, error } = await supabase.from("user_node_progress").update({
    self_assessment: quality,
    last_reviewed_at: schedule.lastReviewedAt,
    next_review_at: schedule.nextReviewAt,
    review_interval_days: schedule.intervalDays,
    ease_factor: schedule.easeFactor,
    review_count: schedule.reviewCount,
  }).eq("user_id", userId).eq("topic_id", topicId).eq("review_count", existing.review_count)
    .select("topic_id,is_completed,current_level,self_assessment,completed_at,last_reviewed_at,next_review_at,review_interval_days,ease_factor,review_count")
    .maybeSingle();
  if (error || !data) throw new Error("복습 상태가 바뀌었습니다. 다시 시도해 주세요.");
  revalidatePath("/dashboard");
  return data as UserNodeProgress;
}
