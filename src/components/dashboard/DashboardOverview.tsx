"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenCheck, CheckCircle2, Layers3, RotateCcw } from "lucide-react";
import { reviewTopic, importGuestTopics } from "@/lib/actions/progress";
import { DEMO_COMPLETED_KEY, DEMO_LEARNING_KEY, DEMO_PROGRESS_EVENT, clearDemoCompletedTopics, getDemoProgressRows, readDemoLearning, reviewDemoTopic } from "@/lib/demo-learning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DomainSummary, Topic, UserNodeProgress } from "@/types/roadmap";

function subscribe(callback: () => void) {
  window.addEventListener(DEMO_PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(DEMO_PROGRESS_EVENT, callback); window.removeEventListener("storage", callback); };
}

function snapshot() {
  try { return `${localStorage.getItem(DEMO_LEARNING_KEY) ?? "{}"}|${localStorage.getItem(DEMO_COMPLETED_KEY) ?? "[]"}`; }
  catch { return ""; }
}

function serverSnapshot() { return ""; }

function seoulDate(asOf: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(asOf));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function streakCount(days: string[], asOf: string) {
  const learned = new Set(days);
  const current = new Date(`${seoulDate(asOf)}T12:00:00Z`);
  if (!learned.has(current.toISOString().slice(0, 10))) current.setUTCDate(current.getUTCDate() - 1);
  let count = 0;
  while (learned.has(current.toISOString().slice(0, 10))) {
    count += 1;
    current.setUTCDate(current.getUTCDate() - 1);
  }
  return count;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value));
}

