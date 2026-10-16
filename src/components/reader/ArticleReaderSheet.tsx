"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Bot, CheckCheck, ChevronDown, Clock3, Trophy, X } from "lucide-react";
import { ArticleMarkdown } from "@/components/reader/ArticleMarkdown";
import { QuizSession } from "@/components/quiz/QuizSession";
import { AiTutorDrawer } from "@/components/tutor/AiTutorDrawer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Article, Topic, TopicProgressResult, TopicStatus } from "@/types/roadmap";

const levels = [
  { value: "1", short: "그림 수업", title: "비유로 이해하기", description: "필요한 이유와 일상 비유를 읽고 작은 예로 확인합니다.", field: "level_1_mental_model" },
  { value: "2", short: "원리 실험", title: "작동 원리 따라가기", description: "용어 풀이와 길잡이를 읽고 예제의 입력과 결과를 따라갑니다.", field: "level_2_core_engineering" },
  { value: "3", short: "문제 탐정", title: "문제 원인 찾기", description: "증상을 살펴보고 원인 확인과 해결 순서를 배웁니다.", field: "level_3_troubleshooting" },
  { value: "4", short: "선택 연습", title: "설계 선택 비교하기", description: "각 방법의 이득과 부담을 비교해 상황에 맞는 선택을 생각합니다.", field: "level_4_architecture_tradeoffs" },
] as const;

interface ArticleReaderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: Topic | null;
  status: TopicStatus;
  prerequisites: Topic[];
  completedIds: Set<string>;
  nextTopic: Topic | null;
  onComplete: (topic: Topic, selfAssessment: number) => Promise<void>;
  onQuizProgress: (topic: Topic, progress: TopicProgressResult) => void;
  onNext: (topic: Topic) => void;
  saving: boolean;
  saveError: string | null;
  isDemo: boolean;
}

