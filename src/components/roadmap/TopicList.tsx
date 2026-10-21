"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronRight, Clock3, SearchX } from "lucide-react";
import { ArticleReaderSheet } from "@/components/reader/ArticleReaderSheet";
import { DEMO_STORAGE_KEY, useRoadmapFilters } from "@/components/layout/DashboardShell";
import { CURATED_TRACKS } from "@/lib/curated-tracks";
import { MilestoneCelebrationModal } from "@/components/common/MilestoneCelebrationModal";
import { DEMO_LEARNING_KEY, getDemoProgressRows, setBrowserTopicCompletion } from "@/lib/demo-learning";
import { buildTopicLearningStates } from "@/lib/learning-state";
import { warmArticle } from "@/lib/article-resource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Difficulty, Domain, Topic, TopicPrerequisite, UserNodeProgress, TopicProgressResult } from "@/types/roadmap";

const difficulties: Record<Difficulty, { label: string; className: string }> = {
  beginner: { label: "기초", className: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  intermediate: { label: "보통", className: "border-blue-100 bg-blue-50 text-blue-700" },
  advanced: { label: "심화", className: "border-violet-100 bg-violet-50 text-violet-700" },
  expert: { label: "전문", className: "border-amber-100 bg-amber-50 text-amber-700" },
};

function subscribeDemoProgress(callback: () => void) {
  window.addEventListener("demo-progress-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("demo-progress-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getDemoProgressSnapshot() {
  try { return `${localStorage.getItem(DEMO_STORAGE_KEY) ?? "[]"}|${localStorage.getItem(DEMO_LEARNING_KEY) ?? "{}"}`; }
  catch { return ""; }
}

function getServerDemoProgressSnapshot() {
  return "";
}

interface TopicListProps {
  domain: Domain | null;
  allDomains: Domain[];
  allTopics: Topic[];
  allPrerequisites: TopicPrerequisite[];
  initialProgress: UserNodeProgress[];
  isDemo: boolean;
  isAuthenticated: boolean;
}

export function TopicList({ domain, allDomains, allTopics, allPrerequisites, initialProgress, isDemo, isAuthenticated }: TopicListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { query, difficulty, setQuery, setDifficulty, selectedTrack, setSelectedTrack } = useRoadmapFilters();
  const [localProgress, setLocalProgress] = useState<UserNodeProgress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [celebrationTopic, setCelebrationTopic] = useState<Topic | null>(null);
  const usesBrowserStorage = isDemo || !isAuthenticated;
  const demoSnapshot = useSyncExternalStore(subscribeDemoProgress, getDemoProgressSnapshot, getServerDemoProgressSnapshot);

  const progress = useMemo(() => {
    if (usesBrowserStorage) return demoSnapshot ? getDemoProgressRows() : [];
    const byTopic = new Map(initialProgress.map((item) => [item.topic_id, item]));
    localProgress.forEach((item) => byTopic.set(item.topic_id, item));
    return [...byTopic.values()];
  }, [demoSnapshot, initialProgress, usesBrowserStorage, localProgress]);

  const routeTopicId = allTopics.find((topic) => topic.slug === searchParams.get("topic"))?.id ?? null;
  const activeSelectedId = selectedId ?? routeTopicId;
  const currentTrack = CURATED_TRACKS.find((track) => track.id === selectedTrack);
  const groups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ko");
    const track = CURATED_TRACKS.find((item) => item.id === selectedTrack);
    const trackSlugs = track && track.id !== "all" ? new Set(track.topicSlugs) : null;
    if (track && trackSlugs && !domain) {
      const bySlug = new Map(allTopics.map((topic) => [topic.slug, topic]));
      const topics = track.topicSlugs.map((slug) => bySlug.get(slug)).filter((topic): topic is Topic => Boolean(topic))
        .filter((topic) => (!needle || (topic.title + " " + topic.summary + " " + topic.slug).toLocaleLowerCase("ko").includes(needle))
          && (difficulty === "all" || topic.difficulty === difficulty));
      return topics.length ? [{ domain: { id: track.id, title: track.title, slug: "" }, topics }] : [];
    }
    return allDomains.filter((item) => !domain || item.id === domain.id).map((item) => ({
      domain: item,
      topics: allTopics.filter((topic) => topic.domain_id === item.id
        && (!needle || (topic.title + " " + topic.summary + " " + topic.slug).toLocaleLowerCase("ko").includes(needle))
        && (difficulty === "all" || topic.difficulty === difficulty)
        && (!trackSlugs || trackSlugs.has(topic.slug)))
        .sort((a, b) => a.display_order - b.display_order),
    })).filter((group) => group.topics.length > 0);
  }, [allDomains, allTopics, domain, query, difficulty, selectedTrack]);
  const learningStates = useMemo(() => buildTopicLearningStates(allTopics, allPrerequisites, progress), [allTopics, allPrerequisites, progress]);
  const openTopic = useCallback((topicId: string) => { setSaveError(null); setSelectedId(topicId); }, []);
  const selectedTopic = allTopics.find((topic) => topic.id === activeSelectedId) ?? null;
  const selectedStatus = learningStates.get(activeSelectedId ?? "")?.status ?? "available";
  const completedIds = new Set(progress.filter((item) => item.is_completed).map((item) => item.topic_id));
  const totalMinutes = allTopics.reduce((sum, topic) => sum + (topic.estimated_minutes ?? 0), 0);
  const nextTopic = selectedTopic
    ? allPrerequisites.filter((edge) => edge.from_topic_id === selectedTopic.id)
        .map((edge) => allTopics.find((topic) => topic.id === edge.to_topic_id))
        .find((topic) => topic && !completedIds.has(topic.id) && allPrerequisites
          .filter((edge) => edge.to_topic_id === topic.id)
          .every((edge) => edge.from_topic_id === selectedTopic.id || completedIds.has(edge.from_topic_id))) ?? null
    : null;

  async function setTopicCompleted(topic: Topic, isCompleted: boolean) {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (!usesBrowserStorage) {
        const response = await fetch(`/api/progress/${topic.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isCompleted }) });
        const result = await response.json() as { error?: string; progress?: UserNodeProgress };
        if (!response.ok) {
          throw new Error(result.error ?? "완료 상태를 저장하지 못했습니다.");
        }
        const saved = result.progress;
        if (!saved || saved.topic_id !== topic.id || saved.is_completed !== isCompleted) throw new Error("저장 결과를 확인하지 못했습니다. 다시 시도해 주세요.");
        setLocalProgress((current) => [...current.filter((item) => item.topic_id !== topic.id), saved]);
        router.refresh();
      } else {
        setBrowserTopicCompletion(topic.id, isCompleted);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "완료 상태를 저장하지 못했습니다.");
    } finally { setSaving(false); }
  }

  function handleQuizProgress(topic: Topic, result: TopicProgressResult) {
    if (isDemo) return;
    setLocalProgress((current) => [...current.filter((item) => item.topic_id !== topic.id), {
      topic_id: topic.id,
      is_completed: result.isCompleted,
      current_level: result.currentLevel,
      self_assessment: null,
      completed_at: result.isCompleted ? new Date().toISOString() : null,
      next_review_at: result.nextReviewAt,
    }]);
    if (result.isCompleted && !completedIds.has(topic.id)) {
      setCelebrationTopic(topic);
    }
    router.refresh();
  }

  function openNext(topic: Topic) {
    const targetDomain = topic.domain_id;
    if (!domain || targetDomain === domain.id) {
      setSelectedId(topic.id);
      return;
    }
    const domainSlug = allDomains.find((item) => item.id === targetDomain)?.slug;
    router.push(`/roadmap/${domainSlug ?? ""}?topic=${topic.slug}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      {!domain && selectedTrack === "all" ? (
        <section aria-label="학습 안내" className="mb-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl">여기 있는 주제를 모두 익히면,<br className="sm:hidden" /> 비전공자도 전공자 수준의 IT 지식을 갖출 수 있어요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">꼭 필요한 개념만 추려 쉬운 비유부터 실무 판단까지 한 흐름으로 담았어요.</p>
          <ul className="mt-3 grid gap-1.5 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            <li><strong className="font-semibold text-slate-900">비전공자</strong> · 기초부터 순서대로, 전공 지식의 뼈대를 세워요</li>
            <li><strong className="font-semibold text-slate-900">전공자</strong> · 흩어진 지식을 한눈에 정리하고 빈틈을 점검해요</li>
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span><strong className="text-sm font-semibold text-slate-900">{allTopics.length}</strong>개 주제</span>
            <span><strong className="text-sm font-semibold text-slate-900">{allDomains.length}</strong>개 분야</span>
            <span>약 <strong className="text-sm font-semibold text-slate-900">{Math.round(totalMinutes / 60)}</strong>시간</span>
            <span className="text-emerald-700"><strong className="text-sm font-semibold">{completedIds.size}</strong>개 완료</span>
            <Link href="/practice" className="ml-auto inline-flex items-center gap-1 rounded font-medium text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">실무 연습실 <ArrowRight className="size-3.5" /></Link>
          </div>
        </section>
      ) : (
        <p className="mb-4 text-sm leading-6 text-slate-500">
          {currentTrack && currentTrack.id !== "all" ? currentTrack.description : domain?.description}
          {domain ? <span className="ml-1 text-slate-400">· {allTopics.filter((topic) => topic.domain_id === domain.id).length}개 주제</span> : null}
        </p>
      )}
      <div className="space-y-6" aria-label="학습 주제 목록">
        {groups.map((group) => (
          <section key={group.domain.id} aria-label={group.domain.title}>
            {!domain ? (
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <h2 className="min-w-0 text-sm font-semibold text-slate-900">{group.domain.title}</h2>
                {group.domain.slug ? <Link href={"/roadmap/" + group.domain.slug} onClick={() => { setQuery(""); setDifficulty("all"); setSelectedTrack("all"); }} className="inline-flex shrink-0 items-center gap-0.5 rounded text-xs text-slate-500 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={group.domain.title + " 전체 보기"}>전체 보기 <ChevronRight className="size-3" /></Link> : <span className="shrink-0 text-xs text-slate-500">추천 읽기 순서</span>}
              </div>
            ) : null}
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {group.topics.map((topic) => (
                <li key={topic.id}>
                  <button type="button" onPointerEnter={() => warmArticle(topic.slug)} onFocus={() => warmArticle(topic.slug)} onPointerDown={() => warmArticle(topic.slug)} onClick={() => openTopic(topic.id)} aria-label={topic.title + (completedIds.has(topic.id) ? " 학습하기 · 학습 완료" : " 학습하기")} className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5">
                    {!group.domain.slug && currentTrack ? <span aria-label="추천 순서" className="self-start pt-0.5 text-sm font-semibold tabular-nums text-teal-700">{String(currentTrack.topicSlugs.indexOf(topic.slug) + 1).padStart(2, "0")}</span> : null}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2 text-[15px] font-semibold leading-6 text-slate-900 group-hover:text-blue-700">{completedIds.has(topic.id) ? <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-emerald-700"/> : null}<span>{topic.title}</span></span>
                      <span className="mt-0.5 block truncate text-xs leading-5 text-slate-500">{topic.summary}</span>
                      <span className="mt-2 flex items-center gap-2">
                        <Badge className={difficulties[topic.difficulty].className + " px-1.5 py-0 text-[10px] font-medium"}>{difficulties[topic.difficulty].label}</Badge>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="size-3" />{topic.estimated_minutes}분</span>
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-blue-700" aria-hidden="true"><ArrowRight className="size-4" /></span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!groups.length ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
            <SearchX className="mx-auto size-6 text-slate-400" />
            <p role="status" className="mt-3 text-sm font-medium text-slate-700">조건에 맞는 주제가 없습니다.</p>
            <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setDifficulty("all"); setSelectedTrack("all"); }} className="mt-2 text-blue-700">검색·필터 초기화</Button>
          </div>
        ) : null}
      </div>

      <ArticleReaderSheet
        key={selectedTopic?.id ?? "none"}
        open={Boolean(selectedTopic)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            if (searchParams.has("topic")) router.replace(pathname, { scroll: false });
          }
        }}
        topic={selectedTopic}
        status={selectedStatus}
        prerequisites={allPrerequisites.filter((edge) => edge.to_topic_id === selectedTopic?.id).map((edge) => allTopics.find((topic) => topic.id === edge.from_topic_id)).filter((topic): topic is Topic => Boolean(topic))}
        completedIds={completedIds}
        nextTopic={nextTopic}
        onSetCompleted={setTopicCompleted}
        onQuizProgress={handleQuizProgress}
        onNext={openNext}
        saving={saving}
        saveError={saveError}
        isDemo={isDemo}
        usesBrowserStorage={usesBrowserStorage}
      />

      <MilestoneCelebrationModal
        open={Boolean(celebrationTopic)}
        onOpenChange={(open) => { if (!open) setCelebrationTopic(null); }}
        title={(celebrationTopic?.title ?? "주제") + " 학습 완료"}
        subtitle="배운 내용을 떠올려 보고 다음 주제로 이어가세요."
        onNext={nextTopic ? () => { const target = nextTopic; setCelebrationTopic(null); openNext(target); } : undefined}
        nextTitle={nextTopic?.title}
      />
    </div>
  );
}
