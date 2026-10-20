"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode, isValidElement } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowUp, Bot, Check, Copy, Sparkles, Square, UserRound, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Topic } from "@/types/roadmap";

interface TutorMessage { role: "user" | "assistant"; content: string }

const suggestions = [
  "학교생활에 빗대어 쉽게 설명해 주세요.",
  "작은 예를 하나씩 같이 풀어볼까요?",
  "제가 설명해 볼게요. 이해한 게 맞는지 봐주세요.",
];

function plainText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(plainText).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) return plainText(children.props.children);
  return "";
}

function TutorCode({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(plainText(children).replace(/\n$/, ""));
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { setCopyError(true); }
  }
  return <div className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex justify-end border-b border-slate-200 px-2"><button type="button" onClick={copy} aria-label="튜터 코드 복사" className="flex min-h-11 items-center gap-1 rounded px-2 text-xs text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{copied ? <Check className="size-3" /> : <Copy className="size-3" />}{copied ? "복사됨" : "복사"}</button></div>
    <pre className="overflow-x-auto p-3 text-[13px] leading-6">{children}</pre>
    {copyError ? <p role="status" className="px-3 pb-3 text-xs text-rose-700">복사 권한이 없습니다. 코드를 직접 선택해 복사해 주세요.</p> : null}
  </div>;
}

export function AiTutorDrawer({ open, onOpenChange, topic, level, articleContext, requiresLogin }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: Topic;
  level: number;
  articleContext: string;
  requiresLogin: boolean;
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
    if (!content || streaming || requiresLogin) return;
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
    <SheetContent className="max-w-[540px]" showCloseButton={false}>
      <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-4">
        <Bot className="size-4 shrink-0 text-blue-700" />
        <SheetTitle className="min-w-0 flex-1 text-sm font-semibold text-slate-900">AI 튜터 <span className="ml-1 font-normal text-slate-500">· {level}단계</span></SheetTitle>
        <SheetDescription className="sr-only">정답을 바로 알려주기보다 질문으로 생각을 돕는 학습 튜터</SheetDescription>
        <SheetClose asChild><button type="button" className="grid size-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="튜터 닫기"><X className="size-5" /></button></SheetClose>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6" role="log" aria-label="튜터 대화" aria-live="polite">
        <p className="text-xs leading-6 text-slate-500">{topic.title}</p>
        {articleContext ? <details className="rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600"><summary className="min-h-11 cursor-pointer px-3 py-3">선택한 문장 보기</summary><p className="border-t border-slate-200 px-3 py-2 leading-6">{articleContext}</p></details> : null}
        {requiresLogin ? <div className="rounded-xl bg-blue-50 p-4"><p className="font-semibold text-slate-900">로그인하고 튜터와 대화해 보세요</p><p className="mt-2 text-sm leading-6 text-slate-600">그림 수업과 실무 연습은 로그인 없이 이용할 수 있어요. AI 튜터는 로그인이 필요합니다.</p><Link href={`/login?next=${encodeURIComponent(`/roadmap?topic=${topic.slug}`)}`} className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">로그인하기</Link></div> : null}
        {!requiresLogin && !messages.length ? <div className="rounded-xl bg-blue-50 p-4"><Sparkles className="mb-2 size-5 text-blue-700" /><p className="text-base font-semibold text-slate-900">어디서 막혔나요?</p><p className="mt-2 text-sm leading-7 text-slate-600">이해한 내용을 자신의 말로 설명해 보세요. 필요한 단서부터 함께 찾아갑니다.</p><div className="mt-3 space-y-2">{suggestions.map((item) => <button key={item} type="button" onClick={() => void send(item)} className="block min-h-11 w-full rounded-lg border border-blue-100 bg-white px-3 py-2.5 text-left text-xs leading-5 text-blue-700 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{item}</button>)}</div></div> : null}
        {messages.map((message, index) => <div key={index} className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          {message.role === "assistant" ? <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Bot className="size-4" /></span> : null}
          <div className={`min-w-0 max-w-[88%] rounded-xl px-3 py-3 text-sm leading-7 ${message.role === "user" ? "bg-blue-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"}`}>
            {message.role === "assistant" ? message.content ? <div className="reader-prose prose prose-sm max-w-none break-words prose-p:my-2 prose-p:text-slate-800 prose-li:text-slate-800"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: ({ children }) => <TutorCode>{children}</TutorCode> }}>{message.content}</ReactMarkdown></div> : <span className="animate-pulse text-slate-500">생각을 정리하고 있어요...</span> : message.content}
          </div>
          {message.role === "user" ? <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><UserRound className="size-4" /></span> : null}
        </div>)}
        <div ref={bottom} />
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
        {error ? <p role="alert" className="mb-2 text-xs leading-5 text-rose-700">{error} {error.includes("로그인") ? <Link href="/login" className="font-semibold underline">로그인하기</Link> : null}</p> : null}
        {!requiresLogin ? <form onSubmit={submit} className="flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">튜터에게 질문</span>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
              if (event.nativeEvent.isComposing || event.keyCode === 229) return;
              if (event.key === "Enter" && !event.shiftKey && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                event.preventDefault();
                void send(draft);
              }
            }} maxLength={2500} rows={2} placeholder="어떤 부분이 궁금한가요?" className="block min-h-14 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-base leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </label>
          {streaming ? <button type="button" onClick={stop} aria-label="응답 중단" className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-900 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Square className="size-4" /></button>
            : <button type="submit" disabled={!draft.trim()} aria-label="질문 보내기" className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"><ArrowUp className="size-5" /></button>}
        </form> : <p className="text-xs leading-5 text-slate-500">로그인 후 이 주제로 돌아와 이어서 질문할 수 있어요.</p>}
      </div>
    </SheetContent>
  </Sheet>;
}
