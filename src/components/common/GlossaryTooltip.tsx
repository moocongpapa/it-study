"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Lightbulb, X } from "lucide-react";
import type { GlossaryTerm } from "@/lib/glossary-data";

export function GlossaryTooltip({ term, children }: { term: GlossaryTerm; children: ReactNode }) {
  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <button type="button" aria-label={`${term.term} 용어 설명`} className="inline cursor-help rounded-sm font-medium text-blue-700 underline decoration-blue-300 decoration-dashed underline-offset-4 hover:decoration-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{children}</button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/25" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-3rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-lg focus:outline-none">
        <Dialog.Title className="pr-10 text-lg font-semibold text-slate-900">{term.term}</Dialog.Title>
        <Dialog.Description className="mt-1 text-xs text-slate-500">{term.category} · 용어 풀이</Dialog.Description>
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-7 text-slate-700"><p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-800"><Lightbulb className="size-3.5" />비유로 이해하기</p>{term.analogy}</div>
        <p className="mt-4 text-sm leading-7 text-slate-700">{term.definition}</p>
        <Dialog.Close asChild><button type="button" aria-label="용어 설명 닫기" className="absolute right-2 top-2 grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="size-5" /></button></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
