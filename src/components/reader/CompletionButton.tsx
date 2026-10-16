"use client";

import { Check, Circle, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompletionButton({ completed, saving, compact = false, onToggle }: {
  completed: boolean;
  saving: boolean;
  compact?: boolean;
  onToggle: () => void;
}) {
  const Icon = saving ? LoaderCircle : completed ? Check : Circle;
  return <Button type="button" variant={completed ? "secondary" : "default"}
    className={`h-11 shrink-0 gap-1.5 ${compact ? "px-2.5 text-xs" : "w-full"} ${completed ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-teal-700 text-white hover:bg-teal-800"}`}
    onClick={onToggle} disabled={saving} aria-pressed={completed} aria-busy={saving}
    aria-label={completed ? "학습 완료 취소" : "학습 완료 표시"}>
    <Icon className={`size-4 ${saving ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true"/>
    {saving ? "저장 중" : completed ? (compact ? "완료됨" : "학습 완료 · 다시 누르면 취소") : "학습 완료"}
    {completed && !compact ? <RotateCcw className="ml-auto size-3.5" aria-hidden="true"/> : null}
  </Button>;
}
