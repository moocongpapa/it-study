"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowUpRight, Check, Clock3, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Difficulty, TopicFlowNode } from "@/types/roadmap";

const difficultyStyle: Record<Difficulty, string> = {
  beginner: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  intermediate: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  advanced: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  expert: "border-amber-400/25 bg-amber-400/10 text-amber-300",
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
          "nodrag group relative flex h-[136px] w-[258px] flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-[0_14px_38px_#01081377] transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
          completed
            ? "border-emerald-400/50 bg-[#122b27] hover:border-emerald-400/80 hover:shadow-[0_18px_45px_#0009,0_0_30px_#10b98122]"
            : locked
            ? "border-white/8 bg-[#101b26] opacity-65 hover:opacity-90 hover:border-white/15"
            : "border-cyan-400/25 bg-[#122332] hover:-translate-y-0.5 hover:border-cyan-400/70 hover:shadow-[0_18px_45px_#0009,0_0_30px_#22d3ee22]",
        )}
      >
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-1 transition-all",
            completed ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : locked ? "bg-slate-700" : "bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_12px_#22d3ee88]"
          )}
        />
        <span className="flex w-full items-center justify-between gap-2">
          <span className="text-[10px] font-bold tracking-[.18em] text-slate-500">TOPIC {String(topic.display_order).padStart(2, "0")}</span>
          {completed ? (
            <span className="grid size-5 place-items-center rounded-full bg-emerald-400 text-slate-950 shadow-[0_0_10px_#34d39988]">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          ) : locked ? (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <LockKeyhole className="size-3.5" />
              {unmetPrerequisites > 0 ? <span>{unmetPrerequisites}</span> : null}
            </span>
          ) : (
            <ArrowUpRight className="size-4 text-cyan-300 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          )}
        </span>
        <span className="mt-3 line-clamp-2 min-h-9 text-[14px] font-bold leading-snug text-slate-100 transition-colors group-hover:text-white">{topic.title}</span>
        <span className="mt-auto flex items-center justify-between gap-2">
          <Badge className={difficultyStyle[topic.difficulty]}>{topic.difficulty}</Badge>
          <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock3 className="size-3" /> {topic.estimated_minutes}분</span>
        </span>
      </button>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
