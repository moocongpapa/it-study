"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleHelp, LockKeyhole, RotateCcw, Sparkles, X } from "lucide-react";
import { submitQuizAnswer } from "@/lib/actions/progress";
import { completeDemoTopic, markDemoQuizPassed, readDemoLearning } from "@/lib/demo-learning";
import { cn } from "@/lib/utils";
import type { Quiz, QuizFeedback, Topic, TopicProgressResult } from "@/types/roadmap";

interface QuizSessionProps {
  topic: Topic;
  level: 1 | 2 | 3 | 4;
  locked: boolean;
  isDemo: boolean;
  requiresLogin: boolean;
  onAvailability: (hasQuizzes: boolean) => void;
  onProgressUpdate: (progress: TopicProgressResult) => void;
}

export function QuizSession({ topic, level, locked, isDemo, requiresLogin, onAvailability, onProgressUpdate }: QuizSessionProps) {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [shortAnswer, setShortAnswer] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/quizzes/${encodeURIComponent(topic.id)}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]), cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("퀴즈를 불러오지 못했습니다.");
        return response.json() as Promise<{ quizzes: Quiz[]; passedQuizIds: string[] }>;
      })
      .then(({ quizzes: fetched, passedQuizIds }) => {
        if (controller.signal.aborted) return;
        const passed = isDemo ? readDemoLearning().passedQuizIds : passedQuizIds;
        const current = fetched.filter((quiz) => quiz.level === level);
        setAllQuizzes(fetched);
        setQuizzes(current);
        setPassedIds(passed);
        setIndex(Math.max(0, current.findIndex((quiz) => !passed.includes(quiz.id))));
        onAvailability(fetched.length > 0);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "퀴즈를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [topic.id, level, isDemo, onAvailability, loadAttempt]);

  const quiz = quizzes?.[index];
  const levelComplete = Boolean(quizzes?.length && quizzes.every((item) => passedIds.includes(item.id)));

  async function submit(choiceIndex: number | null, text: string | null) {
    if (!quiz || locked || requiresLogin || loading) return;
    setLoading(true);
    setError(null);
    setSelectedChoice(choiceIndex);
    setFeedback(null);
    try {
      const result = await submitQuizAnswer(topic.id, quiz.id, { choiceIndex, shortAnswer: text });
      setFeedback(result);
      if (result.passed) {
        const nextPassed = [...new Set([...passedIds, quiz.id])];
        setPassedIds(nextPassed);
        if (isDemo) {
          markDemoQuizPassed(quiz.id);
          if ([1, 2, 3, 4].every((candidate) => allQuizzes.some((item) => item.level === candidate)) &&
              allQuizzes.every((item) => nextPassed.includes(item.id))) {
            completeDemoTopic(topic.id, 4);
            onProgressUpdate({ isCompleted: true, currentLevel: 4, nextReviewAt: readDemoLearning().progress[topic.id]?.next_review_at ?? null, unlockedTopicIds: [] });
          }
        } else if (result.progress) onProgressUpdate(result.progress);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "채점에 실패했습니다.");
    } finally { setLoading(false); }
  }

  function nextQuestion() {
    if (!quizzes) return;
    const next = quizzes.findIndex((item, candidate) => candidate > index && !passedIds.includes(item.id));
    if (next >= 0) setIndex(next);
    else setIndex(Math.max(0, quizzes.findIndex((item) => !passedIds.includes(item.id))));
    setFeedback(null);
    setShortAnswer("");
    setSelectedChoice(null);
  }

  if (error && !quizzes) return <div role="alert" className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p>퀴즈를 불러오지 못했어요.</p><button type="button" onClick={() => { setError(null); setLoadAttempt((attempt) => attempt + 1); }} className="mt-2 min-h-11 rounded-lg px-3 font-semibold underline focus-visible:ring-2 focus-visible:ring-rose-600">퀴즈 다시 불러오기</button></div>;
  if (!quizzes) return <div className="mt-8 h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" aria-label="퀴즈 불러오는 중" />;
  if (!quizzes.length) return <div className="mt-9 rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500"><CircleHelp className="mx-auto mb-2 size-5" />이 레벨의 퀴즈를 준비하고 있어요.</div>;

  return (
    <section className="mt-6 rounded-xl border border-blue-200 bg-white p-4 sm:p-5" aria-label={`레벨 ${level} 확인 퀴즈`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700"><Sparkles className="size-4" />{level}단계 · 확인 퀴즈</div>
        <span className="text-[11px] tabular-nums text-slate-500">{passedIds.filter((id) => quizzes.some((item) => item.id === id)).length}/{quizzes.length} 통과</span>
      </div>
      {requiresLogin ? <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-slate-700"><p>채점 퀴즈는 로그인한 뒤 풀 수 있어요. 그림 수업과 실무 연습실은 바로 이용할 수 있어요.</p><Link href={`/login?next=${encodeURIComponent(`/roadmap?topic=${topic.slug}`)}`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-blue-700 underline underline-offset-4">로그인하고 퀴즈 풀기</Link></div> : locked ? <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><LockKeyhole className="size-4 shrink-0" />먼저 알면 좋은 개념을 완료하면 풀 수 있어요. 그림과 연습 카드는 지금도 자유롭게 볼 수 있어요.</p> : null}
      {levelComplete ? (
        <div className="rounded-lg bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><Check className="size-4" />{level}단계 퀴즈 완료</p>
          <p className="mt-1 text-xs leading-6 text-slate-600">잘했어요! 이번 단계의 핵심을 확인했어요. 잠깐 쉬었다 다음 단계로 이어가도 좋아요.</p>
          {feedback?.passed ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-3.5 text-left text-sm leading-7 text-slate-700">
              <span className="font-semibold text-emerald-700">해설: </span>
              {feedback.explanation}
            </div>
          ) : null}
        </div>
      ) : quiz ? (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-[.16em] text-slate-500">
              문제 {index + 1} · {quiz.question_type === "multiple_choice" ? "객관식" : "단답형"}
            </p>
          </div>
          <h4 className="mb-4 text-base font-semibold leading-7 text-slate-900">{quiz.question}</h4>
          {quiz.question_type === "multiple_choice" ? (
            <div className="space-y-2.5">
              {quiz.choices.map((choice, choiceIndex) => {
                const chosen = selectedChoice === choiceIndex;
                const letter = String.fromCharCode(65 + choiceIndex);
                return (
                  <button
                    key={choiceIndex}
                    type="button"
                    disabled={locked || requiresLogin || loading || Boolean(feedback)}
                    onClick={() => submit(choiceIndex, null)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm leading-6 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                      chosen && feedback?.passed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                        : chosen && feedback && !feedback.passed
                        ? "quiz-wrong border-rose-200 bg-rose-50 text-rose-700 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-slate-900",
                    )}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 font-mono text-[10px] font-bold text-slate-500 group-hover:border-blue-300 group-hover:text-blue-700">
                      {letter}
                    </span>
                    <span className="flex-1">{choice}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); void submit(null, shortAnswer.trim()); }} className="flex min-h-11 gap-2">
              <input value={shortAnswer} onChange={(event) => setShortAnswer(event.target.value)} maxLength={500} disabled={locked || requiresLogin || loading || Boolean(feedback)} placeholder="핵심 용어를 입력해 보세요" aria-label="단답형 답안" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-200 focus:ring-2 focus:ring-blue-500/30" />
              <button type="submit" disabled={locked || requiresLogin || loading || Boolean(feedback) || !shortAnswer.trim()} className="rounded-xl bg-blue-600 px-5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-40">채점</button>
            </form>
          )}
          {loading ? (
            <div role="status" className="mt-4 flex items-center gap-2 text-xs text-blue-700">
              <div className="size-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>답안을 검토하고 있습니다...</span>
            </div>
          ) : null}
          {error ? <p role="alert" className="mt-3 text-xs text-rose-700">{error} {error.includes("로그인") ? <Link href={`/login?next=${encodeURIComponent(`/roadmap?topic=${topic.slug}`)}`} className="underline font-semibold">로그인하기</Link> : null}</p> : null}
          {feedback ? (
            <div className={cn("mt-5 rounded-xl border p-4.5 shadow-sm transition-all", feedback.passed ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")} role="status">
              <p className={cn("flex items-center gap-2 text-xs font-bold", feedback.passed ? "text-emerald-700" : "text-rose-700")}>
                {feedback.passed ? <Check className="size-4" strokeWidth={2.5} /> : <X className="size-4" strokeWidth={2.5} />}
                {feedback.passed ? "맞아요! 이유까지 살펴볼까요?" : "괜찮아요. 이 설명을 보고 다시 해봐요."}
              </p>
              {!feedback.passed ? <p className="mt-2 text-xs font-medium text-slate-800">정답: <span className="text-blue-700">{feedback.correctAnswer}</span></p> : null}
              <p className="mt-2 text-sm leading-7 text-slate-700">{feedback.explanation}</p>
              {feedback.passed ? (
                <button type="button" onClick={nextQuestion} className="mt-4 flex items-center gap-1.5 min-h-11 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50">
                  <span>다음 문제</span>
                  <ArrowRight className="size-3" />
                </button>
              ) : (
                <button type="button" onClick={() => { setFeedback(null); setSelectedChoice(null); }} className="mt-4 flex items-center gap-1.5 min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50">
                  <RotateCcw className="size-3" />
                  <span>다시 시도</span>
                </button>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
