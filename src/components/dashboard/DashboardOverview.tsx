"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenCheck, CalendarClock, CheckCircle2, Flame, Layers3, RotateCcw } from "lucide-react";
import { reviewTopic } from "@/lib/actions/progress";
import { DEMO_COMPLETED_KEY, DEMO_LEARNING_KEY, DEMO_PROGRESS_EVENT, getDemoProgressRows, readDemoLearning, reviewDemoTopic } from "@/lib/demo-learning";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DomainSummary, Topic, UserNodeProgress } from "@/types/roadmap";

function subscribe(callback: () => void) {
  window.addEventListener(DEMO_PROGRESS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(DEMO_PROGRESS_EVENT, callback); window.removeEventListener("storage", callback); };
}

function snapshot() {
  return `${localStorage.getItem(DEMO_LEARNING_KEY) ?? "{}"}|${localStorage.getItem(DEMO_COMPLETED_KEY) ?? "[]"}`;
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

export function DashboardOverview({ domains, topics, progress: initialProgress, learningDays: initialDays, isDemo, asOf }: {
  domains: DomainSummary[];
  topics: Topic[];
  progress: UserNodeProgress[];
  learningDays: string[];
  isDemo: boolean;
  asOf: string;
}) {
  const router = useRouter();
  const demoSnapshot = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [localProgress, setLocalProgress] = useState<UserNodeProgress[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const demo = useMemo(() => demoSnapshot ? {
    progress: getDemoProgressRows(), learningDays: readDemoLearning().learningDays,
  } : { progress: [], learningDays: [] }, [demoSnapshot]);
  const progress = isDemo ? demo.progress : [...new Map([...initialProgress, ...localProgress].map((item) => [item.topic_id, item])).values()];
  const learningDays = isDemo ? demo.learningDays : initialDays;
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const completed = progress.filter((item) => item.is_completed);
  const completedIds = new Set(completed.map((item) => item.topic_id));
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
      if (isDemo) {
        if (!reviewDemoTopic(topicId, quality)) throw new Error("완료 기록을 찾지 못했습니다.");
      } else {
        const updated = await reviewTopic(topicId, quality);
        setLocalProgress((current) => [...current.filter((item) => item.topic_id !== topicId), updated]);
        router.refresh();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "복습을 저장하지 못했습니다."); }
    finally { setReviewingId(null); }
  }

  function topicHref(topic: Topic) {
    const domain = domainById.get(topic.domain_id);
    return `/roadmap/${domain?.slug ?? ""}?topic=${topic.slug}`;
  }

  return <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-7">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">오늘의 학습 흐름</h2><p className="mt-1 text-sm leading-7 text-slate-500">이해한 개념을 다시 꺼내 보고, 다음 연결을 준비하세요.</p></div>
      <Link href="/roadmap" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">주제 둘러보기 <ArrowRight className="size-4" /></Link>
    </div>

    <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
      <Card className="flex min-w-0 items-center gap-3 p-3 sm:p-5"><span className="hidden size-11 shrink-0 place-items-center sm:grid rounded-xl bg-emerald-50 text-emerald-700"><BookOpenCheck className="size-5" /></span><div><p className="text-2xl font-bold text-slate-900">{completed.length}<span className="ml-1 text-sm font-medium text-slate-500">/ {topics.length}</span></p><p className="text-[11px] leading-5 text-slate-500">완료한 주제 · {percentage}%</p></div></Card>
      <Card className="flex min-w-0 items-center gap-3 p-3 sm:p-5"><span className="hidden size-11 shrink-0 place-items-center sm:grid rounded-xl bg-blue-50 text-blue-700"><CalendarClock className="size-5" /></span><div><p className="text-2xl font-bold text-slate-900">{due.length}</p><p className="text-[11px] leading-5 text-slate-500">오늘 복습</p></div></Card>
      <Card className="flex min-w-0 items-center gap-3 p-3 sm:p-5"><span className="hidden size-11 shrink-0 place-items-center sm:grid rounded-xl bg-amber-50 text-amber-700"><Flame className="size-5" /></span><div><p className="text-2xl font-bold text-slate-900">{streak}<span className="ml-1 text-sm font-medium text-slate-500">일</span></p><p className="text-[11px] leading-5 text-slate-500">연속 학습</p></div></Card>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <section className="space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2"><RotateCcw className="size-4 text-blue-700" /><h3 className="text-sm font-bold text-slate-900">오늘 복습할 주제</h3><span className="ml-auto text-[11px] text-slate-500">1 → 3 → 7 → 14 → 30일</span></div>
          {error ? <p role="alert" className="mb-4 text-xs text-rose-700">{error}</p> : null}
          {due.length ? <div className="space-y-3">{due.map((item) => {
            const topic = byId.get(item.topic_id);
            if (!topic) return null;
            return <div key={item.topic_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><Link href={topicHref(topic)} className="text-sm font-bold text-slate-900 hover:text-blue-700">{topic.title}</Link><p className="mt-1 text-[11px] text-slate-500">{domainById.get(topic.domain_id)?.title} · 복습 예정 {item.next_review_at ? dateLabel(item.next_review_at) : "오늘"}</p></div><Link href={topicHref(topic)} className="text-[11px] text-blue-700 hover:underline">아티클 다시 읽기 →</Link></div>
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
          })}</div> : <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-7 text-center"><CheckCircle2 className="mx-auto size-7 text-emerald-700" /><p className="mt-3 text-sm font-bold text-slate-800">오늘 예정된 복습이 없습니다</p><p className="mt-1 text-xs text-slate-500">새 토픽을 학습하거나 내일 다시 확인하세요.</p></div>}
        </Card>

        <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><Layers3 className="size-4 text-blue-700" /><h3 className="text-sm font-bold text-slate-900">분야별 학습 현황</h3></div><div className="grid gap-3 sm:grid-cols-2">{domains.map((domain) => {
          const done = topics.filter((topic) => topic.domain_id === domain.id && completedIds.has(topic.id)).length;
          const percent = domain.topicCount ? Math.round(done / domain.topicCount * 100) : 0;
          return <Link key={domain.id} href={`/roadmap/${domain.slug}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"><div className="mb-3 flex items-start justify-between gap-2"><span className="text-xs font-bold leading-5 text-slate-800">{domain.title}</span><span className="text-[11px] tabular-nums text-blue-700">{done}/{domain.topicCount}</span></div><Progress value={percent} /><span className="mt-2 block text-right text-[10px] text-slate-500">{percent}%</span></Link>;
        })}</div></Card>
      </section>

      <section><Card className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><BookOpenCheck className="size-4 text-emerald-700" /><h3 className="text-sm font-bold text-slate-900">최근 완료한 토픽</h3></div>{recent.length ? <div className="space-y-1">{recent.map((item) => {
        const topic = byId.get(item.topic_id);
        return topic ? <Link key={item.topic_id} href={topicHref(topic)} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-100"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{topic.title}</span><span className="mt-0.5 block text-[10px] text-slate-500">{item.completed_at ? dateLabel(item.completed_at) : ""}</span></span><ArrowRight className="size-3.5 text-slate-500" /></Link> : null;
      })}</div> : <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs leading-6 text-slate-500">첫 번째 개념을 완료하면 여기에 기록됩니다.</p>}</Card></section>
    </div>
  </div>;
}
