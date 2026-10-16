"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, Eye, GraduationCap, Lightbulb, Pause, Play, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import registry from "@/lib/learning-lessons.json";
import type { Lesson, LessonReference } from "@/lib/lesson-schema";
import { AttentionLab, KanbanLab, NetworkLab, ScheduleLab } from "./AppliedLabs";
import { BitsLab, DistributionLab, GateLab, GrowthLab, QueueLab, ThresholdLab, VectorLab } from "./SpecialLabs";

const lessons = new Map((registry as Lesson[]).map((lesson) => [lesson.slug, lesson]));
const control = "lesson-control";
function Teacher({children}:{children:React.ReactNode}) {
  return <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-white/80 p-3 text-sm leading-7 text-slate-700"><span aria-hidden="true" className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-900"><GraduationCap className="size-4"/></span><div>{children}</div></div>;
}
function Sequence({lesson}:{lesson:Lesson}) {
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[reduced,setReduced]=useState(false);
  useEffect(()=>{
    if(!playing)return;
    const timer=window.setTimeout(()=>{if(step===lesson.steps.length-1)setPlaying(false);else setStep(s=>s+1);},3200);
    return ()=>window.clearTimeout(timer);
  },[playing,step,lesson.steps.length]);
  useEffect(()=>{
    if(!playing)return;
    const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop=(event:MediaQueryListEvent)=>{if(event.matches){setPlaying(false);setReduced(true);}};
    preference.addEventListener("change",stop);
    return ()=>preference.removeEventListener("change",stop);
  },[playing]);
  function play() {
    if(playing){setPlaying(false);return;}
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){setReduced(true);return;}
    setReduced(false);
    if(step===lesson.steps.length-1)setStep(0);
    setPlaying(true);
  }
  function go(next:number){setPlaying(false);setStep(next);}
  return <div>
    <div className="my-4 grid grid-cols-3 gap-2" aria-label="과정의 세 장면">{lesson.steps.map((item,i)=><button key={item.label} type="button" aria-pressed={step===i} aria-label={`${i+1}장면 ${item.label}`} onClick={()=>go(i)} className={`relative flex min-h-28 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 text-center transition-colors ${step===i?"border-teal-600 bg-teal-50 text-teal-950":"border-white bg-white/70 text-slate-600"}`}><span aria-hidden="true" className={`grid size-9 place-items-center rounded-full text-base font-bold ${step===i?"bg-teal-700 text-white":"bg-slate-100 text-slate-500"}`}>{i+1}</span><span className="text-xs font-semibold leading-5 break-keep">{item.label}</span>{i<2?<ChevronRight aria-hidden="true" className="absolute -right-3 top-5 z-10 size-5 rounded-full bg-amber-50 text-teal-700"/>:null}</button>)}</div>
    <svg aria-hidden="true" viewBox="0 0 320 24" className="mb-3 w-full"><path d="M53 12H267" stroke="#cbe4dd" strokeWidth="3" strokeLinecap="round"/>{[53,160,267].map(x=><circle key={x} cx={x} cy="12" r="5" fill="#cbe4dd"/>)}<circle cx="53" cy="12" r="8" fill="#0f766e" style={{transform:`translateX(${step*107}px)`,transition:"transform 500ms ease"}}/></svg>
    <div className="lesson-scene relative overflow-hidden rounded-2xl border border-teal-100 bg-white p-4"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-teal-50"><div key={`${step}:${playing}`} className={playing?"lesson-scene-progress h-full bg-teal-600":"h-full bg-teal-300"} style={{width:playing?undefined:`${(step+1)/3*100}%`}}/></div><p className="mb-2 text-xs font-semibold text-teal-800">장면 {step+1} · {lesson.steps[step].label}</p><p role="status" className="min-h-14 text-sm leading-7 text-slate-800">{lesson.steps[step].body}</p></div>
    <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" className={control} aria-pressed={playing} onClick={play}>{playing?<Pause className="size-4"/>:<Play className="size-4"/>}{playing?"일시정지":"모션으로 보기"}</button><button type="button" className={control} disabled={step===0} onClick={()=>go(step-1)} aria-label="이전 장면"><ArrowLeft className="size-4"/></button><button type="button" className={control} disabled={step===2} onClick={()=>go(step+1)} aria-label="다음 장면"><ArrowRight className="size-4"/></button><span className="text-xs tabular-nums text-slate-500">{step+1} / 3</span></div>
    {reduced?<p role="status" className="mt-2 text-xs leading-6 text-slate-600">움직임 줄이기 설정이 켜져 있어요. 이전·다음 버튼으로 편하게 넘겨 보세요.</p>:null}
    <Teacher>다음에 어떤 일이 생길지 먼저 예상해 볼까요? 언제든 멈추고 앞 장면으로 돌아갈 수 있어요.</Teacher>
  </div>;
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
  return <div><p className="text-xs font-medium text-teal-800">분류 카드 {index+1} / {lesson.items!.length}</p><div className="my-4 grid min-h-28 place-items-center rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center text-base font-semibold leading-7 text-slate-800">{item.text}</div><p className="mb-2 text-sm text-slate-600">어느 쪽에 가까울까요?</p><div className="grid grid-cols-2 gap-2">{lesson.buckets!.map((b,i)=><button key={b} type="button" className={`${control} min-h-14 justify-center whitespace-normal text-center`} aria-pressed={choice===i} onClick={()=>setChoice(i)}>{choice===i?(correct?<Check className="size-4 shrink-0"/>:<CircleHelp className="size-4 shrink-0"/>):null}{b}</button>)}</div>{choice!==null?<div role="status" className="lesson-result mt-4"><p className="mb-1 font-semibold">{correct?"맞아요. 이유도 같이 볼까요?":"괜찮아요. 이 단서를 보고 다시 골라봐요."}</p><p className="text-sm leading-7">{item.explanation}</p></div>:null}<div className="mt-3 flex justify-end"><button type="button" className={control} onClick={()=>{setIndex((index+1)%lesson.items!.length);setChoice(null);}}>{index===lesson.items!.length-1?"처음 카드":"다음 카드"}<ArrowRight className="size-4"/></button></div><p className="mt-3 text-xs leading-6 text-slate-500">편하게 연습하는 카드예요. 이 활동은 학습 진도나 시험 점수를 바꾸지 않아요.</p></div>;
}
function Words({lesson}:{lesson:Lesson}) {
  const [index,setIndex]=useState(0);
  return <section aria-label="처음 만나는 단어 카드" className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4"><p className="mb-3 flex items-center gap-2 text-xs font-semibold text-amber-900"><Lightbulb className="size-4"/>어려운 말은 카드로 풀어봐요</p><div className="flex flex-wrap gap-2">{lesson.terms.map(([word],i)=><button key={word} type="button" className={`${control} text-xs`} aria-pressed={index===i} onClick={()=>setIndex(i)}>{word}</button>)}</div><p role="status" className="mt-3 rounded-xl bg-white p-3 text-sm leading-7 text-slate-700"><strong>{lesson.terms[index][0]}</strong> · {lesson.terms[index][1]}</p></section>;
}
function GlossaryHint({lesson}:{lesson:Lesson}) {
  return <details className="mt-4 rounded-xl border border-teal-100 bg-white/70"><summary className="cursor-pointer px-3 py-3 text-xs font-medium text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">낯선 단어의 뜻을 같이 볼까요?</summary><div className="px-2 pb-2"><Words lesson={{...lesson,terms:lesson.advancedTerms}}/></div></details>;
}
function Recall({lesson}:{lesson:Lesson}) {
  const [open,setOpen]=useState(false);
  return <section aria-label="잠깐 생각해 보기" className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-sky-900"><CircleHelp className="size-4"/>잠깐, 네 생각은 어때요?</p><p className="text-sm font-medium leading-7 text-slate-800">{lesson.question}</p><button type="button" aria-expanded={open} className={`${control} mt-3`} onClick={()=>setOpen(!open)}><Eye className="size-4"/>{open?"설명 접기":"생각했어요. 같이 확인하기"}</button>{open?<Teacher>{lesson.answer}</Teacher>:null}</section>;
}
function Debug({lesson}:{lesson:Lesson}) {
  const [index,setIndex]=useState(0);
  const labels=["증상","증거","가설","수정","재확인"],icons=[Search,Eye,Lightbulb,Wrench,ShieldCheck];
  return <div><div className="grid grid-cols-5 gap-1" aria-label="문제 해결 단서">{labels.map((label,i)=>{const Icon=icons[i];return <button key={label} type="button" aria-pressed={index===i} onClick={()=>setIndex(i)} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-1 py-2 text-[11px] font-medium ${index===i?"border-violet-300 bg-violet-50 text-violet-900":"border-white bg-white text-slate-600"}`}><Icon className="size-5"/>{i+1} {label}</button>;})}</div><div role="status" className="mt-3 rounded-2xl border border-violet-100 bg-white p-4"><p className="mb-2 text-xs font-semibold text-violet-800">단서 {index+1} · {labels[index]}</p><p className="text-sm leading-7 text-slate-800">{lesson.debug[index]}</p></div><div className="mt-3 flex justify-between gap-2"><button type="button" className={control} disabled={!index} onClick={()=>setIndex(index-1)}><ArrowLeft className="size-4"/>앞 단서</button><button type="button" className={control} disabled={index===4} onClick={()=>setIndex(index+1)}>다음 단서<ArrowRight className="size-4"/></button></div><Teacher>눈으로 확인한 사실과 아직 확인하지 않은 추측은 달라요. “왜 그렇게 생각했어?”라고 스스로에게 물어보세요.</Teacher></div>;
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
export default function LessonVisual({source}:{source:string}) {
  let ref:LessonReference;
  try {
    if(source.length>300)throw Error("Long reference");
    const value=JSON.parse(source);
    if(!value||typeof value.slug!=="string"||!["explore","trace","words","recall","debug","decide"].includes(value.view)||Object.keys(value).some(k=>!["slug","view"].includes(k)))throw Error("Invalid reference");
    ref=value;
  }catch{return <p role="status" className="not-prose rounded-xl bg-amber-50 p-3 text-sm">그림 참조를 확인하지 못했어요. 아래 설명을 읽어 주세요.</p>;}
  const lesson=lessons.get(ref.slug);
  if(!lesson)return <p role="status" className="not-prose rounded-xl bg-amber-50 p-3 text-sm">이 주제의 그림을 준비하고 있어요.</p>;
  if(ref.view==="words")return <div className="not-prose my-5" data-lesson-view="words"><Words key={ref.slug} lesson={lesson}/></div>;
  if(ref.view==="recall")return <div className="not-prose my-5" data-lesson-view="recall"><Recall key={ref.slug} lesson={lesson}/></div>;
  const subtitle=ref.view==="debug"?"단서를 눌러 함께 찾아봐요":ref.view==="decide"?"조건을 생각하며 골라봐요":ref.view==="trace"?"한 장면씩, 직접 재생해 봐요":"손으로 바꾸면 더 잘 보여요";
  return <section aria-label={`${lesson.title} 시각 수업`} data-lesson-kind={lesson.kind} data-lesson-view={ref.view} className="lesson-board not-prose my-5 overflow-hidden rounded-3xl border border-teal-100 bg-[#f4faf8] p-4 sm:p-5"><header className="mb-4 flex items-center gap-2 text-xs font-semibold text-teal-900"><span aria-hidden="true" className="grid size-7 place-items-center rounded-xl bg-teal-100"><GraduationCap className="size-4"/></span>{subtitle}</header>{ref.view==="trace"?<Sequence key={ref.slug} lesson={lesson}/>:ref.view==="debug"?<Debug key={ref.slug} lesson={lesson}/>:ref.view==="decide"?<Decide key={ref.slug} lesson={lesson}/>:<Explore key={ref.slug} lesson={lesson}/>} {ref.view!=="explore"?<GlossaryHint lesson={lesson}/>:null}</section>;
}
