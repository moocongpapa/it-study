"use client";

import { useEffect, useState, type ReactNode, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  ArrowRight, BookOpen, Check, CheckCheck, Clock3, Copy, LockKeyhole,
  Sparkles, Trophy, Bot, Type,
} from "lucide-react";
import { QuizSession } from "@/components/quiz/QuizSession";
import { AiTutorDrawer } from "@/components/tutor/AiTutorDrawer";
import { MermaidRenderer } from "@/components/reader/MermaidRenderer";
import { InteractivePlayground } from "@/components/widgets/InteractivePlayground";
import { annotateGlossaryTerms } from "@/lib/render-glossary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Article, Topic, TopicProgressResult, TopicStatus } from "@/types/roadmap";

const levels = [
  { value: "1", short: "멘탈 모델", title: "Level 1 · 멘탈 모델 & 비유", description: "일상적 비유로 개념이 필요한 이유를 먼저 이해합니다.", field: "level_1_mental_model" },
  { value: "2", short: "코어 원리", title: "Level 2 · 코어 엔지니어링", description: "메모리·CPU·네트워크 흐름과 코드로 내부 원리를 추적합니다.", field: "level_2_core_engineering" },
  { value: "3", short: "실전 문제", title: "Level 3 · 실무 트러블슈팅", description: "병목과 동시성 문제를 재현하고 디버깅하는 방법을 봅니다.", field: "level_3_troubleshooting" },
  { value: "4", short: "설계 선택", title: "Level 4 · 아키텍처 트레이드오프", description: "규모와 실패 조건에 따라 설계 대안을 비교합니다.", field: "level_4_architecture_tradeoffs" },
] as const;

function plainText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(plainText).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) return plainText(children.props.children);
  return "";
}

function renderWithGlossary(children: ReactNode): ReactNode {
  if (typeof children === "string") {
    return annotateGlossaryTerms(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <span key={index}>{renderWithGlossary(child)}</span>
    ));
  }
  return children;
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = plainText(children).replace(/\n$/, "");
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="group my-5 overflow-hidden rounded-xl border border-white/10 bg-[#07121e]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">
        <span>CODE EXAMPLE</span>
        <button type="button" onClick={copy} className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-400 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" aria-label="코드 복사">
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}{copied ? "복사됨" : "복사"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-slate-200">{children}</pre>
    </div>
  );
}

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

