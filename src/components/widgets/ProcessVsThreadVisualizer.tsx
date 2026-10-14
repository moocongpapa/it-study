"use client";

import { useState } from "react";
import { Boxes, Sparkles, Users, ShieldAlert } from "lucide-react";

type Mode = "process" | "thread";

export function ProcessVsThreadVisualizer() {
  const [mode, setMode] = useState<Mode>("process");

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-violet-700">
            <Sparkles className="size-3.5" />
            인터랙티브 시뮬레이터
          </span>
          <h4 className="mt-1 text-base font-bold text-slate-900">프로세스 vs 스레드 메모리 공유 모델</h4>
          <p className="text-xs text-slate-500">
            자원을 어떻게 격리하고 공유하는지에 따른 차이를 눈으로 직접 비교해 보세요.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("process")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              mode === "process"
                ? "bg-blue-50 text-blue-700 shadow"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Boxes className="size-3.5" />
            <span>프로세스 (완전 격리)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("thread")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              mode === "thread"
                ? "bg-violet-50 text-violet-700 shadow"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="size-3.5" />
            <span>스레드 (메모리 공유)</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        {mode === "process" ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Process A */}
              <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <span className="text-xs font-bold text-blue-700">프로세스 A (예: 크롬 탭 1)</span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">독립 공간</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  <div className="rounded bg-slate-50 p-2 text-slate-500">Code (프로그램 코드)</div>
                  <div className="rounded bg-slate-50 p-2 text-slate-500">Data (전역 변수)</div>
                  <div className="rounded bg-slate-50 p-2 text-slate-500">Heap (동적 메모리)</div>
                  <div className="rounded bg-blue-50 p-2 text-blue-700 font-bold border border-blue-200">Stack (스택)</div>
                </div>
              </div>

              {/* Process B */}
              <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <span className="text-xs font-bold text-emerald-700">프로세스 B (예: 크롬 탭 2)</span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">독립 공간</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  <div className="rounded bg-slate-50 p-2 text-slate-500">Code (프로그램 코드)</div>
                  <div className="rounded bg-slate-50 p-2 text-slate-500">Data (전역 변수)</div>
                  <div className="rounded bg-slate-50 p-2 text-slate-500">Heap (동적 메모리)</div>
                  <div className="rounded bg-emerald-50 p-2 text-emerald-700 font-bold border border-emerald-200">Stack (스택)</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
              <Boxes className="size-4 shrink-0 text-blue-700" />
              <span>
                <strong>장점:</strong> 프로세스 A가 오류로 강제 종료(크래시)되어도 프로세스 B는 아무런 영향을 받지 않고 안전합니다.
              </span>
            </div>
          </div>
        ) : (
          <div>
            {/* Single Shared Process with Multiple Threads */}
            <div className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-violet-200 pb-2">
                <span className="text-xs font-bold text-violet-700">단일 프로세스 (예: 웹 브라우저 창 1개)</span>
                <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">공유 메모리</span>
              </div>

              {/* Shared Memory Box */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  모든 스레드가 함께 공유하는 영역 (Shared)
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-center">
                  <div className="rounded bg-violet-50 p-2 text-violet-700 border border-violet-200">Code</div>
                  <div className="rounded bg-violet-50 p-2 text-violet-700 border border-violet-200">Data</div>
                  <div className="rounded bg-violet-50 p-2 text-violet-700 border border-violet-200">Heap</div>
                </div>
              </div>

              {/* Independent Thread Stacks */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
                  <span className="text-xs font-bold text-blue-700 block mb-1">스레드 1</span>
                  <div className="rounded bg-blue-50 p-2 font-mono text-[11px] text-blue-700 font-bold border border-blue-200">
                    독립 Stack 1
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                  <span className="text-xs font-bold text-amber-700 block mb-1">스레드 2</span>
                  <div className="rounded bg-amber-50 p-2 font-mono text-[11px] text-amber-700 font-bold border border-amber-200">
                    독립 Stack 2
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              <ShieldAlert className="size-4 shrink-0 text-amber-700" />
              <span>
                <strong>주의:</strong> 통신이 매우 빠르고 자원을 아끼지만, 여러 스레드가 동시에 Data/Heap을 수정하려 하면 <strong>충돌(Race Condition)</strong>이 발생하므로 <strong>동기화(Mutex/Lock)</strong>가 필수적입니다!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
