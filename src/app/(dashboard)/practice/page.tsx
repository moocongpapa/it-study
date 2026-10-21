import Link from "next/link";
import { ArrowRight, Clock3, FileCheck2, FileText, ListChecks, SearchCheck } from "lucide-react";
import { PRACTICE_CASES } from "@/lib/practice-cases";

export const metadata = { title: "실무 연습실 | IT Atlas", description: "AI 결과 검증, FAQ 답변 검토, 프로젝트 범위 결정을 가상 자료와 해설로 연습하고 나만의 결과물을 만드세요." };
const practiceVisuals = [
  { icon: FileText, from: "회의 자료", to: "검토한 회의록", label: "AI 결과 검증", style: "bg-brand-50 text-brand-800" },
  { icon: SearchCheck, from: "근거 문서", to: "신뢰할 답변", label: "근거 확인", style: "bg-blue-50 text-blue-800" },
  { icon: ListChecks, from: "요구사항", to: "출시 범위", label: "프로젝트 판단", style: "bg-amber-50 text-amber-900" },
];

export default function PracticePage() {
  return <div className="page-container">
    <header className="mb-8 max-w-2xl"><h2 className="page-title">읽은 지식을 내 결과물로.</h2><p className="mt-3 text-sm leading-7 text-slate-600">자료를 읽고, 판단하고, 직접 작성해 보세요.<br/>코딩이나 외부 AI 결제 없이 작은 업무부터 연습할 수 있어요.</p></header>
    <div className="space-y-4">{PRACTICE_CASES.map((lesson, i) => {
      const visual = practiceVisuals[i] ?? { icon: FileText, from: "가상 자료", to: "나의 결과물", label: "실무 연습", style: "bg-brand-50 text-brand-800" };
      const Icon = visual.icon;
      return <Link key={lesson.slug} href={`/practice/${lesson.slug}`} className="group grid overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-brand-600 sm:grid-cols-[200px_1fr] xl:grid-cols-[240px_1fr]">
        <div className={`flex flex-wrap items-center gap-3 px-5 py-4 sm:flex-col sm:items-start sm:justify-center sm:gap-4 sm:p-6 ${visual.style}`}><Icon aria-hidden="true" className="size-6 stroke-[1.6] sm:size-8"/><span className="text-sm font-semibold">{visual.label}</span><span className="ml-auto flex items-center gap-2 text-xs sm:ml-0">{visual.from}<ArrowRight aria-hidden="true" className="size-3"/>{visual.to}</span></div>
        <div className="min-w-0 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{lesson.audience}</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5"/>약 {lesson.minutes}분</span></div><h3 className="mt-2 text-lg font-semibold leading-7 tracking-tight text-slate-900 group-hover:text-brand-800">{lesson.title}</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{lesson.outcome}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-800">연습 시작하기<ArrowRight className="size-4 transition-transform group-hover:translate-x-1"/></span></div>
      </Link>;
    })}</div>
    <div className="mt-6 flex items-start gap-3 px-1 text-xs leading-6 text-slate-600"><FileCheck2 className="mt-1 size-4 shrink-0"/><p>가상 자료와 선생님 해설, 작성 양식을 제공해요. 작성한 결과물은 이 브라우저에 저장하거나 파일로 받을 수 있어요. 공인 평가·수료 인증 과정은 아닙니다.</p></div>
  </div>;
}
