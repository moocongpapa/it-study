"use client";

import { useId, useState } from "react";
import { ArrowRight, Lightbulb, Plus, RotateCcw } from "lucide-react";
import { averageAndMedian, classificationCounts, CLASSIFICATION_SAMPLES, logicResult, queueTurn, readFourBits, vectorSimilarities } from "@/lib/lesson-math";

const button = "lesson-control";
function LabNote({children}:{children:React.ReactNode}) {return <p className="mt-4 text-xs leading-6 text-slate-500">{children}</p>;}
function Range({label,value,min,max,onChange,suffix=""}:{label:string;value:number;min:number;max:number;onChange:(v:number)=>void;suffix?:string}) {
  const id=useId();
  return <div className="my-3"><label htmlFor={id} className="mb-1 flex items-center justify-between gap-3 text-sm font-medium text-slate-700"><span>{label}</span><output htmlFor={id} className="font-bold tabular-nums text-teal-800">{value}{suffix}</output></label><input id={id} aria-label={label} type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} className="h-11 w-full accent-teal-700" /></div>;
}

export function BitsLab({arithmetic}:{arithmetic:boolean}) {
  const [value,setValue]=useState(arithmetic?15:10),[signed,setSigned]=useState(false),[sum,setSum]=useState<number|null>(null);
  return <div>
    <p className="lesson-instruction"><Lightbulb className="size-4 shrink-0"/>전등을 눌러 켜고 꺼 보세요. 켜진 자리의 값을 더해요.</p>
    <div className="my-5 grid grid-cols-4 gap-2">{[8,4,2,1].map((weight,i)=>{const on=!!(value&weight);return <button key={weight} type="button" aria-label={`${weight} 자리 ${on?"켜짐":"꺼짐"}`} aria-pressed={on} onClick={()=>{setValue(value^weight);setSum(null);}} className={`rounded-2xl border-2 p-3 text-center transition-colors ${on?"border-amber-400 bg-amber-50":"border-slate-200 bg-white"}`}><Lightbulb aria-hidden="true" className={`mx-auto mb-2 size-7 ${on?"fill-amber-200 text-amber-700":"text-slate-300"}`}/><span className="block text-2xl font-bold text-slate-900">{on?1:0}</span><span className="mt-1 block whitespace-nowrap text-[11px] text-slate-600">{signed&&i===0?-8:weight}의 자리</span></button>;})}</div>
    {!arithmetic?<div className="flex flex-wrap gap-2"><button type="button" className={button} aria-pressed={!signed} onClick={()=>setSigned(false)}>음수 없이 읽기</button><button type="button" className={button} aria-pressed={signed} onClick={()=>setSigned(true)}>2의 보수로 읽기</button></div>:<button type="button" className={button} onClick={()=>{setSum(value+1);setValue((value+1)&15);}}><Plus className="size-4"/>1 더하기</button>}
    <p role="status" className="lesson-result mt-4"><span className="font-mono text-xl">{value.toString(2).padStart(4,"0")}</span><ArrowRight aria-hidden="true" className="inline size-4 mx-2"/><strong className="text-2xl">{readFourBits(value,signed)}</strong><span className="ml-2 text-sm">{signed?"4비트 2의 보수":"음수 없는 4비트"}</span></p>
    {sum!==null?<p className="mt-3 text-sm leading-7 text-slate-700">수학적인 합은 <strong>{sum}</strong>이에요. {sum>15?"16은 네 자리에 담기지 않아서 이 모형에는 0000만 남고 바깥으로 자리올림 1이 나와요.":"이번에는 네 자리 안에 담을 수 있어요."}</p>:null}
    <LabNote>네 자리 숫자를 보여 주는 모형이에요. 실제 언어의 넘침 처리는 오류·큰 정수 등 자료형의 규칙을 따로 확인해야 해요.</LabNote>
  </div>;
}
export function GateLab() {
  const [kind,setKind]=useState<"AND"|"OR"|"NOT">("AND"),[a,setA]=useState(true),[b,setB]=useState(false);
  const out=logicResult(kind,a,b);
  return <div>
    <div className="flex gap-2">{(["AND","OR","NOT"]as const).map(k=><button type="button" className={button} aria-pressed={kind===k} key={k} onClick={()=>setKind(k)}>{k}</button>)}</div>
    <svg viewBox="0 0 320 145" role="img" aria-label={`${kind} 게이트, A ${Number(a)}, B ${Number(b)}, 출력 ${Number(out)}`} className="my-4 w-full rounded-2xl bg-white">
      <path d={kind==="NOT"?"M45 75H110":"M45 47H110M45 99H110"} fill="none" stroke="#94a3b8" strokeWidth="3"/>
      {kind==="AND"?<path d="M110 25H170A50 50 0 0 1 170 125H110Z" fill="#ccfbf1" stroke="#0f766e" strokeWidth="3"/>:kind==="OR"?<path d="M105 25Q165 25 220 75Q165 125 105 125Q145 75 105 25Z" fill="#ccfbf1" stroke="#0f766e" strokeWidth="3"/>:<><path d="M110 25L210 75L110 125Z" fill="#ccfbf1" stroke="#0f766e" strokeWidth="3"/><circle cx="220" cy="75" r="8" fill="white" stroke="#0f766e" strokeWidth="3"/></>}
      <path d="M230 75H275" stroke={out?"#d97706":"#94a3b8"} strokeWidth="4"/>
      <text x="14" y={kind==="NOT"?80:52} fill="#334155" fontSize="17">{Number(a)}</text>{kind!=="NOT"?<text x="14" y="104" fill="#334155" fontSize="17">{Number(b)}</text>:null}<text x="145" y="81" fill="#115e59" fontSize="16" fontWeight="700">{kind}</text><text x="285" y="82" fill="#92400e" fontSize="24" fontWeight="700">{Number(out)}</text>
    </svg>
    <div className="grid grid-cols-2 gap-2"><button type="button" className={button} aria-pressed={a} onClick={()=>setA(!a)}>입력 A · {a?"켜짐 1":"꺼짐 0"}</button><button type="button" className={button} disabled={kind==="NOT"} aria-pressed={b} onClick={()=>setB(!b)}>입력 B · {b?"켜짐 1":"꺼짐 0"}</button></div>
    <p role="status" className="lesson-result mt-4">{kind==="AND"?"둘 다 1일 때만":kind==="OR"?"하나라도 1이면":"A를 반대로 바꾸면"} 결과는 <strong>{Number(out)}</strong>이에요.</p>
    <LabNote>NOT은 입력 A 하나만 써요. 여기서는 안정된 0과 1의 규칙을 보며 실제 회로의 전압·지연은 생략했어요.</LabNote>
  </div>;
}
export function QueueLab({slug}:{slug:string}) {
  const [incoming,setIncoming]=useState(6),[capacity,setCapacity]=useState(3),[state,setState]=useState({waiting:0,finished:0,total:0});
  const tooLarge=state.waiting+incoming>100;
  return <div>
    <Range label="한 턴에 새로 들어오는 일" min={0} max={8} value={incoming} onChange={setIncoming}/><Range label="한 턴에 처리할 수 있는 일" min={1} max={8} value={capacity} onChange={setCapacity}/>
    <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-3"><span className="block text-xs text-amber-900">아직 기다리는 일</span><strong className="my-2 block text-3xl text-amber-900">{state.waiting}</strong><div aria-hidden="true" className="flex min-h-5 flex-wrap justify-center gap-1">{Array.from({length:Math.min(12,state.waiting)},(_,i)=><span key={i} className="size-3 rounded-sm bg-amber-400"/>)}</div></div><ArrowRight aria-hidden="true" className="size-5 text-slate-400"/><div className="rounded-2xl border border-teal-200 bg-teal-50 p-3"><span className="block text-xs text-teal-900">방금 턴에 끝낸 일</span><strong className="my-2 block text-3xl text-teal-900">{state.finished}</strong><span className="text-xs text-teal-800">전체 완료 {state.total}</span></div></div>
    <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={tooLarge} onClick={()=>setState(s=>{const next=queueTurn(s.waiting,incoming,capacity);return {...next,total:s.total+next.finished};})}>한 턴 보내기<ArrowRight className="size-4"/></button><button type="button" className={button} onClick={()=>setState({waiting:0,finished:0,total:0})}><RotateCcw className="size-4"/>처음부터</button></div>
    <p role="status" className="mt-3 text-sm leading-7 text-slate-700">{tooLarge?"대기열을 100개 이하로 제한한 모형이에요. 처음부터 다시 해볼까요?":state.waiting?"들어오는 일이 처리하는 일보다 계속 많으면 대기가 쌓여요. 입력을 줄이거나 처리량을 바꿔 다음 턴을 비교해 보세요.":"아직 대기가 없어요. 새로 들어오는 일을 바꾸고 한 턴을 보내 보세요."}</p>
    <LabNote>고정된 처리량을 가정한 가상 대기열이에요. {slug==="gpu-inference-optimization"?"실제 GPU의 배치·메모리·토큰별 속도는 재현하지 않아요.":"실제 서비스의 도착 간격·작업 크기·자원 경합은 더 복잡해요."} 수치는 성능 측정값이 아니에요.</LabNote>
  </div>;
}
export function GrowthLab() {
  const [n,setN]=useState(8);
  const curves=[{name:"n",color:"#0f766e",fn:(x:number)=>x},{name:"n log₂ n",color:"#2563eb",fn:(x:number)=>x*Math.log2(x)},{name:"n²",color:"#d97706",fn:(x:number)=>x*x}];
  const x=(v:number)=>30+(v-1)/19*270,y=(v:number)=>170-v/400*145;
  return <div><Range label="입력 크기 n" min={1} max={20} value={n} onChange={setN}/><svg viewBox="0 0 330 205" role="img" aria-label={`입력 ${n}에서 n은 ${n}, n log n은 ${(n*Math.log2(n)).toFixed(1)}, n 제곱은 ${n*n}`} className="w-full rounded-xl bg-white"><path d="M30 20V170H310" fill="none" stroke="#94a3b8"/>{[0,200,400].map(v=><g key={v}><path d={`M30 ${y(v)}H305`} stroke="#e2e8f0"/><text x="2" y={y(v)+4} fontSize="10" fill="#64748b">{v}</text></g>)}{[1,5,10,15,20].map(v=><text key={v} x={x(v)} y="188" textAnchor="middle" fontSize="11" fill="#64748b">{v}</text>)}{curves.map(c=><g key={c.name}><path d={Array.from({length:20},(_,i)=>`${i?"L":"M"}${x(i+1)} ${y(c.fn(i+1))}`).join(" ")} fill="none" stroke={c.color} strokeWidth="2.5"/><circle cx={x(n)} cy={y(c.fn(n))} r="5" fill={c.color}/></g>)}<text x="268" y="202" fontSize="10" fill="#64748b">입력 크기 n</text></svg><div role="status" className="mt-3 grid grid-cols-3 gap-2">{curves.map(c=><div key={c.name} className="rounded-xl border border-slate-200 bg-white p-2 text-center"><span className="text-xs" style={{color:c.color}}>{c.name}</span><strong className="block text-lg text-slate-900">{Number(c.fn(n).toFixed(1))}</strong></div>)}</div><LabNote>세 식의 증가 모양을 비교하는 그림이에요. 세로축은 식의 값이며 실제 실행 시간이나 특정 코드의 정확한 비교 횟수가 아니에요.</LabNote></div>;
}
export function DistributionLab() {
  const [last,setLast]=useState(70);const values=[50,55,60,65,last],stats=averageAndMedian(values);
  return <div><Range label="마지막 학생의 점수" min={0} max={100} value={last} onChange={setLast} suffix="점"/><svg viewBox="0 0 320 190" role="img" aria-label={`가상 점수 ${values.join(", ")}. 평균 ${stats.mean}, 중앙값 ${stats.median}`} className="w-full rounded-xl bg-white">{values.map((v,i)=><g key={i}><rect x={25+i*58} y={155-v*1.2} width="32" height={v*1.2} rx="5" fill={i===4?"#fbbf24":"#99d9cf"}/><text x={41+i*58} y={147-v*1.2} textAnchor="middle" fontSize="12" fill="#334155">{v}</text><text x={41+i*58} y="177" textAnchor="middle" fontSize="11" fill="#64748b">학생 {i+1}</text></g>)}<path d={`M15 ${155-stats.mean*1.2}H312`} stroke="#2563eb" strokeWidth="2" strokeDasharray="5 3"/></svg><div role="status" className="mt-3 grid grid-cols-2 gap-2"><div className="lesson-result">평균 <strong>{stats.mean.toFixed(1)}점</strong></div><div className="lesson-result">중앙값 <strong>{stats.median}점</strong></div></div><p className="mt-3 text-sm leading-7 text-slate-700">점수 하나를 크게 바꾸면 평균과 중앙값은 각각 얼마나 움직이나요? 파란 점선은 평균의 높이예요.</p><LabNote>설명을 위해 만든 다섯 명의 가상 점수예요. 중앙값은 점수를 정렬했을 때 가운데 값이에요.</LabNote></div>;
}
export function ThresholdLab() {
  const [cut,setCut]=useState(50);const threshold=cut/100,counts=classificationCounts(threshold);
  return <div><Range label="불량으로 판단하는 점수 경계" min={0} max={100} value={cut} onChange={setCut} suffix=" / 100"/><svg viewBox="0 0 340 170" role="img" aria-label={`불량 찾음 ${counts.tp}, 잘못 경고 ${counts.fp}, 놓친 불량 ${counts.fn}, 정상 통과 ${counts.tn}`} className="w-full rounded-xl bg-white"><text x="4" y="38" fontSize="11" fill="#334155">실제 불량</text><text x="4" y="98" fontSize="11" fill="#334155">실제 정상</text><path d={`M${75+threshold*245} 15V130`} stroke="#0f766e" strokeDasharray="5 3" strokeWidth="2"/>{CLASSIFICATION_SAMPLES.map((s,i)=><g key={i}><circle cx={75+s.score*245} cy={s.positive?58:113} r="8" fill={s.score>=threshold?"#0f766e":"#e2e8f0"} stroke="#475569"/><title>{`${i+1}번: 점수 ${s.score}, 실제 ${s.positive?"불량":"정상"}, 판단 ${s.score>=threshold?"불량":"정상"}`}</title></g>)}<text x="75" y="153" fontSize="10" fill="#64748b">점수 0</text><text x="275" y="153" fontSize="10" fill="#64748b">점수 1</text></svg><div role="status" className="mt-3 grid grid-cols-2 gap-2">{[["불량을 찾았어요",counts.tp],["정상을 잘못 경고",counts.fp],["불량을 놓쳤어요",counts.fn],["정상을 통과시켰어요",counts.tn]].map(([label,value])=><div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{label}<strong className="ml-2 text-xl text-slate-900">{value}</strong></div>)}</div><LabNote>점선 오른쪽의 진한 점은 불량으로 판단한 자료예요. 점수를 낮게 받아도 실제 불량인 점이 있어요. 점수와 정답은 설명용으로 만든 값이며 실제 모델의 확률·성능을 나타내지 않아요.</LabNote></div>;
}
export function VectorLab() {
  const [angle,setAngle]=useState(35);const {x,y,scores}=vectorSimilarities(angle),best=scores.indexOf(Math.max(...scores));
  const points=[[1,0],[0,1],[.8,.6]];
  return <div><Range label="질문 벡터의 방향" min={0} max={90} value={angle} onChange={setAngle} suffix="°"/><svg viewBox="0 0 230 205" role="img" aria-label={`질문 방향 ${angle}도. 가장 가까운 방향은 문서 ${["A","B","C"][best]}`} className="w-full max-h-64 rounded-xl bg-white"><path d="M30 15V165H215" fill="none" stroke="#94a3b8"/>{points.map(([px,py],i)=><g key={i}><path d={`M30 165L${30+px*150} ${165-py*150}`} stroke={i===best?"#d97706":"#94a3b8"} strokeWidth={i===best?4:2}/><circle cx={30+px*150} cy={165-py*150} r="5" fill="#d97706"/><text x={32+px*150} y={154-py*150} fontSize="12" fill="#334155">{["A","B","C"][i]}</text></g>)}<path d={`M30 165L${30+x*150} ${165-y*150}`} stroke="#0f766e" strokeWidth="3" strokeDasharray="5 3"/><rect x={25+x*150} y={160-y*150} width="10" height="10" fill="#0f766e"/><text x="33" y="191" fontSize="11" fill="#115e59">점선·네모 = 질문</text></svg><div role="status" className="mt-3 space-y-2">{scores.map((score,i)=><div key={i} className="flex items-center gap-2 text-xs text-slate-600"><span className="w-12">문서 {["A","B","C"][i]}</span><span className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-teal-600" style={{width:`${score*100}%`}}/></span><span className="w-9 text-right tabular-nums">{score.toFixed(2)}</span></div>)}</div><LabNote>단위 벡터의 코사인 유사도를 계산한 2차원 모형이에요. 실제 문서 의미를 학습한 값이 아니며 높은 유사도는 정답이나 접근 권한의 증거가 아니에요.</LabNote></div>;
}
