"use client";

import { PacketHandshakeVisualizer } from "./PacketHandshakeVisualizer";
import { CacheHierarchyVisualizer } from "./CacheHierarchyVisualizer";
import { ProcessVsThreadVisualizer } from "./ProcessVsThreadVisualizer";

interface InteractivePlaygroundProps {
  topicSlug: string;
}

export function InteractivePlayground({ topicSlug }: InteractivePlaygroundProps) {
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
