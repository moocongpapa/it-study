"use client";

import { useId, useState } from "react";
import { ArrowRight, Check, CircleHelp, Eye, GraduationCap, Sparkles } from "lucide-react";
import type { Lesson, LessonReference } from "@/lib/lesson-schema";
import { AttentionLab, KanbanLab, NetworkLab, ScheduleLab } from "./AppliedLabs";
import { BitsLab, DistributionLab, GateLab, GrowthLab, QueueLab, ThresholdLab, VectorLab } from "./SpecialLabs";

const control = "lesson-control";
function Teacher({children}:{children:React.ReactNode}) {
  return <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-white/80 p-3 text-sm leading-7 text-slate-700"><span aria-hidden="true" className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-900"><GraduationCap className="size-4"/></span><div>{children}</div></div>;
}
function Sequence({lesson}:{lesson:Lesson}) {
  return <ol aria-label="작동 순서" className="space-y-4">
    {lesson.steps.map((step, index) => <li key={step.label} className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-teal-100 text-xs font-semibold text-teal-900">{index + 1}</span>
      <div className="min-w-0"><h4 className="text-sm font-semibold text-slate-900">{step.label}</h4><p className="mt-1 text-sm leading-7 text-slate-700">{step.body}</p></div>
    </li>)}
  </ol>;
}
function ComparisonDrawing({slug,selected}:{slug:string;selected:number}) {
  if(slug==="processes-threads")return <svg viewBox="0 0 320 145" role="img" aria-label={selected===0?"분리된 두 주소 공간 안의 작업자":"하나의 주소 공간과 공유 자료 안에 있는 두 스레드"} className="my-3 w-full rounded-xl bg-white">{selected===0?[15,170].map((x,i)=><g key={x}><rect x={x} y="15" width="135" height="112" rx="12" fill="#e0f2fe" stroke="#7dd3fc"/><text x={x+67} y="40" textAnchor="middle" fontSize="12" fill="#075985">주소 공간 {i+1}</text><circle cx={x+67} cy="68" r="13" fill="#0f766e"/><rect x={x+29} y="92" width="77" height="19" rx="5" fill="#bae6fd"/><text x={x+67} y="105" textAnchor="middle" fontSize="10" fill="#075985">각자의 자료</text></g>):<><rect x="15" y="15" width="290" height="112" rx="12" fill="#e0f2fe" stroke="#7dd3fc"/><text x="160" y="38" textAnchor="middle" fontSize="12" fill="#075985">하나의 프로세스 주소 공간</text><circle cx="105" cy="65" r="13" fill="#0f766e"/><circle cx="215" cy="65" r="13" fill="#0f766e"/><rect x="60" y="90" width="200" height="22" rx="5" fill="#bae6fd"/><text x="160" y="105" textAnchor="middle" fontSize="11" fill="#075985">함께 쓰는 힙 · 각자의 스택</text></>}</svg>;
  if(slug==="vm-vs-containers")return <svg viewBox="0 0 320 150" role="img" aria-label={selected===0?"각 VM에 게스트 운영체제가 있는 구조":"두 앱이 호스트 커널을 공유하는 컨테이너 구조"} className="my-3 w-full rounded-xl bg-white">{[20,170].map((x,i)=><g key={x}><rect x={x} y="15" width="130" height="40" rx="7" fill="#ccfbf1"/><text x={x+65} y="40" textAnchor="middle" fontSize="12" fill="#115e59">앱 {i+1}</text>{selected===0?<><rect x={x} y="62" width="130" height="32" rx="7" fill="#dbeafe"/><text x={x+65} y="83" textAnchor="middle" fontSize="11" fill="#1e40af">게스트 운영체제</text></>:null}</g>)}<rect x="20" y={selected===0?103:67} width="280" height="32" rx="7" fill="#e2e8f0"/><text x="160" y={selected===0?124:88} textAnchor="middle" fontSize="11" fill="#334155">{selected===0?"가상화 기반·하드웨어":"공유하는 호스트 커널"}</text></svg>;
  if(slug==="arrays-linked-lists")return <svg viewBox="0 0 320 105" role="img" aria-label={selected===0?"연속한 칸의 배열과 번호":"다음 원소로 연결된 리스트"} className="my-3 w-full rounded-xl bg-white">{[0,1,2,3].map((v,i)=><g key={v}><rect x={20+i*76} y="30" width={selected===0?68:46} height="40" rx="6" fill="#ccfbf1" stroke="#5eead4"/><text x={selected===0?54+i*76:43+i*76} y="55" textAnchor="middle" fontSize="15" fill="#115e59">{String.fromCharCode(65+v)}</text>{selected===0?<text x={54+i*76} y="89" textAnchor="middle" fontSize="11" fill="#64748b">번호 {i}</text>:i<3?<text x={74+i*76} y="55" fontSize="19" fill="#64748b">→</text>:null}</g>)}</svg>;
  if(slug==="graph-search"){
    const nodes=[[160,22],[80,73],[245,73],[35,126],[125,126]],order=selected===0?[0,1,3,4,2]:[0,1,2,3,4];
    return <svg viewBox="0 0 320 154" role="img" aria-label={`${selected===0?"DFS":"BFS"} 방문 순서 ${order.map(i=>String.fromCharCode(65+i)).join(", ")}`} className="my-3 w-full rounded-xl bg-white">{[[0,1],[0,2],[1,3],[1,4]].map(([a,b])=><path key={`${a}-${b}`} d={`M${nodes[a][0]} ${nodes[a][1]}L${nodes[b][0]} ${nodes[b][1]}`} stroke="#cbd5e1" strokeWidth="2"/>)}{nodes.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="16" fill="#ccfbf1" stroke="#0f766e"/><text x={x} y={y+4} textAnchor="middle" fontSize="12" fill="#115e59">{String.fromCharCode(65+i)}</text><text x={x+19} y={y-7} fontSize="11" fill="#b45309">{order.indexOf(i)+1}번째</text></g>)}</svg>;
  }
  if(slug==="memory-hierarchy")return <svg viewBox="0 0 320 140" role="img" aria-label="가까운 캐시, 큰 메모리, 저장장치의 개념 계층" className="my-3 w-full rounded-xl bg-white">{[{x:95,w:130,label:"작은 캐시"},{x:60,w:200,label:"더 큰 메모리"},{x:20,w:280,label:"저장장치"}].map((r,i)=><g key={r.label}><rect x={r.x} y={10+i*43} width={r.w} height="34" rx="7" fill={i===selected?"#99f6e4":"#e2e8f0"}/><text x="160" y={32+i*43} textAnchor="middle" fontSize="12" fill="#334155">{r.label}</text></g>)}</svg>;
  return null;
}
function Compare({lesson}:{lesson:Lesson}) {
  const [selected,setSelected]=useState(0);const panels=lesson.panels!;
  return <div><div className="grid grid-cols-2 gap-2">{panels.map((p,i)=><button type="button" key={p.label} onClick={()=>setSelected(i)} aria-pressed={selected===i} className={`flex min-h-24 items-center justify-center gap-2 rounded-2xl border-2 p-3 text-sm font-semibold leading-6 transition-colors ${selected===i?"border-teal-600 bg-teal-50 text-teal-950":"border-white bg-white text-slate-600"}`}><span aria-hidden="true" className={`size-3 shrink-0 rounded-full ${selected===i?"bg-teal-600":"bg-slate-200"}`}/>{p.label}</button>)}</div><ComparisonDrawing slug={lesson.slug} selected={selected}/><div role="status" className="mt-3 rounded-2xl border border-slate-100 bg-white p-4"><p className="text-sm leading-7 text-slate-800">{panels[selected].meaning}</p><p className="mt-3 flex items-start gap-2 text-xs leading-6 text-amber-900"><CircleHelp className="mt-1 size-4 shrink-0"/>{panels[selected].caution}</p></div><Teacher>양쪽을 번갈아 눌러 보세요. 같은 점 하나와 다른 점 하나를 네 말로 설명해 볼까요?</Teacher></div>;
}
function Sorting({lesson}:{lesson:Lesson}) {
  const [index,setIndex]=useState(0),[choice,setChoice]=useState<number|null>(null);
  const item=lesson.items![index],correct=choice===item.bucket;
  return <div>{lesson.slug === "ai-ml-dl" ? <div role="img" aria-label="AI 안에 머신러닝이, 머신러닝 안에 딥러닝이 포함됩니다" className="mb-5 rounded-xl border border-brand-300 bg-white p-3 text-sm text-brand-900"><p className="font-semibold">AI · 지능적 과제를 다루는 넓은 분야</p><div className="ml-3 mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3"><p className="font-semibold">머신러닝 · 데이터로 학습하는 방법</p><div className="ml-3 mt-3 rounded border border-brand-200 bg-brand-100 p-3">딥러닝 · 여러 층의 신경망으로 학습</div></div></div> : null}<p className="text-xs font-medium text-teal-800">분류 카드 {index+1} / {lesson.items!.length}</p><div className="my-4 grid min-h-28 place-items-center rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center text-base font-semibold leading-7 text-slate-800">{item.text}</div><p className="mb-2 text-sm text-slate-600">어느 쪽에 가까울까요?</p><div className="grid grid-cols-2 gap-2">{lesson.buckets!.map((b,i)=><button key={b} type="button" className={`${control} min-h-14 justify-center whitespace-normal text-center`} aria-pressed={choice===i} onClick={()=>setChoice(i)}>{choice===i?(correct?<Check className="size-4 shrink-0"/>:<CircleHelp className="size-4 shrink-0"/>):null}{b}</button>)}</div>{choice!==null?<div role="status" className="lesson-result mt-4"><p className="mb-1 font-semibold">{correct?"맞아요. 이유도 같이 볼까요?":"괜찮아요. 이 단서를 보고 다시 골라봐요."}</p><p className="text-sm leading-7">{item.explanation}</p></div>:null}<div className="mt-3 flex justify-end"><button type="button" className={control} onClick={()=>{setIndex((index+1)%lesson.items!.length);setChoice(null);}}>{index===lesson.items!.length-1?"처음 카드":"다음 카드"}<ArrowRight className="size-4"/></button></div><p className="mt-3 text-xs leading-6 text-slate-500">편하게 연습하는 카드예요. 이 활동은 학습 진도나 시험 점수를 바꾸지 않아요.</p></div>;
}
function Words({lesson}:{lesson:Lesson}) {
  return <section aria-label="핵심 용어 풀이" className="border-l-2 border-brand-200 pl-4">
    <dl className="space-y-3">{lesson.terms.map(([word, meaning]) => <div key={word}><dt className="text-sm font-semibold text-slate-900">{word}</dt><dd className="mt-1 text-sm leading-7 text-slate-700">{meaning}</dd></div>)}</dl>
  </section>;
}
function GlossaryHint({lesson}:{lesson:Lesson}) {
  return <details className="mt-4 rounded-xl border border-teal-100 bg-white/70"><summary className="cursor-pointer px-3 py-3 text-xs font-medium text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">낯선 단어의 뜻을 같이 볼까요?</summary><div className="px-2 pb-2"><Words lesson={{...lesson,terms:lesson.advancedTerms}}/></div></details>;
}
function Recall({lesson}:{lesson:Lesson}) {
  const [open,setOpen]=useState(false);
  const inputId=useId();
  return <section aria-label="내 말로 설명해 보기" className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-900"><CircleHelp className="size-4"/>내 말로 설명해 보기</h4>
    <p className="text-sm font-medium leading-7 text-slate-800">{lesson.question}</p>
    <label htmlFor={inputId} className="mt-3 block text-xs text-slate-600">내 설명 (선택)</label>
    <textarea id={inputId} rows={3} maxLength={600} placeholder="짧게 적거나 소리 내어 설명해 보세요." className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-base leading-7 text-slate-800 focus-visible:outline-2 focus-visible:outline-brand-600"/>
    <p className="text-xs leading-6 text-slate-500">이 메모는 채점하거나 저장하지 않아요.</p>
    <button type="button" aria-expanded={open} className={`${control} mt-3`} onClick={()=>setOpen(!open)}><Eye className="size-4"/>{open?"예시 답안 접기":"예시 답안과 비교하기"}</button>
    {open?<Teacher><p>{lesson.answer}</p><p className="mt-2">표현은 달라도 괜찮아요. 설명에서 빠진 부분이 있다면 위의 작은 예와 용어 풀이를 다시 읽어 보세요.</p></Teacher>:null}
  </section>;
}
function Debug({lesson}:{lesson:Lesson}) {
  const labels=["어떤 문제가 생겼나요?","무엇을 확인하나요?","원인은 무엇일까요?","어떻게 고치나요?","고친 뒤 무엇을 보나요?"];
  if (!lesson.debug) return <p className="text-sm leading-7 text-slate-700">아래 상세 사례에서 증상과 확인 방법을 함께 읽어 주세요.</p>;
  return <ol aria-label="문제 해결 과정" className="space-y-4">{lesson.debug.map((body,i)=><li key={labels[i]} className="border-l-2 border-violet-200 pl-3"><h4 className="text-sm font-semibold text-violet-900">{i+1}. {labels[i]}</h4><p className="mt-1 text-sm leading-7 text-slate-800">{body}</p></li>)}</ol>;
}
function Decide({lesson}:{lesson:Lesson}) {
  const [index,setIndex]=useState(0),option=lesson.options[index];
  return <div><div className="flex flex-wrap gap-2">{lesson.options.map((o,i)=><button key={o.label} type="button" className={`${control} max-w-full whitespace-normal text-left`} aria-pressed={index===i} onClick={()=>setIndex(i)}>{o.label}</button>)}</div><div role="status" className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-teal-200 bg-teal-50 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-teal-900"><Sparkles className="size-4"/>얻는 점</p><p className="text-sm leading-7 text-slate-800">{option.gain}</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-900"><CircleHelp className="size-4"/>감수할 점</p><p className="text-sm leading-7 text-slate-800">{option.cost}</p></div></div><Teacher>여기서는 하나의 정답을 고르지 않아요. 네가 가장 중요하게 지키고 싶은 조건은 무엇인가요?</Teacher></div>;
}
function Explore({lesson}:{lesson:Lesson}) {
  switch(lesson.kind){
    case "network":return <NetworkLab/>;
    case "attention":return <AttentionLab/>;
    case "kanban":return <KanbanLab/>;
    case "schedule":return <ScheduleLab/>;
    case "bits":return <BitsLab arithmetic={lesson.slug==="binary-arithmetic"}/>;
    case "gate":return <GateLab/>;
    case "capacity":return <QueueLab slug={lesson.slug}/>;
    case "growth":return <GrowthLab/>;
    case "distribution":return <DistributionLab/>;
    case "threshold":return <ThresholdLab/>;
    case "vector":return <VectorLab/>;
    case "compare":return <Compare lesson={lesson}/>;
    case "sort":return <Sorting lesson={lesson}/>;
    default:return <Sequence lesson={lesson}/>;
  }
}
export default function LessonVisual({source,lesson}:{source:string;lesson?:Lesson|null}) {
  let ref:LessonReference;
  try {
    if(source.length>300)throw Error("Long reference");
    const value=JSON.parse(source);
    if(!value||typeof value.slug!=="string"||!["explore","trace","words","recall","debug","decide"].includes(value.view)||Object.keys(value).some(k=>!["slug","view"].includes(k)))throw Error("Invalid reference");
    ref=value;
  }catch{return <p role="status" className="not-prose rounded-xl bg-amber-50 p-3 text-sm">그림 참조를 확인하지 못했어요. 아래 설명을 읽어 주세요.</p>;}
  if(!lesson||lesson.slug!==ref.slug)return <p role="status" className="not-prose rounded-xl bg-amber-50 p-3 text-sm">이 주제의 그림을 준비하고 있어요.</p>;
  if(ref.view==="words")return <div className="not-prose my-5" data-lesson-view="words"><Words key={ref.slug} lesson={lesson}/></div>;
  if(ref.view==="recall")return <div tabIndex={-1} className="not-prose my-5 scroll-mt-4 rounded-2xl focus-visible:outline-2 focus-visible:outline-brand-600" data-lesson-view="recall"><Recall key={ref.slug} lesson={lesson}/></div>;
  const subtitle=ref.view==="debug"?"증상부터 해결까지":ref.view==="decide"?"방법별 이득과 부담":ref.view==="trace"||lesson.kind==="sequence"?"순서대로 이해하기":"예시를 바꿔 확인하기";
  return <section aria-label={`${lesson.title} 개념 확인 활동`} data-lesson-kind={lesson.kind} data-lesson-view={ref.view} className="lesson-board not-prose my-5 overflow-hidden rounded-3xl border border-teal-100 bg-[#f4faf8] p-4 sm:p-5"><header className="mb-4 flex items-center gap-2 text-xs font-semibold text-teal-900"><span aria-hidden="true" className="grid size-7 place-items-center rounded-xl bg-teal-100"><GraduationCap className="size-4"/></span>{subtitle}</header>{ref.view==="trace"?<Sequence key={ref.slug} lesson={lesson}/>:ref.view==="debug"?<Debug key={ref.slug} lesson={lesson}/>:ref.view==="decide"?<Decide key={ref.slug} lesson={lesson}/>:<Explore key={ref.slug} lesson={lesson}/>} {ref.view!=="explore"?<GlossaryHint lesson={lesson}/>:null}</section>;
}
