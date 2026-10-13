"use client";

import { useState, useRef, type ReactNode } from "react";
import { Lightbulb, Info } from "lucide-react";
import type { GlossaryTerm } from "@/lib/glossary-data";

interface GlossaryTooltipProps {
  term: GlossaryTerm;
  children: ReactNode;
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  return (
    <span
      className="relative inline-block cursor-help font-medium text-cyan-200 underline decoration-cyan-400/50 decoration-dashed underline-offset-4 transition-colors hover:text-cyan-100 hover:decoration-cyan-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setOpen((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((prev) => !prev);
        }
      }}
      aria-label={`${term.term} 용어 설명`}
    >
      {children}

      {open && (
        <span
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-2xl border border-cyan-400/30 bg-[#0d1c2b] p-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-xl animate-in fade-in zoom-in-95 pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <span className="flex items-center gap-1.5 border-b border-white/10 pb-2 text-[11px] font-bold text-cyan-300">
            <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[10px] text-cyan-200 uppercase tracking-wider">
              {term.category}
            </span>
            <span className="text-white text-xs">{term.term}</span>
          </span>

          {/* Analogy for non-engineers */}
          <span className="mt-2.5 block rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-xs text-amber-200 leading-relaxed">
            <span className="flex items-center gap-1 font-bold text-amber-300 mb-1 text-[11px]">
              <Lightbulb className="size-3.5" />
              비전공자 맞춤 비유
            </span>
            {term.analogy}
          </span>

          {/* Technical definition */}
          <span className="mt-2.5 block text-[11px] leading-5 text-slate-300">
            <span className="flex items-center gap-1 font-semibold text-slate-400 mb-0.5 text-[10px]">
              <Info className="size-3" />
              엔지니어링 정의
            </span>
            {term.definition}
          </span>

          {/* Tooltip arrow */}
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#0d1c2b]" />
        </span>
      )}
    </span>
  );
}
