"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-xl border border-rose-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 size-8 text-rose-700" />
        <h1 className="text-xl font-bold">로드맵을 불러오지 못했습니다</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Supabase 연결과 스키마 적용 상태를 확인해 주세요.</p>
        <p className="mt-2 break-words text-xs text-slate-500">{error.message}</p>
        <Button className="mt-6" onClick={reset}><RotateCcw className="size-4" /> 다시 시도</Button>
      </div>
    </main>
  );
}
