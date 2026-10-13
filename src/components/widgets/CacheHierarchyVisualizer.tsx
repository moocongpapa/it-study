"use client";

import { useState } from "react";
import { Gauge, Sparkles, Zap, Loader2 } from "lucide-react";

interface MemoryTier {
  name: string;
  speed: string;
  latencyNs: number;
  analogy: string;
  color: string;
}

const TIERS: MemoryTier[] = [
  { name: "CPU 레지스터 / L1 캐시", speed: "1 나노초 (0.000001ms)", latencyNs: 1, analogy: "내 손에 쥐고 있는 펜", color: "from-cyan-400 to-blue-500" },
  { name: "L2 / L3 캐시", speed: "4 ~ 10 나노초", latencyNs: 8, analogy: "책상 위 필통에서 꺼내기", color: "from-blue-500 to-indigo-500" },
  { name: "메인 메모리 (RAM)", speed: "100 나노초 (100배 지연)", latencyNs: 100, analogy: "거실 책장까지 걸어가서 책 꺼내기", color: "from-amber-400 to-orange-500" },
  { name: "SSD / 저장장치", speed: "100,000 나노초 (10만 배 지연)", latencyNs: 100000, analogy: "도서관에 가서 대출 신청하기", color: "from-rose-500 to-red-600" },
];

export function CacheHierarchyVisualizer() {
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateRequest = (tierIndex: number) => {
    setIsSimulating(true);
    setSelectedTierIndex(tierIndex);
    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
  };

  const currentTier = TIERS[selectedTierIndex];

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-blue-500/25 bg-[#091522] p-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
            <Sparkles className="size-3.5" />
            인터랙티브 시뮬레이터
          </span>
          <h4 className="mt-1 text-base font-bold text-white">메모리 계층 구조 & 캐시 적중 지연 시간</h4>
          <p className="text-xs text-slate-400">
            데이터가 있는 위치에 따라 CPU가 기다려야 하는 시간의 극적인 차이를 확인해 보세요.
          </p>
        </div>
        {isSimulating ? (
          <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-300">
            <Loader2 className="size-3 animate-spin" /> 접근 측정 중...
          </span>
        ) : null}
      </div>

      {/* Tier Selector Buttons */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIERS.map((tier, idx) => {
          const isSelected = selectedTierIndex === idx;
          return (
            <button
              key={tier.name}
              type="button"
              onClick={() => simulateRequest(idx)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  : "border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/8"
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400">계층 {idx + 1}</span>
              <span className="mt-1 text-xs font-bold text-white">{tier.name.split("/")[0]}</span>
              <span className="mt-1 font-mono text-[11px] text-cyan-300">{tier.latencyNs}ns</span>
            </button>
          );
        })}
      </div>

      {/* Latency Comparison Gauge */}
      <div className="mt-6 rounded-2xl border border-white/5 bg-[#050c14] p-5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Gauge className="size-4 text-cyan-400" />
            선택된 저장소: {currentTier.name}
          </span>
          <span className="font-mono text-cyan-300 font-bold">{currentTier.speed}</span>
        </div>

        {/* Visual Latency Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>초고속 (1ns)</span>
            <span>지연 시간 시각화</span>
            <span>극심한 지연 (100,000ns)</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${currentTier.color} transition-all duration-500`}
              style={{
                width: `${Math.max(5, (Math.log10(currentTier.latencyNs) / 5) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Real-world Analogy Card */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/8 p-3.5 text-xs text-amber-200">
          <Zap className="size-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">비전공자 맞춤 일상 비유: </span>
            <span>{currentTier.analogy}에 해당합니다. </span>
            {selectedTierIndex > 1 ? (
              <span className="block mt-1 text-[11px] text-amber-300/80">
                캐시 미스(Cache Miss)가 발생하면 CPU는 수백~수만 배나 느린 장치에 데이터를 가지러 가야 하므로 캐시 최적화가 중요합니다.
              </span>
            ) : (
              <span className="block mt-1 text-[11px] text-emerald-300">
                캐시 적중(Cache Hit) 상태입니다! CPU는 쉬지 않고 즉시 연산을 이어갈 수 있습니다.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
