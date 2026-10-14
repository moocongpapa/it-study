"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Play, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type HandshakeStep = 0 | 1 | 2 | 3;

export function PacketHandshakeVisualizer() {
  const [step, setStep] = useState<HandshakeStep>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const startHandshake = () => {
    setIsPlaying(true);
    setStep(1);

    setTimeout(() => {
      setStep(2);
    }, 1200);

    setTimeout(() => {
      setStep(3);
      setIsPlaying(false);
    }, 2400);
  };

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
            <Sparkles className="size-3.5" />
            인터랙티브 시뮬레이터
          </span>
          <h4 className="mt-1 text-base font-bold text-slate-900">TCP 3-Way Handshake 연결 과정</h4>
          <p className="text-xs text-slate-500">
            신뢰성 있는 통신을 위해 클라이언트와 서버가 서로를 확인하는 인사 단계입니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {step === 3 ? (
            <Button size="sm" variant="secondary" onClick={reset} className="gap-1.5 text-xs">
              <RotateCcw className="size-3.5" />
              처음부터 다시 보기
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={startHandshake}
              disabled={isPlaying}
              className="gap-1.5 bg-slate-900 text-xs font-bold text-white "
            >
              <Play className="size-3.5" />
              {isPlaying ? "연결 진행 중..." : "핸드셰이크 시작"}
            </Button>
          )}
        </div>
      </div>

      {/* Network Animation Stage */}
      <div className="relative mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center justify-between">
          {/* Client Node */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative grid size-16 place-items-center rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
              <span className="text-xl">💻</span>
              {step === 3 && (
                <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-blue-700">클라이언트 (웹 브라우저)</span>
            <span className="rounded bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500">
              {step === 0 ? "CLOSED" : step === 1 ? "SYN_SENT" : "ESTABLISHED"}
            </span>
          </div>

          {/* Wire & Packet Track */}
          <div className="relative mx-4 flex-1">
            <div className="h-1.5 w-full rounded-full bg-slate-100" />

            {/* Flying Packet */}
            {step === 1 && (
              <div
                className="absolute -top-3.5 left-0 flex items-center gap-1 rounded-full border border-blue-200 bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm transition-all duration-1000 ease-in-out"
                style={{ transform: "translateX(calc(100% * 2.5))" }}
              >
                <span>SYN (내 말 들리니?)</span>
                <ArrowRight className="size-3" />
              </div>
            )}

            {step === 2 && (
              <div
                className="absolute -top-3.5 right-0 flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm transition-all duration-1000 ease-in-out"
                style={{ transform: "translateX(calc(-100% * 2.5))" }}
              >
                <span>SYN+ACK (잘 들려! 내 말도 들려?)</span>
              </div>
            )}

            {step === 3 && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <CheckCircle2 className="size-3.5" />
                <span>ACK (응 들려! 연결 완료!)</span>
              </div>
            )}
          </div>

          {/* Server Node */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative grid size-16 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm">
              <span className="text-xl">🖥️</span>
              {step === 3 && (
                <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-emerald-700">서버 (웹 서버)</span>
            <span className="rounded bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500">
              {step === 0 ? "LISTEN" : step === 1 ? "SYN_RCVD" : "ESTABLISHED"}
            </span>
          </div>
        </div>

        {/* Step-by-step description banner */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5">
          {step === 0 && (
            <p className="text-slate-500">
              상단의 <strong className="text-blue-700">[핸드셰이크 시작]</strong> 버튼을 누르면 패킷이 이동하며 연결이 수립되는 3단계를 볼 수 있습니다.
            </p>
          )}
          {step === 1 && (
            <p className="text-blue-700">
              <strong className="text-slate-900">1단계 (SYN):</strong> 클라이언트가 서버에 접속 요청 패킷을 보내며 &quot;내 말 들려? 내 시퀀스 번호는 100이야&quot;라고 알립니다.
            </p>
          )}
          {step === 2 && (
            <p className="text-emerald-700">
              <strong className="text-slate-900">2단계 (SYN-ACK):</strong> 서버가 수신 확인(ACK=101)과 함께 자신의 시퀀스 번호(Seq=300)를 실어 &quot;잘 들려! 내 말도 들려?&quot;라고 답장합니다.
            </p>
          )}
          {step === 3 && (
            <p className="text-emerald-700 font-semibold">
              <strong className="text-slate-900">3단계 (ACK - 연결 완료):</strong> 클라이언트가 마지막 확인(ACK=301)을 보내며 연결이 수립(ESTABLISHED)되었습니다. 이제 안전하게 웹페이지 데이터를 주고받을 수 있습니다!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