export function ArticleReaderSheet({
  open, onOpenChange, topic, status, prerequisites, completedIds, nextTopic,
  onComplete, onNext, saving, saveError, isDemo,
  onQuizProgress,
}: ArticleReaderSheetProps) {
  const [level, setLevel] = useState("1");
  const [result, setResult] = useState<{ article: Article | null; error: string | null } | null>(null);
  const [selfAssessment, setSelfAssessment] = useState(4);
  const [quizBacked, setQuizBacked] = useState<boolean | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [isLargeFont, setIsLargeFont] = useState(false);

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
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({ article: null, error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." });
      });
    return () => controller.abort();
  }, [open, topic]);

  const active = levels.find((item) => item.value === level) ?? levels[0];
  const body = result?.article?.[active.field] ?? null;
  const missing = prerequisites.filter((item) => !completedIds.has(item.id));
  const isCompleted = status === "completed";
  const isLocked = status === "locked";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-[650px]">
        {topic ? (
          <>
            <div className="shrink-0 border-b border-white/8 px-5 pb-5 pt-7 sm:px-8">
              <div className="mb-4 flex items-center gap-2">
                <Badge className="border-cyan-400/25 bg-cyan-400/10 text-cyan-200">LEARNING NODE</Badge>
                <span className="text-xs text-slate-500">·</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><Clock3 className="size-3" /> {topic.estimated_minutes}분</span>
              </div>
              <SheetTitle className="max-w-[90%] text-2xl font-black tracking-[-.03em] text-white sm:text-[29px]">{topic.title}</SheetTitle>
              <SheetDescription className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{topic.summary}</SheetDescription>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                {isCompleted ? <Badge className="border-emerald-400/25 bg-emerald-400/10 text-emerald-300"><Check className="mr-1 size-3" /> 완료한 토픽</Badge> : isLocked ? <Badge className="border-amber-400/25 bg-amber-400/10 text-amber-300"><LockKeyhole className="mr-1 size-3" /> 선수 토픽 {missing.length}개 필요</Badge> : <Badge className="border-cyan-400/25 bg-cyan-400/10 text-cyan-200"><Sparkles className="mr-1 size-3" /> 지금 학습 가능</Badge>}
                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLargeFont((prev) => !prev)}
                    className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                    title={isLargeFont ? "기본 글자 크기로 변경" : "큰 글자 크기로 변경"}
                  >
                    <Type className="size-3.5" />
                    <span>{isLargeFont ? "A-" : "A+"}</span>
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setSelectedText(""); setTutorOpen(true); }} className="h-8 gap-1.5"><Bot className="size-3.5" /> AI 튜터</Button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-9 pt-6 sm:px-8">
              {prerequisites.length ? (
                <div className="mb-7 rounded-xl border border-white/8 bg-white/3 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-300"><LayersIcon /> 먼저 알면 좋은 개념</p>
                  <div className="flex flex-wrap gap-1.5">
                    {prerequisites.map((item) => (
                      <span key={item.id} className={`rounded-md border px-2 py-1 text-[11px] ${completedIds.has(item.id) ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300" : "border-white/10 bg-white/5 text-slate-400"}`}>
                        {completedIds.has(item.id) ? "✓ " : "○ "}{item.title}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mb-6">
                <InteractivePlayground topicSlug={topic.slug} />
              </div>

              <Tabs value={level} onValueChange={(value) => { setLevel(value); setSelectedText(""); }}>
                <TabsList className="mb-6 w-full overflow-x-auto">
                  {levels.map((item) => <TabsTrigger key={item.value} value={item.value} className="min-w-[112px] flex-1 whitespace-nowrap"><span className="mr-1.5 text-cyan-300/80">0{item.value}</span>{item.short}</TabsTrigger>)}
                </TabsList>
                {levels.map((item) => (
                  <TabsContent key={item.value} value={item.value} className="outline-none">
                    <div className="mb-5 border-l-2 border-cyan-400 pl-4">
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                    </div>
                    {!result ? (
                      <div className="space-y-3 py-6" aria-label="아티클 불러오는 중"><div className="h-4 w-3/4 animate-pulse rounded bg-white/8" /><div className="h-4 w-full animate-pulse rounded bg-white/8" /><div className="h-4 w-2/3 animate-pulse rounded bg-white/8" /></div>
                    ) : result.error ? (
                      <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200">{result.error}</div>
                    ) : body ? (
                      <div>
                        <div
                          className={`reader-prose prose prose-invert max-w-none transition-all prose-headings:tracking-tight prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-th:text-slate-200 prose-td:text-slate-300 ${
                            isLargeFont ? "prose-lg prose-p:leading-9" : "prose-base prose-p:leading-8"
                          }`}
                          onMouseUp={() => {
                            const value = window.getSelection()?.toString().trim() ?? "";
                            if (value.length >= 3) setSelectedText(value.slice(0, 1600));
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              p: ({ children }) => <p>{renderWithGlossary(children)}</p>,
                              li: ({ children }) => <li>{renderWithGlossary(children)}</li>,
                              pre: ({ children }) => {
                                if (
                                  isValidElement<{ className?: string }>(children) &&
                                  typeof children.props?.className === "string" &&
                                  children.props.className.includes("language-mermaid")
                                ) {
                                  return <>{children}</>;
                                }
                                return <CodeBlock>{children}</CodeBlock>;
                              },
                              code: ({ className, children, ...props }) => {
                                const isMermaid = typeof className === "string" && className.includes("language-mermaid");
                                if (isMermaid) {
                                  const chart = plainText(children).trim();
                                  return <MermaidRenderer chart={chart} />;
                                }
                                return (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer">
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {body}
                          </ReactMarkdown>
                        </div>
                        {Number(level) < 4 ? (
                          <div className="mt-8 flex justify-end border-t border-white/8 pt-4">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const nextLevel = String(Number(level) + 1);
                                setLevel(nextLevel);
                                setSelectedText("");
                              }}
                              className="gap-1.5"
                            >
                              <span>Level 0{Number(level) + 1} ({levels[Number(level)]?.short}) 읽기</span>
                              <ArrowRight className="size-3.5" />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-6 text-center">
                        <BookOpen className="mx-auto size-7 text-cyan-300/70" />
                        <h4 className="mt-3 text-sm font-bold text-slate-200">이 레벨의 아티클을 준비하고 있어요</h4>
                        <p className="mt-2 text-xs leading-6 text-slate-400">현재는 개념 지도가 먼저 열려 있습니다. 이미 아는 내용이라면 아래에서 이해도를 스스로 기록할 수 있어요.</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
              {selectedText ? <div className="mt-5 flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/6 p-3"><p className="min-w-0 flex-1 truncate text-xs text-slate-300">“{selectedText}”</p><Button size="sm" variant="secondary" onClick={() => setTutorOpen(true)}><Bot className="size-3.5" /> 이 문장 질문하기</Button></div> : null}
              <QuizSession key={`${topic.id}:${level}`} topic={topic} level={Number(level) as 1 | 2 | 3 | 4} locked={isLocked} isDemo={isDemo} onAvailability={setQuizBacked} onProgressUpdate={(progress) => onQuizProgress(topic, progress)} />
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#0c1723] px-5 py-4 sm:px-8">
              <div className="mb-4 flex items-center gap-3"><span className="whitespace-nowrap text-[11px] text-slate-400">읽기 단계 {level}/4</span><Progress value={(Number(level) / 4) * 100} /><span className="text-[11px] text-cyan-300">{Math.round(Number(level) / 4 * 100)}%</span></div>
              {isLocked ? <p className="mb-3 text-xs text-amber-300">완료 표시를 하려면 위의 선수 토픽을 먼저 완료해 주세요. 읽기는 언제든 가능합니다.</p> : null}
              {!isCompleted && !isLocked && quizBacked === false ? (
                <div className="mb-3 flex items-center gap-2">
                  <label htmlFor="understanding" className="whitespace-nowrap text-[11px] text-slate-400">내 이해도</label>
                  <select id="understanding" value={selfAssessment} onChange={(event) => setSelfAssessment(Number(event.target.value))} className="h-8 rounded-lg border border-white/10 bg-[#182a3a] px-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-cyan-400">
                    <option value={1}>1 · 다시 보기</option><option value={2}>2 · 조금 이해</option><option value={3}>3 · 기본 이해</option><option value={4}>4 · 잘 이해</option><option value={5}>5 · 설명 가능</option>
                  </select>
                  {isDemo ? <span className="ml-auto text-[10px] text-slate-500">이 브라우저에 저장</span> : null}
                </div>
              ) : null}
              {saveError ? <p role="alert" className="mb-2 text-xs text-rose-300">{saveError}</p> : null}
              <div className="flex flex-wrap gap-2">
                {quizBacked === null ? <Button variant="secondary" disabled>퀴즈 확인 중...</Button>
                  : quizBacked ? isCompleted ? <Button variant="secondary" disabled><Trophy className="size-4 text-amber-300" /> Node Mastered</Button> : <span className="self-center text-xs text-cyan-200">4개 레벨의 퀴즈를 통과하면 노드가 완료됩니다.</span>
                  : isCompleted ? <Button variant="secondary" disabled><CheckCheck className="size-4 text-emerald-300" /> 이해도 완료</Button>
                  : <Button onClick={() => onComplete(topic, selfAssessment)} disabled={isLocked || saving}><Check className="size-4" /> {saving ? "저장 중..." : "이해도 완료 체크"}</Button>}
                {nextTopic && isCompleted ? <Button variant="ghost" onClick={() => onNext(nextTopic)} className="ml-auto">다음 학습: {nextTopic.title}<ArrowRight className="size-4" /></Button> : null}
              </div>
            </div>
            <AiTutorDrawer key={`${topic.id}:${level}`} open={tutorOpen} onOpenChange={setTutorOpen} topic={topic} level={Number(level)} articleContext={selectedText} />
          </>
        ) : (
          <><SheetTitle className="sr-only">아티클 리더</SheetTitle><SheetDescription className="sr-only">토픽을 선택하세요.</SheetDescription></>
        )}
      </SheetContent>
    </Sheet>
  );
}

function LayersIcon() {
  return <span aria-hidden="true" className="text-cyan-300">✦</span>;
}
