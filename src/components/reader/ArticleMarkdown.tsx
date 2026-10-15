"use client";

import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { MermaidRenderer } from "@/components/reader/MermaidRenderer";
import { annotateGlossaryTerms } from "@/lib/render-glossary";

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

function CodeBlock({ children }: { children: ReactNode }) {
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
      <span>코드 예제</span>
      <button type="button" onClick={copy} className="flex min-h-11 items-center gap-1.5 rounded px-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="코드 복사">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "복사됨" : "복사"}
      </button>
    </div>
    {error ? <p role="status" className="px-3 pt-2 text-xs text-rose-700">복사 권한을 확인하거나 코드를 직접 선택해 주세요.</p> : null}
    <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-slate-800">{children}</pre>
  </div>;
}

export function ArticleMarkdown({ body, largeFont, onSelectText }: { body: string; largeFont: boolean; onSelectText: (text: string) => void }) {
  const articleRef = useRef<HTMLDivElement>(null);
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
  return <div ref={articleRef} className={`reader-prose reader-article prose max-w-none ${largeFont ? "reader-article-large" : ""}`}>
    <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{
      p: ({ children }) => <p>{withGlossary(children)}</p>,
      li: ({ children }) => <li>{withGlossary(children)}</li>,
      pre: ({ node, children }) => {
        const code = node?.children.find((child) => child.type === "element" && child.tagName === "code");
        if (code?.type === "element" && Array.isArray(code.properties.className) && code.properties.className.includes("language-mermaid")) {
          return <MermaidRenderer chart={markdownNodeText(code).trim()} />;
        }
        return <CodeBlock>{children}</CodeBlock>;
      },
      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
    }}>{body}</ReactMarkdown>
  </div>;
}
