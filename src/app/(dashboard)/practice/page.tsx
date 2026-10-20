import Link from "next/link";
import { ArrowRight, Clock3, FileCheck2 } from "lucide-react";
import { PRACTICE_CASES } from "@/lib/practice-cases";

export const metadata = { title: "실무 연습실 | IT Atlas", description: "AI 결과 검증, FAQ 답변 검토, 프로젝트 범위 결정을 가상 자료와 해설로 연습하고 나만의 결과물을 만드세요." };

export default function PracticePage() {
  return <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
    <div className="mb-7 max-w-2xl"><p className="text-xs font-semibold text-teal-700">개념을 배웠다면, 작은 업무에 적용해 보세요</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">읽은 지식을 내 결과물로</h2><p className="mt-3 text-sm leading-7 text-slate-600">가상 자료를 읽고 판단한 뒤, 회의록·평가표·결정 메모를 직접 작성해요. 코딩이나 외부 AI 결제 없이 시작할 수 있어요.</p></div>
    <div className="grid gap-4 md:grid-cols-3">{PRACTICE_CASES.map((lesson, i) => <Link key={lesson.slug} href={`/practice/${lesson.slug}`} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
      <div className="mb-5 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-sm font-bold text-teal-800">0{i + 1}</span><span className="flex items-center gap-1 text-xs text-slate-500"><Clock3 className="size-3.5"/>약 {lesson.minutes}분</span></div>
      <p className="text-xs text-slate-500">{lesson.audience}</p><h3 className="mt-2 text-lg font-bold leading-7 text-slate-900">{lesson.title}</h3><p className="mb-6 mt-3 flex-1 text-sm leading-7 text-slate-600">{lesson.outcome}</p><span className="flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-teal-800">연습 시작하기<ArrowRight className="size-4 transition-transform group-hover:translate-x-1"/></span>
    </Link>)}</div>
    <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-100 p-4 text-sm leading-7 text-slate-600"><FileCheck2 className="mt-1 size-5 shrink-0 text-slate-500"/><p>각 실습에 근거 자료, 판단 해설, 작성 양식과 자가 점검 기준이 있어요. 결과물은 현재 브라우저에 저장하거나 파일로 받을 수 있어요. 이 연습은 공인 평가나 수료 인증이 아닙니다.</p></div>
  </div>;
}
