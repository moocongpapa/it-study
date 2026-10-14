"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode, isValidElement } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowUp, Bot, Check, Copy, MessageCircle, Sparkles, Square, UserRound } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Topic } from "@/types/roadmap";

interface TutorMessage { role: "user" | "assistant"; content: string }

const suggestions = [
  "실무에서 이 구조를 쓰다 문제가 생긴 사례는?",
  "면접에서 물어보면 어떻게 1분 요약하죠?",
  "제가 이해한 흐름을 점검해 주세요.",
];

function plainText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(plainText).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) return plainText(children.props.children);
  return "";
}

function TutorCode({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(plainText(children).replace(/\n$/, ""));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return <div className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex justify-end border-b border-slate-200 px-2 py-1"><button type="button" onClick={copy} aria-label="튜터 코드 복사" className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-slate-500 hover:text-slate-900">{copied ? <Check className="size-3" /> : <Copy className="size-3" />}{copied ? "복사됨" : "복사"}</button></div>
    <pre className="overflow-x-auto p-3 text-[11px] leading-5">{children}</pre>
  </div>;
}

export function AiTutorDrawer({ open, onOpenChange, topic, level, articleContext }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: Topic;
  level: number;
  articleContext: string;
}) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [messages]);
  useEffect(() => () => controller.current?.abort(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    const conversation: TutorMessage[] = [...messages.filter((item) => item.content.trim()), { role: "user" as const, content }].slice(-12);
    setMessages([...conversation, { role: "assistant", content: "" }]);
    setDraft("");
    setError(null);
    setStreaming(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const response = await fetch("/api/chat/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation,
          topicSlug: topic.slug,
          currentTopicTitle: topic.title,
          currentLevel: level,
          articleContext: articleContext.slice(0, 1600),
        }),
        signal: abort.signal,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "튜터 응답을 받지 못했습니다.");
      }
      if (!response.body) throw new Error("스트리밍 응답이 없습니다.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...conversation, { role: "assistant", content: reply }]);
      }
      reply += decoder.decode();
      if (!reply.trim()) throw new Error("빈 응답이 도착했습니다. 잠시 후 다시 질문해 주세요.");
      setMessages([...conversation, { role: "assistant", content: reply }]);
    } catch (cause) {
      if (abort.signal.aborted) return;
      setMessages(conversation);
      setError(cause instanceof Error ? cause.message : "튜터 연결에 실패했습니다.");
    } finally { setStreaming(false); controller.current = null; }
  }

  function stop() {
    controller.current?.abort();
    setMessages((current) => current.at(-1)?.role === "assistant" && !current.at(-1)?.content
      ? current.slice(0, -1) : current);
    setStreaming(false);
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void send(draft); }

  return <Sheet open={open} onOpenChange={(value) => { if (!value) stop(); onOpenChange(value); }}>
    <SheetContent className="max-w-[540px]">
      <div className="shrink-0 border-b border-slate-200 px-5 pb-5 pt-7 sm:px-7">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[.16em] text-blue-700"><Bot className="size-4" /> SOCRATIC TUTOR · LEVEL {level}</div>
        <SheetTitle className="text-xl font-bold text-slate-900">생각을 한 단계 더</SheetTitle>
        <SheetDescription className="mt-1.5 text-xs leading-5 text-slate-500">{topic.title} · 바로 답을 주기보다, 스스로 원리를 찾도록 질문합니다.</SheetDescription>
        {articleContext ? <div className="mt-4 rounded-lg border-l-2 border-blue-600 bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500 line-clamp-3">선택한 맥락: {articleContext.slice(0, 240)}</div> : null}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7" aria-live="polite">
        {!messages.length ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-5"><Sparkles className="mb-3 size-5 text-blue-700" /><p className="text-sm font-bold text-slate-900">어디서 막혔나요?</p><p className="mt-2 text-xs leading-6 text-slate-500">개념을 자신의 말로 설명해 보세요. 필요한 단서부터 함께 찾아갑니다.</p><div className="mt-5 flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} type="button" onClick={() => void send(item)} className="rounded-full border border-blue-200 bg-white px-3 py-2 text-left text-[11px] text-blue-700 hover:bg-blue-50">{item}</button>)}</div></div> : null}
        {messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          {message.role === "assistant" ? <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Bot className="size-4" /></span> : null}
          <div className={`max-w-[88%] rounded-xl px-4 py-3 text-xs leading-6 ${message.role === "user" ? "bg-blue-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"}`}>
            {message.role === "assistant" ? message.content ? <div className="reader-prose prose prose-invert prose-sm max-w-none prose-p:my-2 prose-p:text-slate-800 prose-li:text-slate-800"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: ({ children }) => <TutorCode>{children}</TutorCode> }}>{message.content}</ReactMarkdown></div> : <span className="animate-pulse text-slate-500">생각을 정리하고 있어요...</span> : message.content}
          </div>
          {message.role === "user" ? <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><UserRound className="size-4" /></span> : null}
        </div>)}
        <div ref={bottom} />
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-5 sm:px-7">
        {error ? <p role="alert" className="mb-3 text-xs leading-5 text-rose-700">{error} {error.includes("로그인") ? <Link href="/login" className="underline font-semibold">로그인하기</Link> : null}</p> : null}

        {/* Quick Suggestion Chips */}
        {!streaming && (
          <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="shrink-0 text-slate-500 font-semibold">추천:</span>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void send(item)}
                className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="flex items-end gap-2">
          <label className="flex-1">
            <span className="sr-only">튜터에게 질문</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              maxLength={2500}
              rows={2}
              placeholder="이 부분을 제 말로 설명하면..."
              className="min-h-12 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs leading-5 text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-200 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="응답 중단"
              className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-900 transition hover:bg-rose-50 hover:text-rose-700"
            >
              <Square className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="질문 보내기"
              className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              <ArrowUp className="size-5" />
            </button>
          )}
        </form>
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><MessageCircle className="size-3" /> 소크라테스식 학습 코칭</span>
          <span><kbd className="text-[9px]">Enter</kbd> 전송 · <kbd className="text-[9px]">Shift+Enter</kbd> 줄바꿈</span>
        </div>
      </div>
    </SheetContent>
  </Sheet>;
}
