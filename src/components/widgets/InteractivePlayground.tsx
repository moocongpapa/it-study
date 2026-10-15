"use client";

import { PacketHandshakeVisualizer } from "./PacketHandshakeVisualizer";
import { CacheHierarchyVisualizer } from "./CacheHierarchyVisualizer";
import { ProcessVsThreadVisualizer } from "./ProcessVsThreadVisualizer";
import { ChevronDown } from "lucide-react";

interface InteractivePlaygroundProps {
  topicSlug: string;
}

export function InteractivePlayground({ topicSlug }: InteractivePlaygroundProps) {
  const playground = getPlayground(topicSlug);
  if (!playground) return null;
  return <details className="group rounded-xl border border-slate-200 bg-white">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">직접 실험해 보기<ChevronDown className="size-4 transition-transform group-open:rotate-180" /></summary>
    <div className="border-t border-slate-100 px-2">{playground}</div>
  </details>;
}

function getPlayground(topicSlug: string) {
  switch (topicSlug) {
    case "tcp-udp-handshake":
    case "osi-encapsulation":
    case "http-versions":
      return <PacketHandshakeVisualizer />;

    case "memory-hierarchy":
    case "von-neumann-cpu":
    case "binary-arithmetic":
      return <CacheHierarchyVisualizer />;

    case "processes-threads":
    case "context-switching":
    case "synchronization-deadlocks":
      return <ProcessVsThreadVisualizer />;

    default:
      return null;
  }
}
