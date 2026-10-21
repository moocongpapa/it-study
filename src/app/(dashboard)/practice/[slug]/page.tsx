import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { PRACTICE_CASES } from "@/lib/practice-cases";
import { PracticeWorkbench } from "@/components/practice/PracticeWorkbench";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = PRACTICE_CASES.find((item) => item.slug === slug);
  return { title: lesson ? `${lesson.title} | IT Atlas` : "실습을 찾을 수 없어요 | IT Atlas" };
}

export default async function PracticeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = PRACTICE_CASES.find((item) => item.slug === slug);
  if (!lesson) notFound();
  return <article className="mx-auto max-w-4xl px-5 py-5 sm:px-10 sm:py-8">
    <Link href="/practice" className="inline-flex min-h-11 items-center gap-2 rounded text-sm text-slate-600 hover:text-teal-800 focus-visible:ring-2 focus-visible:ring-teal-600"><ArrowLeft className="size-4"/>실무 연습실</Link>
    <header className="mb-7 mt-3"><p className="flex items-center gap-2 text-xs font-medium text-teal-700"><Clock3 className="size-3.5"/>약 {lesson.minutes}분 · 가상 사례 연습</p><h2 className="page-title mt-3">{lesson.title}</h2><p className="mt-3 text-base leading-8 text-slate-600">{lesson.outcome}</p></header>
    <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4 sm:p-5"><h2 className="text-sm font-bold text-teal-900">오늘 맡은 일</h2><p className="mt-2 text-sm leading-7 text-slate-700">{lesson.scenario}</p></div>
    <nav aria-label="실습 흐름" className="mb-8 flex gap-1 border-y border-slate-200 py-1">{lesson.flow.map((step, i) => <a key={step} title={step} href={`#${["practice-sources", "practice-decisions", "practice-workbook"][i]}`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-700 hover:bg-brand-50 sm:text-sm"><span className="text-brand-700">{i + 1}.</span>{["자료 읽기", "판단 연습", "결과물 작성"][i]}</a>)}</nav>
    <section aria-labelledby="practice-sources" className="mb-10"><h2 id="practice-sources" tabIndex={-1} className="mb-4 scroll-mt-6 flex items-center gap-2 text-lg font-bold"><BookOpen className="size-5 text-teal-700"/>판단에 사용할 자료</h2><div className="space-y-3">{lesson.sources.map((source) => <div key={source.id} className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-semibold text-slate-900"><span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{source.id}</span>{source.title}</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{source.body}</p></div>)}</div></section>
    <PracticeWorkbench key={lesson.slug} lesson={lesson}/>
    <section className="mt-8 rounded-xl bg-amber-50 p-5"><h2 className="text-sm font-bold text-amber-950">조건을 바꿔 한 번 더</h2><p className="mt-2 text-sm leading-7 text-amber-950">{lesson.nextChallenge}</p></section>
    <section className="mt-8"><h2 className="mb-3 text-sm font-bold">연결해서 읽으면 좋은 개념</h2><div className="flex flex-wrap gap-2">{lesson.related.map((topic) => <Link key={topic.slug} href={`/roadmap?topic=${topic.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-teal-800 hover:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-600">{topic.title}<ArrowRight className="size-3.5"/></Link>)}</div></section>
    <details className="mt-6 text-xs text-slate-500"><summary className="min-h-11 cursor-pointer py-3">콘텐츠 범위와 참고 자료</summary><p className="leading-6">2026-10-20 작성. 사례와 수치는 이 수업을 위한 창작 자료예요. 참고 문서는 개념 확인용이며 가상 사례의 실제 사건 출처가 아닙니다.</p><ul className="mt-2">{lesson.references.map((ref) => <li key={ref.url}><a href={ref.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center py-2 text-teal-800 underline underline-offset-4">{ref.title}</a></li>)}</ul></details>
  </article>;
}
