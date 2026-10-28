"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, BrainCircuit, Check, ChevronRight, ClipboardList, Clock3, Search, SearchX, X } from "lucide-react";
import { ArticleReaderSheet } from "@/components/reader/ArticleReaderSheet";
import { DEMO_STORAGE_KEY, useRoadmapFilters } from "@/components/layout/DashboardShell";
import { CURATED_TRACKS } from "@/lib/curated-tracks";
import { MilestoneCelebrationModal } from "@/components/common/MilestoneCelebrationModal";
import { DEMO_LEARNING_KEY, getDemoProgressRows, setBrowserTopicCompletion } from "@/lib/demo-learning";
import { buildTopicLearningStates } from "@/lib/learning-state";
import { warmArticle } from "@/lib/article-resource";
import { DomainIcon } from "@/components/layout/DomainIcon";
import { cn } from "@/lib/utils";
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
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || document.querySelector('[role="dialog"]')) return;
      if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key === "k")) { event.preventDefault(); searchRef.current?.focus(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function chooseTrack(id: string) {
    setSelectedTrack(id); setQuery(""); setDifficulty("all");
    if (domain) router.push("/roadmap");
  }
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
  const completedByTopic = useMemo(() => new Map(progress.filter((item) => item.is_completed).map((item) => [item.topic_id, item.completion_source ?? "manual"] as const)), [progress]);
  const completedIds = useMemo(() => new Set(completedByTopic.keys()), [completedByTopic]);
  const selectedCompletionSource = selectedTopic ? completedByTopic.get(selectedTopic.id) ?? null : null;

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
      completion_source: result.isCompleted ? "quiz" : null,
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
    <div className="page-container">
      {!domain ? <>
        <section aria-label="학습 안내" className="mb-6 flex items-end justify-between gap-4">
          <div><h2 className="page-title">오늘, 하나만 알아가도 좋아요.</h2><p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">쉬운 비유로 이해하고, 직접 해보며 내 지식으로 만들어요.</p></div>
          <Link href="/practice" className="hidden min-h-11 shrink-0 items-center gap-2 text-sm font-medium text-brand-800 hover:underline sm:inline-flex">실무 연습실<ArrowRight className="size-4"/></Link>
        </section>
        <section aria-label="추천 학습 과정" className="mb-7">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">처음이라면, 이 순서로</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">{[
            { id: "beginner-starter", label: "IT 기초부터", short: "IT 기초", hint: "컴퓨터의 동작 원리부터 차근차근", icon: BookOpen },
            { id: "ai-starter", label: "AI 업무에 활용하기", short: "AI 활용", hint: "AI를 이해하고 안전하게 활용하기", icon: BrainCircuit },
            { id: "project-delivery", label: "프로젝트 이끌기", short: "프로젝트", hint: "목표와 계획부터 출시까지", icon: ClipboardList },
          ].map(({ id, label, short, hint, icon: Icon }) => <button key={id} type="button" aria-label={label} aria-pressed={selectedTrack === id} onClick={() => chooseTrack(selectedTrack === id ? "all" : id)} className={cn("flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors sm:p-4", selectedTrack === id ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-200")}>
            <Icon className="hidden size-5 shrink-0 text-brand-800 min-[360px]:block sm:size-6"/><span className="min-w-0 flex-1"><span className="block whitespace-nowrap text-xs font-semibold leading-5 text-slate-900 sm:text-sm"><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span></span><span className="mt-1 hidden text-xs leading-5 text-slate-500 xl:block">{hint}</span></span><ChevronRight className="hidden size-4 shrink-0 text-brand-700 sm:block"/>
          </button>)}</div>
        </section>
      </> : <div className="mb-6"><div className="mb-2 flex items-center gap-3"><DomainIcon name={domain.icon_name} className="size-6 shrink-0 text-brand-700"/><h2 className="page-title">{domain.title}</h2></div><p className="max-w-2xl text-sm leading-7 text-slate-600">{domain.description}</p></div>}

      <section aria-label="주제 검색과 필터" className="mb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold tracking-tight">{selectedTrack === "all" ? "모든 주제" : currentTrack?.title}</h2>{selectedTrack !== "all" || query || difficulty !== "all" ? <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setDifficulty("all"); setSelectedTrack("all"); }}><X className="size-3.5"/>조건 초기화</Button> : null}</div>
        {selectedTrack !== "all" ? <p className="mb-3 text-sm leading-6 text-slate-600">{currentTrack?.description}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 sm:w-auto sm:flex-1"><Search className="size-4 shrink-0 text-slate-500"/><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="주제 또는 키워드 검색" aria-label="토픽 검색" className="w-full min-w-0 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-500 focus-visible:outline-none sm:text-sm"/>{query ? <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="검색어 지우기" className="-mr-2 grid size-11 shrink-0 place-items-center rounded text-slate-500"><X className="size-4"/></button> : <kbd className="hidden sm:inline-flex">/</kbd>}</label>
          <select aria-label="분야 선택" value={domain?.slug ?? "all"} onChange={(event) => { setSelectedTrack("all"); router.push(event.target.value === "all" ? "/roadmap" : `/roadmap/${event.target.value}`); }} className="field-control w-0 flex-1 sm:w-40 sm:flex-none"><option value="all">분야</option>{allDomains.map((item) => <option key={item.id} value={item.slug}>{item.title}</option>)}</select>
          <select aria-label="학습 과정 필터" value={selectedTrack} onChange={(event) => chooseTrack(event.target.value)} className="field-control w-0 flex-1 sm:w-40 sm:flex-none">{CURATED_TRACKS.map((track) => <option key={track.id} value={track.id}>{track.id === "all" ? "과정" : track.title}</option>)}</select>
          <select aria-label="난이도 필터" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty | "all")} className="field-control w-0 flex-1 sm:w-28 sm:flex-none"><option value="all">난이도</option><option value="beginner">기초</option><option value="intermediate">보통</option><option value="advanced">심화</option><option value="expert">전문</option></select>
        </div>
      </section>
      <div className={cn("grid items-start gap-5", !domain && selectedTrack === "all" && "xl:grid-cols-2")} aria-label="학습 주제 목록">
        {groups.map((group) => <section key={group.domain.id} aria-label={group.domain.title} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {!domain ? <div className="flex min-h-14 items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold leading-6 text-slate-900"><DomainIcon name={allDomains.find((item) => item.id === group.domain.id)?.icon_name} className="size-5 shrink-0 text-brand-700"/>{group.domain.title}</h3>
            {group.domain.slug ? <Link href={"/roadmap/" + group.domain.slug} onClick={() => { setQuery(""); setDifficulty("all"); setSelectedTrack("all"); }} className="-my-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded px-1 text-xs text-slate-600 hover:text-brand-700" aria-label={group.domain.title + " 전체 보기"}><span className="hidden sm:inline">전체 보기</span><ArrowRight className="size-4"/></Link> : <span className="shrink-0 text-xs text-brand-700">읽기 순서</span>}
          </div> : null}
          <ul className="divide-y divide-slate-100">{group.topics.map((topic, index) => <li key={topic.id}>
            <button type="button" onPointerEnter={() => warmArticle(topic.slug)} onFocus={() => warmArticle(topic.slug)} onPointerDown={() => warmArticle(topic.slug)} onClick={() => openTopic(topic.id)} aria-label={topic.title + (completedIds.has(topic.id) ? " 학습하기 · 학습 완료" : " 학습하기")} className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600">
              <span className="mt-1 w-5 shrink-0 text-xs tabular-nums text-slate-500" aria-label={!group.domain.slug ? "추천 순서" : undefined}>{completedIds.has(topic.id) ? <Check aria-hidden="true" className="size-4 text-brand-700"/> : String(!group.domain.slug && currentTrack ? currentTrack.topicSlugs.indexOf(topic.slug) + 1 : index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-3"><span className="block text-[15px] font-semibold leading-6 text-slate-900 group-hover:text-brand-800">{topic.title}</span><span className="mt-0.5 block truncate text-xs leading-5 text-slate-500 sm:col-start-1">{topic.summary}</span><span className="mt-1.5 flex items-center gap-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:flex-col sm:items-end sm:justify-center sm:gap-1"><Badge className={difficulties[topic.difficulty].className + " px-1.5 py-0 text-[11px] font-medium"}>{difficulties[topic.difficulty].label}</Badge><span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="size-3"/>{topic.estimated_minutes}분</span>{completedIds.has(topic.id) ? <span className="text-[11px] text-brand-700">{completedByTopic.get(topic.id) === "quiz" ? "퀴즈 통과" : "학습 완료"}</span> : null}</span></span>
              <ChevronRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-slate-400 group-hover:text-brand-700"/>
            </button>
          </li>)}</ul>
        </section>)}
        {!groups.length ? <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center"><SearchX className="mx-auto size-7 text-slate-500"/><p role="status" className="mt-3 text-base font-semibold text-slate-800">조건에 맞는 주제가 없어요.</p><p className="mt-2 text-sm text-slate-600">검색어를 짧게 바꾸거나 다른 분야를 골라 보세요.</p><Button variant="secondary" onClick={() => { setQuery(""); setDifficulty("all"); setSelectedTrack("all"); }} className="mt-4">검색·필터 초기화</Button></div> : null}
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
        completionSource={selectedCompletionSource}
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