export function ArticleReaderSheet({ open, onOpenChange, topic, status, prerequisites, completedIds, nextTopic, onComplete, onNext, saving, saveError, isDemo, onQuizProgress }: ArticleReaderSheetProps) {
  const [level, setLevel] = useState("1");
  const [result, setResult] = useState<{ article: Article | null; error: string | null } | null>(null);
  const [selfAssessment, setSelfAssessment] = useState(4);
  const [quizBacked, setQuizBacked] = useState<boolean | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [isLargeFont, setIsLargeFont] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  const understandingId = useId();

  useEffect(() => {
    if (!open || !topic) return;
    const controller = new AbortController();
    fetch(`/api/articles/${encodeURIComponent(topic.slug)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("아티클을 불러오지 못했습니다.");
        return response.json() as Promise<{ article: Article | null }>;
      })
      .then((data) => setResult({ article: data.article, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ article: null, error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." });
      });
    return () => controller.abort();
  }, [open, topic]);

  function changeLevel(value: string) {
    if (value === level) return;
    setLevel(value);
    setSelectedText("");
    setQuizBacked(null);
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }

  function navigateLevel(value: string) {
    changeLevel(value);
    tabsRef.current?.querySelector<HTMLButtonElement>(`[data-level="${value}"]`)?.focus({ preventScroll: true });
  }

  function jumpToQuiz() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    quizRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "instant" : "smooth" });
    quizRef.current?.focus({ preventScroll: true });
  }

  const active = levels.find((item) => item.value === level) ?? levels[0];
  const body = result?.article?.[active.field] ?? null;
  const missing = prerequisites.filter((item) => !completedIds.has(item.id));
  const isCompleted = status === "completed";
  const isLocked = status === "locked";

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="max-w-[720px]" showCloseButton={false}>
      {topic ? <>
        <header data-testid="reader-toolbar" className="flex min-h-14 shrink-0 items-center gap-1 border-b border-slate-200 px-3">
          <SheetTitle className="sr-only">{topic.title}</SheetTitle>
          <SheetDescription className="sr-only">4단계로 읽고 퀴즈로 확인하는 학습 글. {topic.summary}</SheetDescription>
          <span aria-hidden="true" className="min-w-0 flex-1 truncate pl-1 text-sm font-semibold text-slate-800">{topic.title}</span>
          <Button variant="ghost" size="icon" className="size-11 shrink-0 text-sm" aria-label={isLargeFont ? "기본 글씨로 읽기" : "큰 글씨로 읽기"} aria-pressed={isLargeFont} title={isLargeFont ? "기본 글씨" : "큰 글씨"} onClick={() => setIsLargeFont((value) => !value)}>A{isLargeFont ? "−" : "+"}</Button>
          <Button variant="ghost" className="h-11 shrink-0 gap-1 px-2 text-xs sm:px-3" aria-label="AI 튜터 열기" onClick={() => { setSelectedText(""); setTutorOpen(true); }}><Bot className="size-4" /><span className="sm:hidden">AI</span><span className="hidden sm:inline">AI 튜터</span></Button>
          <SheetClose asChild><Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label="학습 글 닫기"><X className="size-5" /></Button></SheetClose>
        </header>

        <Tabs value={level} onValueChange={changeLevel} className="flex min-h-0 flex-1 flex-col">
          <TabsList ref={tabsRef} aria-label="학습 단계" className="grid shrink-0 grid-cols-4 gap-0 rounded-none border-b border-slate-200 bg-white px-2 py-1">
            {levels.map((item) => <TabsTrigger key={item.value} value={item.value} data-level={item.value} className="flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-md px-1 py-2 text-[13px] font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"><span className="text-[10px] opacity-70">{item.value}</span>{item.short}</TabsTrigger>)}
          </TabsList>

          <div ref={scrollRef} data-testid="reader-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fffefa] px-4 pb-6 pt-3 [overflow-anchor:none] sm:px-8 sm:pt-4">
            <div className="mb-4 flex items-start gap-2">
            <details className="group min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden"><BookOpen className="size-3.5 shrink-0" /><span className="flex-1">수업 안내{prerequisites.length ? " · 먼저 알면 좋은 개념" : ""}</span><ChevronDown className="size-3.5 shrink-0 transition-transform group-open:rotate-180" /></summary>
              <div className="border-t border-slate-200 px-3 pb-3 pt-2 leading-6">
                <p className="mb-2 inline-flex items-center gap-1 text-slate-500"><Clock3 className="size-3.5"/>전체 학습 약 {topic.estimated_minutes}분{isCompleted ? " · 학습 완료" : ""}</p>
                <p>처음이라면 그림 수업부터 시작해요. 한 번에 다 읽지 않아도 괜찮아요. {active.description}</p>
                {prerequisites.length ? <>
                  <p className="mt-2 font-medium">먼저 알면 좋은 개념</p>
                  <ul className="mt-1 space-y-1">{prerequisites.map((item) => <li key={item.id}><button type="button" onClick={() => onNext(item)} className="flex min-h-11 w-full items-center gap-2 rounded px-2 text-left hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className={completedIds.has(item.id) ? "text-emerald-700" : "text-slate-400"}>{completedIds.has(item.id) ? "✓" : "○"}</span><span className="flex-1">{item.title}</span><ArrowRight className="size-3.5 shrink-0" /></button></li>)}</ul>
                  {isLocked ? <p className="mt-2 text-amber-800">읽기는 자유롭게 할 수 있습니다. 퀴즈 제출은 먼저 알면 좋은 개념 {missing.length}개를 완료한 뒤 열립니다.</p> : null}
                </> : null}
              </div>
            </details>
              <button type="button" className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-teal-800 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600" onClick={jumpToQuiz}>퀴즈<ArrowDown className="size-3.5"/></button>
            </div>

            {levels.map((item) => <TabsContent key={item.value} value={item.value} className="outline-none">
              <h3 className="sr-only">{item.value}단계 · {item.title}</h3>
              {!result ? <div role="status" className="space-y-3 py-6" aria-label="아티클 불러오는 중"><div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" /><div className="h-4 w-full animate-pulse rounded bg-slate-100" /><div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" /></div>
                : result.error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{result.error}</p>
                : body ? <ArticleMarkdown body={body} referenceTitle={level === "2" ? "코드·템플릿과 원리 더 살펴보기" : level === "3" ? "장애 사례와 해결 방법 더 살펴보기" : "상세 비교표와 출처 살펴보기"} largeFont={isLargeFont} onSelectText={setSelectedText} />
                : <div className="rounded-xl border border-dashed border-slate-200 p-5 text-sm leading-7 text-slate-600"><BookOpen className="mb-2 size-5" /><h4 className="font-semibold text-slate-900">이 단계의 글을 준비하고 있어요</h4><p>다른 단계를 읽거나 이미 아는 내용의 이해도를 아래에 기록해 보세요.</p></div>}
            </TabsContent>)}

            {selectedText ? <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3"><p className="line-clamp-2 text-xs leading-6 text-slate-600">“{selectedText}”</p><Button className="mt-2 h-11 gap-1.5" size="sm" variant="secondary" onClick={() => setTutorOpen(true)}><Bot className="size-4" />이 문장 질문하기</Button></div> : null}

            <div ref={quizRef} tabIndex={-1} aria-label="퀴즈 영역" className="scroll-mt-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <QuizSession key={`${topic.id}:${level}`} topic={topic} level={Number(level) as 1 | 2 | 3 | 4} locked={isLocked} isDemo={isDemo} onAvailability={setQuizBacked} onProgressUpdate={(progress) => onQuizProgress(topic, progress)} />
            </div>

            <section aria-label="학습 마무리" className="mt-6 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">
              {saveError ? <p role="alert" className="mb-3 text-rose-700">{saveError}</p> : null}
              {quizBacked === null ? <p role="status" className="text-xs text-slate-500">퀴즈 정보를 확인하고 있습니다.</p>
                : isCompleted ? <p className="flex items-center gap-2 font-medium text-emerald-700"><Trophy className="size-4" />이 주제의 학습을 완료했습니다.</p>
                : quizBacked ? <p className="text-xs">그림과 예제를 충분히 살펴본 뒤 퀴즈로 확인해 보세요. 네 단계의 퀴즈를 통과하면 완료로 기록돼요.</p>
                : <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor={understandingId} className="text-xs">내 이해도</label>
                  <select id={understandingId} value={selfAssessment} onChange={(event) => setSelfAssessment(Number(event.target.value))} className="h-11 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-base text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm"><option value={1}>1 · 다시 보기</option><option value={2}>2 · 조금 이해</option><option value={3}>3 · 기본 이해</option><option value={4}>4 · 잘 이해</option><option value={5}>5 · 설명 가능</option></select>
                  <Button className="h-11" onClick={() => onComplete(topic, selfAssessment)} disabled={isLocked || saving}><CheckCheck className="size-4" />{saving ? "저장 중..." : "이해도 기록"}</Button>
                  {isLocked ? <p className="w-full text-xs text-amber-800">먼저 알면 좋은 개념을 완료하면 기록할 수 있습니다.</p> : isDemo ? <p className="w-full text-xs text-slate-500">이 브라우저에 저장됩니다.</p> : null}
                </div>}
              {nextTopic && isCompleted ? <Button variant="secondary" onClick={() => onNext(nextTopic)} className="mt-3 h-auto min-h-11 w-full justify-between whitespace-normal py-3 text-left"><span>다음 주제 · {nextTopic.title}</span><ArrowRight className="size-4 shrink-0" /></Button> : null}
            </section>

            <nav aria-label="단계 이동" className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              {Number(level) > 1 ? <Button variant="ghost" className="h-11 gap-1.5 px-2" onClick={() => navigateLevel(String(Number(level) - 1))}><ArrowLeft className="size-4" />이전 단계</Button> : <span />}
              {Number(level) < 4 ? <Button variant="secondary" className="h-11 gap-1.5" onClick={() => navigateLevel(String(Number(level) + 1))}>{Number(level) + 1}단계 · {levels[Number(level)]?.short}<ArrowRight className="size-4" /></Button> : <Button variant="ghost" className="h-11" onClick={() => { scrollRef.current?.scrollTo({ top: 0, behavior: "instant" }); tabsRef.current?.querySelector<HTMLButtonElement>('[data-state="active"]')?.focus({ preventScroll: true }); }}>본문 맨 위로</Button>}
            </nav>
          </div>
        </Tabs>
        <AiTutorDrawer key={`${topic.id}:${level}`} open={tutorOpen} onOpenChange={setTutorOpen} topic={topic} level={Number(level)} articleContext={selectedText} />
      </> : <><SheetTitle className="sr-only">아티클 리더</SheetTitle><SheetDescription className="sr-only">주제를 선택하세요.</SheetDescription></>}
    </SheetContent>
  </Sheet>;
}
