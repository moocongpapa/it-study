"use client";

import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { BookOpen, Check, ChevronDown, Copy } from "lucide-react";
import { MermaidRenderer } from "@/components/reader/MermaidRenderer";
import { annotateGlossaryTerms } from "@/lib/render-glossary";
import { splitClassroomReference } from "@/lib/classroom-markdown";
import type { Lesson } from "@/lib/lesson-schema";

const LessonVisual = dynamic(() => import("@/components/learning/LessonVisual"), {
  loading: () => <div role="status" className="not-prose my-5 grid min-h-60 place-items-center rounded-3xl bg-teal-50 text-sm text-teal-800">개념 확인 활동을 불러오고 있어요…</div>,
});

function plainText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(plainText).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) return plainText(children.props.children);
  return "";
}

function markdownNodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if ("type" in node && node.type === "text" && "value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && Array.isArray(node.children)) return node.children.map(markdownNodeText).join("");
  return "";
}

function withGlossary(children: ReactNode): ReactNode {
  if (typeof children === "string") return annotateGlossaryTerms(children);
  if (Array.isArray(children)) return children.map((child, index) => <span key={index}>{withGlossary(child)}</span>);
  return children;
}

function CodeBlock({ children, language }: { children: ReactNode; language: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(plainText(children).replace(/\n$/, ""));
      setError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setError(true); }
  }
  return <div className="not-prose my-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
    <div className="flex min-h-11 items-center justify-between border-b border-slate-200 px-3 text-xs text-slate-500">
      <span>{language === "markdown" ? "바로 써보는 업무 템플릿" : ["text", "plaintext", ""].includes(language) ? "함께 보는 예시 자료" : "한 줄씩 따라가는 코드"}</span>
      <button type="button" onClick={copy} className="flex min-h-11 items-center gap-1.5 rounded px-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="코드 복사">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "복사됨" : "복사"}
      </button>
    </div>
    {error ? <p role="status" className="px-3 pt-2 text-xs text-rose-700">복사 권한을 확인하거나 코드를 직접 선택해 주세요.</p> : null}
    <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-slate-800">{children}</pre>
  </div>;
}

export function ArticleMarkdown({ body, lesson, largeFont, onSelectText, referenceExpanded = false, referenceTitle = "코드·사례·출처 자세히 보기" }: { body: string; lesson?: Lesson|null; largeFont: boolean; onSelectText: (text: string) => void; referenceExpanded?: boolean; referenceTitle?: string }) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [referenceOpen, setReferenceOpen] = useState(referenceExpanded);
  useEffect(() => {
    function captureSelection() {
      const selection = window.getSelection();
      if (!articleRef.current?.contains(selection?.anchorNode ?? null) || !articleRef.current.contains(selection?.focusNode ?? null)) return;
      const value = selection?.toString().trim() ?? "";
      if (value.length >= 3) onSelectText(value.slice(0, 1600));
    }
    document.addEventListener("selectionchange", captureSelection);
    return () => document.removeEventListener("selectionchange", captureSelection);
  }, [onSelectText]);
  const parts = splitClassroomReference(body);
  return <div ref={articleRef} className={`reader-prose reader-article prose max-w-none ${largeFont ? "reader-article-large" : ""}`}>
    <MarkdownContent body={parts.before} lesson={lesson}/>
    {parts.reference ? <details open={referenceOpen} onToggle={(event) => setReferenceOpen(event.currentTarget.open)} className="classroom-reference group not-prose my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 [&::-webkit-details-marker]:hidden"><BookOpen className="size-4 shrink-0 text-teal-700"/><span className="flex-1">{referenceTitle}</span><ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180"/></summary>
      {referenceOpen ? <div className="reader-prose prose max-w-none border-t border-slate-100 px-4 pb-4 pt-3 text-sm"><MarkdownContent body={parts.reference} lesson={lesson}/></div> : null}
    </details> : null}
    {parts.after ? <MarkdownContent body={parts.after} lesson={lesson}/> : null}
  </div>;
}

function MarkdownContent({body,lesson}:{body:string;lesson?:Lesson|null}) {
  return <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, {ignoreMissing:true}]]} components={{
    p: ({ children }) => <p>{withGlossary(children)}</p>,
    li: ({ children }) => <li>{withGlossary(children)}</li>,
    pre: ({ node, children }) => {
      const code = node?.children.find((child) => child.type === "element" && child.tagName === "code");
      const classes = code?.type === "element" && Array.isArray(code.properties.className) ? code.properties.className : [];
      const language = String(classes.find((c) => String(c).startsWith("language-")) ?? "").replace("language-", "");
      if(language === "learning") return <LessonVisual source={markdownNodeText(code).trim()} lesson={lesson}/>;
      if(language === "mermaid") return <MermaidRenderer chart={markdownNodeText(code).trim()}/>;
      return <CodeBlock language={language}>{children}</CodeBlock>;
    },
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  }}>{body}</ReactMarkdown>;
}
