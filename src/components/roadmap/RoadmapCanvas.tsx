"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Background, BackgroundVariant, Controls, MiniMap, ReactFlow, ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import dagre from "dagre";
import { ArrowRight, Compass, Layers3, LockKeyhole, MousePointer2, RotateCcw } from "lucide-react";
import { ArticleReaderSheet } from "@/components/reader/ArticleReaderSheet";
import { DEMO_STORAGE_KEY, useRoadmapFilters } from "@/components/layout/DashboardShell";
import { CURATED_TRACKS } from "@/lib/curated-tracks";
import { MilestoneCelebrationModal } from "@/components/common/MilestoneCelebrationModal";
import { completeDemoTopic } from "@/lib/demo-learning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TopicNode } from "@/components/roadmap/TopicNode";
import { buildRoadmapGraph } from "@/lib/graph";
import type {
  Domain, Topic, TopicFlowEdge, TopicFlowNode, TopicPrerequisite, UserNodeProgress,
  TopicProgressResult,
} from "@/types/roadmap";

const nodeTypes = { topic: TopicNode };
const NODE_WIDTH = 258;
const NODE_HEIGHT = 136;

function subscribeDemoProgress(callback: () => void) {
  window.addEventListener("demo-progress-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("demo-progress-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getDemoProgressSnapshot() {
  return localStorage.getItem(DEMO_STORAGE_KEY) ?? "[]";
}

function getServerDemoProgressSnapshot() {
  return "[]";
}

function layoutGraph(nodes: TopicFlowNode[], edges: TopicFlowEdge[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 45, ranksep: 104, marginx: 60, marginy: 55 });

  nodes.forEach((node) => graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  return nodes.map((node) => {
    const location = graph.node(node.id);
    return {
      ...node,
      position: { x: location.x - NODE_WIDTH / 2, y: location.y - NODE_HEIGHT / 2 },
    };
  });
}

function FitViewport({ layoutKey }: { layoutKey: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const frame = requestAnimationFrame(() => fitView({ duration: 350, padding: 0.18, maxZoom: 1.05 }));
    return () => cancelAnimationFrame(frame);
  }, [fitView, layoutKey]);
  return null;
}

interface RoadmapCanvasProps {
  domain: Domain | null;
  allDomains: Domain[];
  initialNodes: TopicFlowNode[];
  initialEdges: TopicFlowEdge[];
  allTopics: Topic[];
  allPrerequisites: TopicPrerequisite[];
  initialProgress: UserNodeProgress[];
  isDemo: boolean;
  isAuthenticated: boolean;
}

export function RoadmapCanvas(props: RoadmapCanvasProps) {
  return <ReactFlowProvider><RoadmapCanvasInner {...props} /></ReactFlowProvider>;
}

function RoadmapCanvasInner({
  domain, allDomains, initialNodes, initialEdges, allTopics, allPrerequisites, initialProgress,
  isDemo, isAuthenticated,
}: RoadmapCanvasProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { query, difficulty, setQuery, setDifficulty, selectedTrack, setSelectedTrack } = useRoadmapFilters();
  const [localProgress, setLocalProgress] = useState<UserNodeProgress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [celebrationTopic, setCelebrationTopic] = useState<Topic | null>(null);
  const demoSnapshot = useSyncExternalStore(subscribeDemoProgress, getDemoProgressSnapshot, getServerDemoProgressSnapshot);

  const progress = useMemo(() => {
    if (isDemo) {
      try {
        const ids = JSON.parse(demoSnapshot) as string[];
        return ids.map((id) => ({ topic_id: id, is_completed: true, current_level: 4, self_assessment: 4, completed_at: null }));
      } catch { return []; }
    }
    const byTopic = new Map(initialProgress.map((item) => [item.topic_id, item]));
    localProgress.forEach((item) => byTopic.set(item.topic_id, item));
    return [...byTopic.values()];
  }, [demoSnapshot, initialProgress, isDemo, localProgress]);

  const routeTopicId = allTopics.find((topic) => topic.slug === searchParams.get("topic"))?.id ?? null;
  const activeSelectedId = selectedId ?? routeTopicId;

  const currentTrack = useMemo(() => CURATED_TRACKS.find((t) => t.id === selectedTrack), [selectedTrack]);

  const visibleTopics = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ko");
    return initialNodes.map((node) => node.data.topic).filter((topic) => {
      const matchesSearch = !needle || `${topic.title} ${topic.summary} ${topic.slug}`.toLocaleLowerCase("ko").includes(needle);
      const matchesDifficulty = difficulty === "all" || topic.difficulty === difficulty;
      const matchesTrack = !currentTrack || currentTrack.id === "all" || currentTrack.topicSlugs.includes(topic.slug);
      return matchesSearch && matchesDifficulty && matchesTrack;
    });
  }, [initialNodes, query, difficulty, currentTrack]);

  const openTopic = useCallback((topicId: string) => { setSaveError(null); setSelectedId(topicId); }, []);

  const { nodes, edges } = useMemo(() => {
    const visibleIds = new Set(visibleTopics.map((topic) => topic.id));
    const doneIds = new Set(progress.filter((item) => item.is_completed).map((item) => item.topic_id));
    const edges = initialEdges
      .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
      .map((edge) => ({ ...edge, animated: doneIds.has(edge.source), style: { stroke: doneIds.has(edge.source) ? "#4ade80" : "#405368", strokeWidth: 2 } }));
    const currentNodes = buildRoadmapGraph(visibleTopics, allPrerequisites, progress).nodes;
    return { nodes: layoutGraph(currentNodes.map((node) => ({ ...node, data: { ...node.data, onOpen: openTopic } })), edges), edges };
  }, [visibleTopics, allPrerequisites, progress, initialEdges, openTopic]);

  const selectedTopic = allTopics.find((topic) => topic.id === activeSelectedId) ?? null;
  const selectedStatus = nodes.find((node) => node.id === activeSelectedId)?.data.status ??
    (selectedTopic ? buildRoadmapGraph([selectedTopic], allPrerequisites, progress).nodes[0]?.data.status : "available");
  const completedIds = new Set(progress.filter((item) => item.is_completed).map((item) => item.topic_id));
  const nextTopic = selectedTopic
    ? allPrerequisites
        .filter((edge) => edge.from_topic_id === selectedTopic.id)
        .map((edge) => allTopics.find((topic) => topic.id === edge.to_topic_id))
        .find((topic) => topic && !completedIds.has(topic.id) && allPrerequisites
          .filter((edge) => edge.to_topic_id === topic.id)
          .every((edge) => edge.from_topic_id === selectedTopic.id || completedIds.has(edge.from_topic_id))) ?? null
    : null;

  async function completeTopic(topic: Topic, selfAssessment: number) {
    if (!isDemo && !isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`${domain ? `/roadmap/${domain.slug}` : "/roadmap"}?topic=${topic.slug}`)}`);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (!isDemo) {
        const response = await fetch(`/api/progress/${topic.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selfAssessment }) });
        if (!response.ok) {
          const result = await response.json() as { error?: string };
          throw new Error(result.error ?? "완료 상태를 저장하지 못했습니다.");
        }
      }
      if (isDemo) {
        completeDemoTopic(topic.id, selfAssessment);
      } else {
        setLocalProgress((current) => [...current.filter((item) => item.topic_id !== topic.id), { topic_id: topic.id, is_completed: true, current_level: 4, self_assessment: selfAssessment, completed_at: new Date().toISOString() }]);
      }
      setCelebrationTopic(topic);
      if (!isDemo) router.refresh();
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
    if (result.isCompleted) {
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

  const layoutKey = nodes.map((node) => node.id).join("|");
  const completedVisible = visibleTopics.filter((topic) => completedIds.has(topic.id)).length;

  return (
    <div className="px-4 py-7 md:px-7 md:py-9">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300"><Compass className="size-3.5" /> {domain ? "DOMAIN ROADMAP" : "THE COMPLETE MAP"}</div>
          <h2 className="text-3xl font-black tracking-[-.04em] text-white md:text-[38px]">{domain?.title ?? "IT 지식의 전체 풍경"}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">{domain?.description ?? "하드웨어에서 AI 인프라까지. 개념이 어떻게 연결되는지 한눈에 살펴보고, 나만의 속도로 한 단계씩 깊이 들어가세요."}</p>
        </div>
        <div className="flex gap-3">
          <Card className="min-w-24 p-3 text-center"><span className="block text-xl font-black text-white">{visibleTopics.length}</span><span className="text-[10px] text-slate-400">보이는 토픽</span></Card>
          <Card className="min-w-24 p-3 text-center"><span className="block text-xl font-black text-emerald-300">{completedVisible}</span><span className="text-[10px] text-slate-400">완료</span></Card>
          <Card className="min-w-24 p-3 text-center"><span className="block text-xl font-black text-cyan-300">{edges.length}</span><span className="text-[10px] text-slate-400">연결</span></Card>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge className="border-emerald-400/25 bg-emerald-400/10 text-emerald-300">● 완료</Badge>
        <Badge className="border-cyan-400/25 bg-cyan-400/10 text-cyan-300">● 학습 가능</Badge>
        <Badge className="border-slate-400/20 bg-slate-400/8 text-slate-400"><LockKeyhole className="mr-1 size-3" /> 선수 필요</Badge>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500"><MousePointer2 className="size-3.5" /> 드래그로 이동 · 스크롤로 확대 · 노드를 눌러 학습</span>
      </div>

      <div className="roadmap-flow app-grid relative h-[680px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1a27] shadow-[inset_0_1px_0_#ffffff0a,0_24px_70px_#02081255]">
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
        {nodes.length ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18, maxZoom: 1.05 }}
            minZoom={0.17}
            maxZoom={1.6}
            nodesDraggable={false}
            nodesConnectable={false}
          >
            <Background variant={BackgroundVariant.Dots} color="#31516b" gap={24} size={1} />
            <Controls showInteractive={false} position="bottom-left" />
            <MiniMap pannable zoomable maskColor="#07111bbb" nodeColor={(node) => node.data.status === "completed" ? "#34d399" : node.data.status === "locked" ? "#536579" : "#67e8f9"} />
            <FitViewport layoutKey={layoutKey} />
          </ReactFlow>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-2xl backdrop-blur-sm">
              <Layers3 className="size-10 text-cyan-400/60" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-200">조건에 맞는 토픽이 없습니다</p>
            <p className="mt-1 text-xs text-slate-400">검색어, 난이도, 또는 상단 큐레이션 트랙을 조정해 보세요.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setQuery(""); setDifficulty("all"); setSelectedTrack("all"); }}
              className="mt-4 gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              필터 및 트랙 초기화
            </Button>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-5 right-5 z-10 hidden items-center gap-2 rounded-lg border border-white/8 bg-[#101e2c]/90 px-3 py-2 text-[10px] text-slate-400 sm:flex"><ArrowRight className="size-3 text-cyan-300" /> 화살표 방향으로 학습이 이어집니다</div>
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
        onComplete={completeTopic}
        onQuizProgress={handleQuizProgress}
        onNext={openNext}
        saving={saving}
        saveError={saveError}
        isDemo={isDemo}
      />

      <MilestoneCelebrationModal
        open={Boolean(celebrationTopic)}
        onOpenChange={(open) => { if (!open) setCelebrationTopic(null); }}
        title={`🎉 '${celebrationTopic?.title ?? ""}' 노드 마스터!`}
        subtitle={`멋집니다! 전체 ${allTopics.length}개 핵심 노드 중 ${progress.filter((p) => p.is_completed).length}개를 달성했습니다.`}
        onNext={nextTopic ? () => {
          const target = nextTopic;
          setCelebrationTopic(null);
          openNext(target);
        } : undefined}
        nextTitle={nextTopic?.title}
      />
    </div>
  );
}
