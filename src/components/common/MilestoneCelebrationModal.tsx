"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Sparkles, Trophy, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MilestoneCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  onNext?: () => void;
  nextTitle?: string;
}

export function MilestoneCelebrationModal({
  open,
  onOpenChange,
  title,
  subtitle,
  onNext,
  nextTitle,
}: MilestoneCelebrationModalProps) {
  useEffect(() => {
    if (open) {
      // Fire confetti bursts!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b"],
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#2563eb", "#10b981"],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#8b5cf6", "#f59e0b"],
          });
        }, 250);
      } catch {
        // confetti fallback
      }
    }
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/30  animate-in fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-blue-200 bg-white p-6 shadow-sm focus:outline-none animate-in zoom-in-95">
          {/* Header Close */}
          <div className="flex justify-end">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="닫기"
              >
                <X className="size-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Celebration Body */}
          <div className="text-center">
            {/* Glowing Trophy Badge */}
            <div className="mx-auto mb-4 grid size-20 place-items-center rounded-xl bg-slate-50 p-4 shadow-sm border border-amber-200 animate-bounce">
              <Trophy className="size-10 text-amber-700" strokeWidth={2.2} />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <Sparkles className="size-3.5" />
              지식 노드 완전 마스터!
            </span>

            <DialogPrimitive.Title className="mt-3 text-2xl font-bold text-slate-900">
              {title}
            </DialogPrimitive.Title>

            <DialogPrimitive.Description className="mt-2 text-xs leading-6 text-slate-500">
              {subtitle}
            </DialogPrimitive.Description>

            {/* Achievement Perks */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-900/30 p-4 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCheck className="size-4" />
                <span>4단계 심도 아티클 완독 완료</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCheck className="size-4" />
                <span>모든 레벨 인출 퀴즈 100% 통과</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700">
                <CheckCheck className="size-4" />
                <span>에빙하우스 망각곡선 간격 복습 큐 등록</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2">
              {onNext && nextTitle ? (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onNext();
                  }}
                  className="w-full gap-2 bg-slate-900 text-sm font-bold text-white  shadow-sm"
                >
                  <span>다음 추천: {nextTitle}</span>
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="w-full text-xs"
              >
                지도로 돌아가기
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
