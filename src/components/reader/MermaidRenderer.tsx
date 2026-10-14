"use client";

import { useEffect, useId, useState, useRef, useCallback, useSyncExternalStore } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  AlertCircle,
  Check,
  Copy,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Code2,
  Eye,
  X,
  Sparkles,
} from "lucide-react";

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

const emptySubscribe = () => () => {};
let renderQueue: Promise<unknown> = Promise.resolve();
let renderSerial = 0;

function serializeRender<T>(work: () => Promise<T>): Promise<T> {
  const result = renderQueue.then(work, work);
  renderQueue = result.catch(() => undefined);
  return result;
}

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function useIsDarkMode(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const observer = new MutationObserver(() => callback());
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", callback);
      return () => {
        observer.disconnect();
        media.removeEventListener("change", callback);
      };
    },
    () => {
      if (typeof document === "undefined") return true;
      if (document.documentElement.classList.contains("light")) return false;
      if (document.documentElement.classList.contains("dark")) return true;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    () => true
  );
}

export function MermaidRenderer({ chart, className = "" }: MermaidRendererProps) {
  const rawId = useId();
  const diagramId = `mermaid_${rawId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  const isMounted = useIsMounted();
  const isDarkMode = useIsDarkMode();

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [showRawCode, setShowRawCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  // 2. Render Mermaid diagram safely on client
  useEffect(() => {
    if (!isMounted || !chart.trim()) return;

    let isCancelled = false;

    async function renderChart() {
      try {
        const [{ default: mermaid }, { default: DOMPurify }] = await Promise.all([
          import("mermaid"), import("dompurify"),
        ]);
        const uniqueRenderId = `${diagramId}_${++renderSerial}`;
        const svg = await serializeRender(async () => {
          if (isCancelled) return null;
          // Mermaid uses global configuration; keep initialize and render together.
          mermaid.initialize({
            startOnLoad: false,
            theme: isDarkMode ? "dark" : "neutral",
            securityLevel: "loose",
            fontFamily: "inherit",
            suppressErrorRendering: true,
            flowchart: { htmlLabels: false },
          });
          await mermaid.parse(chart.trim());
          return (await mermaid.render(uniqueRenderId, chart.trim())).svg;
        });

        if (!isCancelled && svg) {
          // Loose Mermaid mode permits links and markup. Never insert its raw SVG.
          const safeSvg = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          });
          if (!safeSvg.includes("<svg")) throw new Error("유효한 SVG가 생성되지 않았습니다.");
          setSvgContent(safeSvg);
          setRenderError(null);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setRenderError(message);
          setSvgContent(null);

          // Clean up any stray error elements injected into document by Mermaid
          const strayErrorEl = document.getElementById(`d${diagramId}`);
          if (strayErrorEl) {
            strayErrorEl.remove();
          }
        }
      }
    }

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [isMounted, chart, isDarkMode, diagramId]);

  // Copy raw mermaid code
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(chart.trim());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // clipboard write failed
    }
  }, [chart]);

  // Copy SVG content
  const handleCopySvg = useCallback(async () => {
    if (!svgContent) return;
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    } catch {
      // clipboard write failed
    }
  }, [svgContent]);

  // Zoom controls for fullscreen modal
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomScale(1);

  // SSR Loading Placeholder
  if (!isMounted) {
    return (
      <div className="my-6 flex h-48 w-full animate-pulse items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs text-slate-500">
        다이어그램 렌더러 초기화 중...
      </div>
    );
  }

  // Graceful Fallback on Syntax Error
  if (renderError || !chart.trim()) {
    return (
      <div className={`my-6 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm ${className}`}>
        <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <AlertCircle className="size-4 text-amber-700" />
            <span>다이어그램 렌더링 실패</span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="원본 Mermaid 코드 복사"
          >
            {copiedCode ? <Check className="size-3 text-emerald-700" /> : <Copy className="size-3" />}
            <span>{copiedCode ? "복사됨" : "코드 복사"}</span>
          </button>
        </div>

        <div className="p-4">
          <p className="mb-3 text-xs leading-relaxed text-slate-500">
            다이어그램 코드를 시각화하는 중 문제가 발생했습니다. 아래의 원본 코드를 확인하거나 복사할 수 있습니다.
          </p>
          <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 text-xs font-mono leading-5 text-slate-500">
            <code>{chart.trim()}</code>
          </pre>
          <details className="mt-3 text-[11px] text-slate-500">
            <summary className="cursor-pointer hover:text-slate-500">오류 세부 정보 확인</summary>
            <p className="mt-1 whitespace-pre-wrap rounded bg-slate-900/30 p-2 font-mono text-rose-700">
              {renderError || "Mermaid 코드가 비어 있습니다."}
            </p>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={`group my-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm transition-all hover:border-blue-200 ${className}`}>
      {/* Diagram Action Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-bold tracking-wider text-blue-700">
            <Sparkles className="size-3" />
            MERMAID
          </span>
          <span className="text-slate-500">인터랙티브 다이어그램</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle raw code */}
          <button
            type="button"
            onClick={() => setShowRawCode((prev) => !prev)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
              showRawCode
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="원본 코드 보기 토글"
          >
            {showRawCode ? <Eye className="size-3.5" /> : <Code2 className="size-3.5" />}
            <span>{showRawCode ? "다이어그램" : "코드 보기"}</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Mermaid 원본 코드 복사"
          >
            {copiedCode ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">{copiedCode ? "복사됨" : "코드 복사"}</span>
          </button>

          {/* Fullscreen Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            disabled={!svgContent}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="전체화면 확대 보기"
            aria-label="다이어그램 전체화면 확대 보기"
          >
            <Maximize2 className="size-3.5" />
            <span className="hidden sm:inline">확대</span>
          </button>
        </div>
      </div>

      {/* Main Diagram Display Area */}
      <div className="relative min-h-[160px] p-5">
        {showRawCode ? (
          <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 text-xs font-mono leading-5 text-slate-500">
            <code>{chart.trim()}</code>
          </pre>
        ) : svgContent ? (
          <div
            ref={containerRef}
            className="flex w-full items-center justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="flex h-36 items-center justify-center text-xs text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-transparent mr-2" />
            다이어그램 렌더링 중...
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Dialog */}
      <DialogPrimitive.Root open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/30  animate-in fade-in" />
          <DialogPrimitive.Content className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm focus:outline-none sm:inset-8">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <DialogPrimitive.Title className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="size-4 text-blue-700" />
                  아키텍처 다이어그램 확대 보기
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  전체화면에서 다이어그램을 확대 및 축소하여 상세히 확인합니다.
                </DialogPrimitive.Description>
              </div>

              {/* Modal Controls */}
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    title="축소"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                  <span className="min-w-[48px] text-center text-xs font-mono text-blue-700">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    title="확대"
                  >
                    <ZoomIn className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    title="배율 초기화"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>

                {/* Copy SVG */}
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 transition hover:bg-slate-100 hover:text-slate-900"
                  title="SVG 마크업 복사"
                >
                  {copiedSvg ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
                  <span>{copiedSvg ? "SVG 복사됨" : "SVG 복사"}</span>
                </button>

                {/* Close Button */}
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                    aria-label="닫기"
                  >
                    <X className="size-4" />
                  </button>
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Modal Zoom & Pan Canvas */}
            <div className="relative flex-1 overflow-auto p-8 bg-[radial-gradient(#1e3a5f15_1px,transparent_1px)] [background-size:20px_20px]">
              {svgContent ? (
                <div
                  style={{ zoom: zoomScale }}
                  className="mx-auto w-max [&_svg]:max-w-none"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : null}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
