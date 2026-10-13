"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09111b] p-6">
      <div className="max-w-lg rounded-3xl border border-rose-400/20 bg-[#13202d] p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 size-8 text-rose-300" />
        <h1 className="text-xl font-bold">로드맵을 불러오지 못했습니다</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Supabase 연결과 스키마 적용 상태를 확인해 주세요.</p>
        <p className="mt-2 break-words text-xs text-slate-500">{error.message}</p>
        <Button className="mt-6" onClick={reset}><RotateCcw className="size-4" /> 다시 시도</Button>
      </div>
    </main>
  );
}