export function DashboardOverview({ domains, topics, progress: initialProgress, learningDays: initialDays, usesBrowserStorage, asOf }: {
  domains: DomainSummary[];
  topics: Topic[];
  progress: UserNodeProgress[];
  learningDays: string[];
  usesBrowserStorage: boolean;
  asOf: string;
}) {
  const router = useRouter();
  const demoSnapshot = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [localProgress, setLocalProgress] = useState<UserNodeProgress[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const demo = useMemo(() => demoSnapshot ? {
    progress: getDemoProgressRows(), learningDays: readDemoLearning().learningDays,
  } : { progress: [], learningDays: [] }, [demoSnapshot]);
  const progress = usesBrowserStorage ? demo.progress : [...new Map([...initialProgress, ...localProgress].map((item) => [item.topic_id, item])).values()];
  const learningDays = usesBrowserStorage ? demo.learningDays : initialDays;
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const completed = progress.filter((item) => item.is_completed);
  const completedIds = new Set(completed.map((item) => item.topic_id));
  const quizMasteredCount = completed.filter((item) => item.completion_source === "quiz").length;
  const manualCompletedCount = completed.length - quizMasteredCount;
  const pendingGuestIds = usesBrowserStorage
    ? []
    : demo.progress
        .filter((item) => item.is_completed && byId.has(item.topic_id) && !completedIds.has(item.topic_id))
        .map((item) => item.topic_id);

  const now = new Date(asOf).getTime();
  const due = completed.filter((item) => item.next_review_at && new Date(item.next_review_at).getTime() <= now)
    .sort((a, b) => (a.next_review_at ?? "").localeCompare(b.next_review_at ?? ""));
  const recent = completed.filter((item) => item.completed_at)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")).slice(0, 5);
  const percentage = topics.length ? Math.round(completed.length / topics.length * 100) : 0;
  const streak = streakCount(learningDays, asOf);

  async function markReviewed(topicId: string, quality: number) {
    setReviewingId(topicId);
    setError(null);
    try {
      if (usesBrowserStorage) {
        if (!reviewDemoTopic(topicId, quality)) throw new Error("완료 기록을 찾지 못했습니다.");
      } else {
        const updated = await reviewTopic(topicId, quality);
        setLocalProgress((current) => [...current.filter((item) => item.topic_id !== topicId), updated]);
        router.refresh();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "복습을 저장하지 못했습니다."); }
    finally { setReviewingId(null); }
  }

  async function handleImportGuest() {
    if (!pendingGuestIds.length || importing) return;
    setImporting(true);
    setError(null);
    setImportNotice(null);
    try {
      const imported = await importGuestTopics(pendingGuestIds);
      setLocalProgress((current) => [...current, ...imported]);
      clearDemoCompletedTopics(pendingGuestIds);
      setImportNotice(`브라우저에 있던 완료 기록 ${imported.length}개를 계정(읽음 완료)으로 옮겼어요.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "브라우저 기록을 옮기지 못했습니다.");
    } finally {
      setImporting(false);
    }
  }

  function topicHref(topic: Topic) {
    const domain = domainById.get(topic.domain_id);
    return `/roadmap/${domain?.slug ?? ""}?topic=${topic.slug}`;
  }

  return <div className="page-container">
    {usesBrowserStorage ? <p className="mb-3 text-xs leading-6 text-slate-600">현재 브라우저의 기록이에요. 로그인 후의 계정 기록과는 별도로 보관돼요.</p> : null}
    {!usesBrowserStorage && pendingGuestIds.length > 0 ? (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-6 text-slate-700">
        <p>로그인 전 이 브라우저에서 완료한 주제 <strong>{pendingGuestIds.length}개</strong>가 남아 있어요. 기존 계정 기록(퀴즈 통과 등)은 그대로 유지하고 미완료 주제만 계정으로 가져올까요?</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={importing} onClick={() => void handleImportGuest()}>{importing ? "가져오는 중..." : "계정으로 가져오기"}</Button>
          <Button size="sm" variant="ghost" disabled={importing} onClick={() => clearDemoCompletedTopics(pendingGuestIds)}>브라우저 기록 비우기</Button>
        </div>
      </div>
    ) : null}
    {importNotice ? <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{importNotice}</p> : null}
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="page-title">조금씩, 내 지식이 쌓이고 있어요.</h2><p className="mt-2 text-sm leading-7 text-slate-600">배운 개념을 다시 떠올리고 다음 주제로 이어가세요.</p></div>
      <Link href="/roadmap" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">주제 둘러보기 <ArrowRight className="size-4" /></Link>
    </div>

    <div className="mb-6 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-4">
      <Card className="flex min-w-0 items-center gap-3 rounded-none border-0 bg-transparent px-3 sm:px-5"><div><p className="text-xl font-semibold tabular-nums text-slate-900">{completed.length}<span className="ml-1 text-sm font-medium text-slate-500">/ {topics.length}</span></p><p className="text-[11px] leading-5 text-slate-500">완료한 주제 · {percentage}%{completed.length > 0 ? ` (퀴즈 ${quizMasteredCount} · 직접 ${manualCompletedCount})` : ""}</p></div></Card>
      <Card className="flex min-w-0 items-center gap-3 rounded-none border-0 bg-transparent px-3 sm:px-5"><div><p className="text-xl font-semibold tabular-nums text-slate-900">{due.length}</p><p className="text-[11px] leading-5 text-slate-500">오늘 복습</p></div></Card>
      <Card className="flex min-w-0 items-center gap-3 rounded-none border-0 bg-transparent px-3 sm:px-5"><div><p className="text-xl font-semibold tabular-nums text-slate-900">{streak}<span className="ml-1 text-sm font-medium text-slate-500">일</span></p><p className="text-[11px] leading-5 text-slate-500">연속 학습</p></div></Card>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <section className="space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2"><RotateCcw className="size-4 text-brand-700" /><h3 className="text-sm font-bold text-slate-900">오늘 복습할 주제</h3></div>
          {error ? <p role="alert" className="mb-4 text-xs text-rose-700">{error}</p> : null}
          {due.length ? <div className="space-y-3">{due.map((item) => {
            const topic = byId.get(item.topic_id);
            if (!topic) return null;
            return <div key={item.topic_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><Link href={topicHref(topic)} className="text-sm font-bold text-slate-900 hover:text-brand-700">{topic.title}</Link><p className="mt-1 text-[11px] text-slate-500">{domainById.get(topic.domain_id)?.title} · 복습 예정 {item.next_review_at ? dateLabel(item.next_review_at) : "오늘"}</p></div><Link href={topicHref(topic)} className="text-[11px] text-brand-700 hover:underline">아티클 다시 읽기 →</Link></div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                <span className="mr-1 text-[11px] font-medium text-slate-500">자가 복습 평가:</span>
                {[
                  { quality: 2, label: "다시 보기", color: "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" },
                  { quality: 3, label: "보통", color: "hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700" },
                  { quality: 5, label: "완벽히 이해", color: "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" },
                ].map(({ quality, label, color }) => (
                  <button
                    key={quality}
                    type="button"
                    disabled={reviewingId === item.topic_id}
                    onClick={() => void markReviewed(item.topic_id, quality)}
                    className={`min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 transition-all active:scale-95 disabled:opacity-50 ${color}`}
                  >
                    {reviewingId === item.topic_id ? "저장 중..." : label}
                  </button>
                ))}
              </div>
            </div>;
          })}</div> : <div className="rounded-xl bg-brand-50 p-6"><BookOpenCheck className="size-6 text-brand-700" /><p className="mt-3 text-base font-semibold text-slate-800">{completed.length ? "오늘의 복습은 여유로워요." : "첫 주제를 함께 시작해 볼까요?"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{completed.length ? "배운 내용을 실무 연습에 적용해 보세요." : "글을 읽고 학습 완료를 누르면 복습할 때를 알려드려요."}</p><Link href={completed.length ? "/practice" : "/roadmap"} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-800">{completed.length ? "실무 연습실로" : "첫 주제 고르기"}<ArrowRight className="size-4"/></Link></div>}
        </Card>

        <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><Layers3 className="size-4 text-brand-700" /><h3 className="text-sm font-bold text-slate-900">분야별 학습 현황</h3></div><div className="grid gap-x-6 sm:grid-cols-2">{domains.map((domain) => {
          const done = topics.filter((topic) => topic.domain_id === domain.id && completedIds.has(topic.id)).length;
          const percent = domain.topicCount ? Math.round(done / domain.topicCount * 100) : 0;
          return <Link key={domain.id} href={`/roadmap/${domain.slug}`} className="border-b border-slate-100 px-1 py-4 transition-colors hover:bg-brand-50"><div className="mb-3 flex items-start justify-between gap-2"><span className="text-xs font-bold leading-5 text-slate-800">{domain.title}</span><span className="text-[11px] tabular-nums text-brand-700">{done}/{domain.topicCount}</span></div><Progress value={percent} label={`${domain.title} 진행률`} /></Link>;
        })}</div></Card>
      </section>

      <section><Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><BookOpenCheck className="size-4 text-emerald-700" /><h3 className="text-sm font-bold text-slate-900">최근 완료한 토픽</h3></div>{recent.length ? <div className="space-y-1">{recent.map((item) => {
        const topic = byId.get(item.topic_id);
        const isQuizMastery = item.completion_source === "quiz";
        return topic ? <Link key={item.topic_id} href={topicHref(topic)} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-100"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{topic.title}</span><span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500"><span>{item.completed_at ? dateLabel(item.completed_at) : ""}</span><span>·</span><Badge className="border-slate-200 bg-white px-1.5 py-0 text-[10px] font-medium normal-case tracking-normal text-slate-600">{isQuizMastery ? "퀴즈 통과" : "직접 완료"}</Badge></span></span><ArrowRight className="size-3.5 text-slate-500" /></Link> : null;
      })}</div> : <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs leading-6 text-slate-500">첫 번째 개념을 완료하면 여기에 기록됩니다.</p>}</Card></section>
    </div>
  </div>;
}
