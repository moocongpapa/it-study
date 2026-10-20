"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-xl border border-rose-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 size-8 text-rose-700" />
        <h1 className="text-xl font-bold">학습 정보를 불러오지 못했어요</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">잠시 연결이 원활하지 않습니다. 조금 뒤 다시 시도해 주세요.</p>
        <Button className="mt-6" onClick={retry}><RotateCcw className="size-4" /> 다시 시도</Button>
      </div>
    </main>
  );
}
