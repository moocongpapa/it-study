"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowUpRight, Check, Clock3, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Difficulty, TopicFlowNode } from "@/types/roadmap";

const difficultyStyle: Record<Difficulty, string> = {
  beginner: "border-emerald-200 bg-emerald-50 text-emerald-700",
  intermediate: "border-blue-200 bg-blue-50 text-blue-700",
  advanced: "border-violet-200 bg-violet-50 text-violet-700",
  expert: "border-amber-200 bg-amber-50 text-amber-700",
};

export function TopicNode({ data }: NodeProps<TopicFlowNode>) {
  const { topic, status, unmetPrerequisites, onOpen } = data;
  const completed = status === "completed";
  const locked = status === "locked";

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <button
        type="button"
        onClick={() => onOpen?.(topic.id)}
        aria-label={`${topic.title}, ${status === "locked" ? `선수 토픽 ${unmetPrerequisites}개 필요` : completed ? "완료" : "학습 가능"}, 학습 내용 열기`}
        className={cn(
          "nodrag group relative flex h-[136px] w-[258px] flex-col overflow-hidden rounded-xl border bg-white p-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
          completed
            ? "border-emerald-300 hover:border-emerald-400"
            : locked
            ? "border-slate-200 bg-slate-50 opacity-70 hover:opacity-100"
            : "border-slate-300 hover:border-slate-900 hover:shadow-sm",
        )}
      >
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 transition-all",
            completed ? "bg-emerald-500" : locked ? "bg-slate-200" : "bg-blue-600"
          )}
        />
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-[10px] font-bold tracking-[.18em] text-slate-500">TOPIC {String(topic.display_order).padStart(2, "0")}</span>
          {completed ? (
            <span className="grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          ) : locked ? (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <LockKeyhole className="size-3.5" />
              {unmetPrerequisites > 0 ? <span>{unmetPrerequisites}</span> : null}
            </span>
          ) : (
            <ArrowUpRight className="size-4 text-blue-700 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          )}
        </span>
        <span className="mt-3 line-clamp-2 min-h-9 text-[14px] font-bold leading-snug text-slate-900">{topic.title}</span>
        <span className="mt-auto flex items-center justify-between gap-2">
          <Badge className={difficultyStyle[topic.difficulty]}>{topic.difficulty}</Badge>
          <span className="flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="size-3" /> {topic.estimated_minutes}분</span>
        </span>
      </button>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
