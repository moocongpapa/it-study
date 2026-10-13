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
      const hasDarkClass = document.documentElement.classList.contains("dark");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return hasDarkClass || prefersDark || true;
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
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkMode ? "dark" : "neutral",
          securityLevel: "loose",
          fontFamily: "inherit",
          suppressErrorRendering: true,
          themeVariables: isDarkMode
            ? {
                darkMode: true,
                background: "#0a131f",
                primaryColor: "#0284c7",
                primaryTextColor: "#f0f9ff",
                primaryBorderColor: "#38bdf8",
                lineColor: "#38bdf8",
                secondaryColor: "#1e293b",
                tertiaryColor: "#0f172a",
                noteBkgColor: "#1e293b",
                noteTextColor: "#e2e8f0",
              }
            : undefined,
        });

        // Ensure unique render ID per execution to prevent collisions
        const uniqueRenderId = `${diagramId}_${Date.now()}`;
        const { svg } = await mermaid.render(uniqueRenderId, chart.trim());

        if (!isCancelled) {
          setSvgContent(svg);
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
      <div className="my-6 flex h-48 w-full animate-pulse items-center justify-center rounded-2xl border border-white/10 bg-[#071320] text-xs text-slate-500">
        다이어그램 렌더러 초기화 중...
      </div>
    );
  }

  // Graceful Fallback on Syntax Error
  if (renderError) {
    return (
      <div className={`my-6 overflow-hidden rounded-2xl border border-amber-500/25 bg-[#0f1722] shadow-xl ${className}`}>
        <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <AlertCircle className="size-4 text-amber-400" />
            <span>다이어그램 렌더링 실패 (Mermaid 구문 오류)</span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="원본 Mermaid 코드 복사"
          >
            {copiedCode ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            <span>{copiedCode ? "복사됨" : "코드 복사"}</span>
          </button>
        </div>

        <div className="p-4">
          <p className="mb-3 text-xs leading-relaxed text-slate-400">
            다이어그램 코드를 시각화하는 중 문제가 발생했습니다. 아래의 원본 코드를 확인하거나 복사할 수 있습니다.
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/5 bg-[#040810] p-4 text-xs font-mono leading-5 text-slate-300">
            <code>{chart.trim()}</code>
          </pre>
          <details className="mt-3 text-[11px] text-slate-500">
            <summary className="cursor-pointer hover:text-slate-400">오류 세부 정보 확인</summary>
            <p className="mt-1 whitespace-pre-wrap rounded bg-black/40 p-2 font-mono text-rose-300/80">
              {renderError}
            </p>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={`group my-6 overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#071320] shadow-xl transition-all hover:border-cyan-500/35 ${className}`}>
      {/* Diagram Action Toolbar */}
      <div className="flex items-center justify-between border-b border-white/8 bg-[#0a1827] px-4 py-2.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-cyan-400/10 px-2 py-0.5 font-bold tracking-wider text-cyan-300">
            <Sparkles className="size-3" />
            MERMAID
          </span>
          <span className="text-slate-400">인터랙티브 다이어그램</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle raw code */}
          <button
            type="button"
            onClick={() => setShowRawCode((prev) => !prev)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
              showRawCode
                ? "bg-cyan-400/20 text-cyan-200"
                : "text-slate-400 hover:bg-white/8 hover:text-white"
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
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
            title="Mermaid 원본 코드 복사"
          >
            {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">{copiedCode ? "복사됨" : "코드 복사"}</span>
          </button>

          {/* Fullscreen Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
            title="전체화면 확대 보기"
          >
            <Maximize2 className="size-3.5" />
            <span className="hidden sm:inline">확대</span>
          </button>
        </div>
      </div>

      {/* Main Diagram Display Area */}
      <div className="relative min-h-[160px] p-5">
        {showRawCode ? (
          <pre className="overflow-x-auto rounded-xl border border-white/5 bg-[#030810] p-4 text-xs font-mono leading-5 text-slate-300">
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
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mr-2" />
            다이어그램 렌더링 중...
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Dialog */}
      <DialogPrimitive.Root open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#020812]/85 backdrop-blur-md animate-in fade-in" />
          <DialogPrimitive.Content className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#091522] shadow-2xl focus:outline-none sm:inset-8">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0d1d2e] px-6 py-4">
              <div className="flex items-center gap-3">
                <DialogPrimitive.Title className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-cyan-400" />
                  아키텍처 다이어그램 확대 보기
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  전체화면에서 다이어그램을 확대 및 축소하여 상세히 확인합니다.
                </DialogPrimitive.Description>
              </div>

              {/* Modal Controls */}
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title="축소"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                  <span className="min-w-[48px] text-center text-xs font-mono text-cyan-300">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title="확대"
                  >
                    <ZoomIn className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title="배율 초기화"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>

                {/* Copy SVG */}
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10 hover:text-white"
                  title="SVG 마크업 복사"
                >
                  {copiedSvg ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  <span>{copiedSvg ? "SVG 복사됨" : "SVG 복사"}</span>
                </button>

                {/* Close Button */}
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
                    aria-label="닫기"
                  >
                    <X className="size-4" />
                  </button>
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Modal Zoom & Pan Canvas */}
            <div className="relative flex flex-1 items-center justify-center overflow-auto p-8 bg-[radial-gradient(#1e3a5f15_1px,transparent_1px)] [background-size:20px_20px]">
              {svgContent ? (
                <div
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: "center center",
                    transition: "transform 0.15s ease-out",
                  }}
                  className="flex items-center justify-center [&_svg]:max-w-none"
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
