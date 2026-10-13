"use client";

import { useState } from "react";
import { Boxes, Sparkles, Users, ShieldAlert } from "lucide-react";

type Mode = "process" | "thread";

export function ProcessVsThreadVisualizer() {
  const [mode, setMode] = useState<Mode>("process");

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-violet-500/25 bg-[#091522] p-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-violet-400">
            <Sparkles className="size-3.5" />
            인터랙티브 시뮬레이터
          </span>
          <h4 className="mt-1 text-base font-bold text-white">프로세스 vs 스레드 메모리 공유 모델</h4>
          <p className="text-xs text-slate-400">
            자원을 어떻게 격리하고 공유하는지에 따른 차이를 눈으로 직접 비교해 보세요.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-xl border border-white/10 bg-[#060e18] p-1">
          <button
            type="button"
            onClick={() => setMode("process")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              mode === "process"
                ? "bg-cyan-400/20 text-cyan-200 shadow"
                : "text-slate-400 hover:text-white"
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
                ? "bg-violet-400/20 text-violet-200 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="size-3.5" />
            <span>스레드 (메모리 공유)</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="mt-6 rounded-2xl border border-white/5 bg-[#050c14] p-5">
        {mode === "process" ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Process A */}
              <div className="rounded-2xl border border-cyan-400/30 bg-[#0a1827] p-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-cyan-400/20 pb-2">
                  <span className="text-xs font-bold text-cyan-300">프로세스 A (예: 크롬 탭 1)</span>
                  <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200">독립 공간</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  <div className="rounded bg-white/5 p-2 text-slate-300">Code (프로그램 코드)</div>
                  <div className="rounded bg-white/5 p-2 text-slate-300">Data (전역 변수)</div>
                  <div className="rounded bg-white/5 p-2 text-slate-300">Heap (동적 메모리)</div>
                  <div className="rounded bg-cyan-400/10 p-2 text-cyan-200 font-bold border border-cyan-400/20">Stack (스택)</div>
                </div>
              </div>

              {/* Process B */}
              <div className="rounded-2xl border border-emerald-400/30 bg-[#0a1827] p-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-emerald-400/20 pb-2">
                  <span className="text-xs font-bold text-emerald-300">프로세스 B (예: 크롬 탭 2)</span>
                  <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200">독립 공간</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                  <div className="rounded bg-white/5 p-2 text-slate-300">Code (프로그램 코드)</div>
                  <div className="rounded bg-white/5 p-2 text-slate-300">Data (전역 변수)</div>
                  <div className="rounded bg-white/5 p-2 text-slate-300">Heap (동적 메모리)</div>
                  <div className="rounded bg-emerald-400/10 p-2 text-emerald-200 font-bold border border-emerald-400/20">Stack (스택)</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs text-cyan-200">
              <Boxes className="size-4 shrink-0 text-cyan-400" />
              <span>
                <strong>장점:</strong> 프로세스 A가 오류로 강제 종료(크래시)되어도 프로세스 B는 아무런 영향을 받지 않고 안전합니다.
              </span>
            </div>
          </div>
        ) : (
          <div>
            {/* Single Shared Process with Multiple Threads */}
            <div className="rounded-2xl border border-violet-400/30 bg-[#0e1627] p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-violet-400/20 pb-2">
                <span className="text-xs font-bold text-violet-300">단일 프로세스 (예: 웹 브라우저 창 1개)</span>
                <span className="rounded bg-violet-400/15 px-2 py-0.5 text-[10px] text-violet-200">공유 메모리</span>
              </div>

              {/* Shared Memory Box */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/3 p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  모든 스레드가 함께 공유하는 영역 (Shared)
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-center">
                  <div className="rounded bg-violet-500/15 p-2 text-violet-200 border border-violet-500/20">Code</div>
                  <div className="rounded bg-violet-500/15 p-2 text-violet-200 border border-violet-500/20">Data</div>
                  <div className="rounded bg-violet-500/15 p-2 text-violet-200 border border-violet-500/20">Heap</div>
                </div>
              </div>

              {/* Independent Thread Stacks */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/8 p-3 text-center">
                  <span className="text-xs font-bold text-cyan-300 block mb-1">스레드 1</span>
                  <div className="rounded bg-cyan-400/15 p-2 font-mono text-[11px] text-cyan-200 font-bold border border-cyan-400/30">
                    독립 Stack 1
                  </div>
                </div>
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/8 p-3 text-center">
                  <span className="text-xs font-bold text-amber-300 block mb-1">스레드 2</span>
                  <div className="rounded bg-amber-400/15 p-2 font-mono text-[11px] text-amber-200 font-bold border border-amber-400/30">
                    독립 Stack 2
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">
              <ShieldAlert className="size-4 shrink-0 text-amber-400" />
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
