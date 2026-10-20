"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckCircle2, Download, Lightbulb, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PracticeCase } from "@/lib/practice-cases";
import { exportPracticeWorkbook, readPracticeDraft } from "@/lib/practice-workbook";
import { cn } from "@/lib/utils";

function PracticeDecision({ decision, index }: { decision: PracticeCase["decisions"][number]; index: number }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [revealed, setRevealed] = useState(false);
  const correct = choice === decision.correctIndex;
  return <fieldset className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <legend className="max-w-full px-1 text-base font-semibold leading-7 text-slate-900">{index + 1}. {decision.question}</legend>
    <details className="mb-3 text-sm text-slate-600"><summary className="min-h-11 cursor-pointer py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">작은 힌트 보기</summary><p className="rounded-lg bg-amber-50 p-3 leading-7">{decision.hint}</p></details>
    <div className="space-y-2">{decision.options.map((option, i) => <label key={option.label} className={cn("flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6", choice === i ? "border-teal-500 bg-teal-50 text-teal-950" : "border-slate-200 text-slate-700")}>
      <input type="radio" name={`decision-${index}`} value={i} checked={choice === i} disabled={revealed} onChange={() => setChoice(i)} className="mt-1 size-4 shrink-0 accent-teal-700"/>{option.label}
    </label>)}</div>
    <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor={`reason-${index}`}>그렇게 생각한 근거는? <span className="font-normal text-slate-500">(선택)</span></label>
    <textarea id={`reason-${index}`} value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} rows={2} placeholder="자료 ID나 확인한 조건을 한 줄로 적어 보세요." className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-6 outline-none focus-visible:ring-2 focus-visible:ring-teal-600"/>
    <p className="mt-1 text-xs leading-5 text-slate-500">여기의 생각 메모는 페이지를 나가면 사라져요. 남길 내용은 아래 결과물에 옮겨 적어 주세요.</p>
    {revealed && choice !== null ? <div role="status" className={cn("mt-4 rounded-xl p-4 text-sm leading-7", correct ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950")}>
      <p className="font-semibold">{correct ? "근거와 잘 연결했어요." : "이 조건을 한 번 더 살펴볼까요?"}</p><p className="mt-1">{decision.options[choice].explanation}</p>
      {!correct ? <p className="mt-2">권장 판단: {decision.options[decision.correctIndex].label}</p> : null}
      <button type="button" onClick={() => { setRevealed(false); setChoice(null); }} className="mt-2 min-h-11 rounded-lg px-2 font-medium underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-teal-600">다른 선택도 생각하기</button>
    </div> : <Button variant="secondary" className="mt-3 min-h-11" disabled={choice === null} onClick={() => setRevealed(true)}>선생님 해설 확인</Button>}
  </fieldset>;
}

const noSubscription = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function WorkbookForm({ lesson }: { lesson: PracticeCase }) {
  const storageKey = `it-atlas-practice-v1:${lesson.slug}`;
  const [draft, setDraft] = useState(() => {
    try { return readPracticeDraft(localStorage.getItem(storageKey), lesson); }
    catch { return readPracticeDraft(null, lesson); }
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  function save() {
    setError("");
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); setDirty(false); setNotice("이 브라우저에 저장했어요. 같은 브라우저에서 다시 열면 이어 쓸 수 있어요."); }
    catch { setNotice(""); setError("브라우저에 저장하지 못했어요. 아래 파일 받기로 기록을 보관해 주세요."); }
  }
  function download() {
    setError("");
    try {
      const blob = new Blob([exportPracticeWorkbook(lesson, draft)], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${lesson.slug}-workbook.md`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("다운로드를 요청했어요. 브라우저의 다운로드 목록에서 파일을 확인해 주세요.");
    } catch { setNotice(""); setError("파일을 만들지 못했어요. 작성한 내용을 복사해 보관해 주세요."); }
  }
  return <>
    <div className="space-y-5">{lesson.worksheet.map((field, index) => <div key={field.id}>
      <label htmlFor={`work-${field.id}`} className="block text-sm font-semibold text-slate-900">{index + 1}. {field.label}</label>
      <p id={`help-${field.id}`} className="mt-1 text-sm leading-7 text-slate-600">{field.prompt}</p>
      <textarea id={`work-${field.id}`} aria-describedby={`help-${field.id}`} value={draft.answers[field.id] ?? ""} maxLength={4000} rows={4} onChange={(event) => {
        const text = event.target.value; setDraft((current) => ({ ...current, answers: { ...current.answers, [field.id]: text } })); setDirty(true); setNotice("");
      }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-7 outline-none focus-visible:ring-2 focus-visible:ring-teal-600"/>
      <details className="mt-1 text-sm"><summary className="min-h-11 cursor-pointer py-2.5 text-teal-800 focus-visible:ring-2 focus-visible:ring-teal-600">막히면 예시와 비교하기</summary><p className="rounded-xl bg-teal-50 p-4 leading-7 text-slate-700">{field.example}</p></details>
    </div>)}</div>
    <fieldset className="mt-6 rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">내 결과물을 확인해요</legend><div className="space-y-1">{lesson.rubric.map((criterion, i) => <label key={criterion} className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-6 text-slate-700"><input type="checkbox" checked={draft.checked.includes(i)} onChange={(event) => {
      const checked = event.target.checked; setDraft((current) => ({ ...current, checked: checked ? [...new Set([...current.checked, i])] : current.checked.filter((n) => n !== i) })); setDirty(true); setNotice("");
    }} className="mt-1 size-4 shrink-0 accent-teal-700"/>{criterion}</label>)}</div></fieldset>
    <div className="mt-5 flex flex-wrap gap-2"><Button className="min-h-11 gap-2 bg-teal-700 hover:bg-teal-800" onClick={save}><Save className="size-4"/>이 브라우저에 저장</Button><Button variant="secondary" className="min-h-11 gap-2" onClick={download}><Download className="size-4"/>내 결과물 파일 받기</Button></div>
    <p role="status" className="mt-3 text-xs leading-6 text-slate-600">{dirty ? "아직 저장하지 않은 변경이 있어요. 나가기 전에 저장하거나 파일로 받아 주세요." : notice || "저장 버튼을 누르면 이 브라우저에 보관해요. 로그인 계정·다른 기기와는 동기화되지 않아요."}</p>
    {error ? <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p> : null}
  </>;
}

export function PracticeWorkbench({ lesson }: { lesson: PracticeCase }) {
  const mounted = useSyncExternalStore(noSubscription, clientSnapshot, serverSnapshot);
  return <div className="space-y-10">
    <section aria-labelledby="practice-decisions"><h2 id="practice-decisions" className="mb-5 flex items-center gap-2 text-lg font-bold"><Lightbulb className="size-5 text-amber-600"/>자료를 보고 판단해요</h2><p className="mb-6 text-sm leading-7 text-slate-600">선택한 이유를 먼저 생각하고 해설과 비교해 보세요. 이 연습은 성적이나 계정의 완료 기록에 반영되지 않아요.</p><div className="space-y-6">{lesson.decisions.map((decision, i) => <PracticeDecision key={decision.question} decision={decision} index={i}/>)}</div></section>
    <section aria-labelledby="practice-workbook" className="rounded-2xl border border-teal-200 bg-teal-50/30 p-4 sm:p-6"><h2 id="practice-workbook" className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 className="size-5 text-teal-700"/>이제 나의 결과물을 만들어요</h2><p className="mb-6 mt-2 text-sm leading-7 text-slate-600">위 가상 자료만으로 작성해 보세요. 예시를 그대로 옮기기 전에 자기 말로 이유를 설명하면 더 잘 기억나요.</p>{mounted ? <WorkbookForm key={lesson.slug} lesson={lesson}/> : <p className="text-sm text-slate-500">작성 양식을 준비하고 있어요.</p>}</section>
  </div>;
}
