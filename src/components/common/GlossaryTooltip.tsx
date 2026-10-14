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
      className="relative inline-block cursor-help font-medium text-blue-700 underline decoration-cyan-400/50 decoration-dashed underline-offset-4 transition-colors hover:text-blue-700 hover:decoration-cyan-300"
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
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border border-blue-200 bg-white p-4 text-left shadow-sm  animate-in fade-in zoom-in-95 pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <span className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-[11px] font-bold text-blue-700">
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 uppercase tracking-wider">
              {term.category}
            </span>
            <span className="text-slate-900 text-xs">{term.term}</span>
          </span>

          {/* Analogy for non-engineers */}
          <span className="mt-2.5 block rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 leading-relaxed">
            <span className="flex items-center gap-1 font-bold text-amber-700 mb-1 text-[11px]">
              <Lightbulb className="size-3.5" />
              비전공자 맞춤 비유
            </span>
            {term.analogy}
          </span>

          {/* Technical definition */}
          <span className="mt-2.5 block text-[11px] leading-5 text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-500 mb-0.5 text-[10px]">
              <Info className="size-3" />
              엔지니어링 정의
            </span>
            {term.definition}
          </span>

          {/* Tooltip arrow */}
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-white" />
        </span>
      )}
    </span>
  );
}
