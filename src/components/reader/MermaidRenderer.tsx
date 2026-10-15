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
  const fullscreenCanvasRef = useRef<HTMLDivElement | null>(null);
  const fitToCanvas = useCallback((canvas: HTMLDivElement) => {
    const svg = canvas.querySelector("svg");
    const viewBox = svg?.viewBox.baseVal;
    if (!viewBox?.width || !viewBox.height) return;
    const padding = parseFloat(getComputedStyle(canvas).paddingLeft) * 2;
    const scale = Math.min(1, (canvas.clientWidth - padding) / viewBox.width, (canvas.clientHeight - padding) / viewBox.height);
    setZoomScale(Math.max(.05, scale));
    canvas.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  const attachFullscreenCanvas = useCallback((canvas: HTMLDivElement | null) => {
    fullscreenCanvasRef.current = canvas;
    if (!canvas) return;
    const observer = new ResizeObserver(() => fitToCanvas(canvas));
    observer.observe(canvas);
    fitToCanvas(canvas);
    return () => { observer.disconnect(); fullscreenCanvasRef.current = null; };
  }, [fitToCanvas]);

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
            look: "classic",
            securityLevel: "loose",
            fontFamily: "inherit",
            // Mermaid 12 prioritizes root htmlLabels over flowchart.htmlLabels.
            // Native SVG text survives our SVG-only sanitizer.
            htmlLabels: false,
            suppressErrorRendering: true,
            // Keep intrinsic dimensions for the fullscreen canvas. The inline
            // container already scales large SVGs with CSS max-width.
            flowchart: { useMaxWidth: false },
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
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev * 1.25, 3));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev / 1.25, .05));
  const handleResetZoom = () => { if (fullscreenCanvasRef.current) fitToCanvas(fullscreenCanvasRef.current); };

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
    <div className={`not-prose group my-5 overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      {/* Diagram Action Toolbar */}
      <div className="flex min-h-12 items-center justify-between gap-1 border-b border-slate-200 px-2 text-xs">
        <span className="pl-1 font-medium text-slate-600">다이어그램</span>

        <div className="flex items-center gap-1.5">
          {/* Toggle raw code */}
          <button
            type="button"
            onClick={() => setShowRawCode((prev) => !prev)}
            className={`flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 transition-colors ${
              showRawCode
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="원본 코드 보기 토글"
            aria-pressed={showRawCode}
          >
            {showRawCode ? <Eye className="size-3.5" /> : <Code2 className="size-3.5" />}
            <span>{showRawCode ? "그림" : "코드"}</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Mermaid 원본 코드 복사"
            aria-label={copiedCode ? "Mermaid 코드 복사됨" : "Mermaid 원본 코드 복사"}
          >
            {copiedCode ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">{copiedCode ? "복사됨" : "코드 복사"}</span>
          </button>

          {/* Fullscreen Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            disabled={!svgContent}
            className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="전체화면 확대 보기"
            aria-label="다이어그램 전체화면 확대 보기"
          >
            <Maximize2 className="size-3.5" />
            <span className="hidden sm:inline">확대</span>
          </button>
        </div>
      </div>

      {/* Main Diagram Display Area */}
      <div className="relative min-h-[120px] p-3 sm:p-5">
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
          <DialogPrimitive.Content className="fixed inset-x-2 bottom-[max(.5rem,env(safe-area-inset-bottom))] top-[max(.5rem,env(safe-area-inset-top))] z-50 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none sm:inset-8">
            {/* Modal Header */}
            <div className="relative flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-2 py-1 sm:gap-3 sm:px-4">
              <div className="flex min-h-11 w-full items-center pr-12 sm:w-auto sm:flex-1 sm:pr-0">
                <DialogPrimitive.Title className="pl-2 text-sm font-semibold text-slate-900">
                  다이어그램 확대
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  전체화면에서 다이어그램을 확대 및 축소하여 상세히 확인합니다.
                </DialogPrimitive.Description>
              </div>

              {/* Modal Controls */}
              <div className="flex w-full items-center gap-2 sm:w-auto sm:pr-12">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="grid size-11 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    title="축소"
                    aria-label="다이어그램 축소"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                  <span className="min-w-[48px] text-center text-xs font-mono text-blue-700">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="grid size-11 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    title="확대"
                    aria-label="다이어그램 확대"
                  >
                    <ZoomIn className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="grid size-11 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    title="화면에 맞추기"
                    aria-label="다이어그램 화면에 맞추기"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>

                {/* Copy SVG */}
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="ml-auto flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  title="SVG 마크업 복사"
                >
                  {copiedSvg ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
                  <span>{copiedSvg ? "SVG 복사됨" : "SVG 복사"}</span>
                </button>

                {/* Close Button */}
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="absolute right-2 top-1 grid size-11 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="닫기"
                  >
                    <X className="size-4" />
                  </button>
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Modal Zoom & Pan Canvas */}
            <div ref={attachFullscreenCanvas} className="relative min-h-0 flex-1 overflow-auto overscroll-contain bg-slate-50 p-3 sm:p-6">
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
