"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, Blocks, BookOpen, ChevronRight, Cloud, Code2, Cpu,
  Database, GitBranch, HardDrive, LayoutDashboard, LayoutGrid, LogIn, LogOut, Menu,
  Network, Search, Server, ShieldCheck, Sparkles, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Difficulty, DomainSummary } from "@/types/roadmap";

const icons = { Cpu, HardDrive, Network, GitBranch, Code2, Blocks, Database, Server, Cloud, ShieldCheck };
const DEMO_STORAGE_KEY = "it-atlas-demo-completed-v1";
import { CURATED_TRACKS } from "@/lib/curated-tracks";

interface FilterState {
  query: string;
  setQuery: (value: string) => void;
  difficulty: Difficulty | "all";
  setDifficulty: (value: Difficulty | "all") => void;
  selectedTrack: string;
  setSelectedTrack: (trackId: string) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function useRoadmapFilters() {
  const value = useContext(FilterContext);
  if (!value) throw new Error("RoadmapFilterProvider가 필요합니다.");
  return value;
}

interface DashboardShellProps {
  children: React.ReactNode;
  domains: DomainSummary[];
  topicDomainMap: Record<string, string>;
  totalTopics: number;
  completedTopics: number;
  isDemo: boolean;
  isAuthenticated: boolean;
}

function SidebarContents({
  domains,
  completedByDomain,
  pathname,
  onNavigate,
  isDemo,
}: {
  domains: DomainSummary[];
  completedByDomain: Record<string, number>;
  pathname: string;
  onNavigate?: () => void;
  isDemo: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/roadmap" onClick={onNavigate} className="flex items-center gap-3 px-5 pb-8 pt-7">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-emerald-400 text-slate-950 shadow-[0_0_28px_#2bd5da44]">
          <GitBranch className="size-5" strokeWidth={2.5} />
        </span>
        <span>
          <span className="block text-[17px] font-black tracking-[-.03em] text-white">IT Atlas</span>
          <span className="block text-[10px] font-semibold tracking-[.19em] text-cyan-300/70">KNOWLEDGE MAP</span>
        </span>
      </Link>

      <div className="px-4">
        <Link href="/dashboard" onClick={onNavigate} className={cn("mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors", pathname === "/dashboard" ? "bg-cyan-400/12 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-white") }><LayoutDashboard className="size-4" /> 학습 대시보드 <ChevronRight className="ml-auto size-4 opacity-50" /></Link>
        <Link
          href="/roadmap"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
            pathname === "/roadmap" ? "bg-cyan-400/12 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}
        >
          <LayoutGrid className="size-4" /> 전체 지식 지도
          <ChevronRight className="ml-auto size-4 opacity-50" />
        </Link>
      </div>

      <div className="mt-8 px-7 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Explore domains</div>
      <nav aria-label="IT 도메인" className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {domains.map((domain) => {
          const Icon = icons[domain.icon_name as keyof typeof icons] ?? BookOpen;
          const href = `/roadmap/${domain.slug}`;
          const selected = pathname === href;
          const done = completedByDomain[domain.id] ?? domain.completedCount;
          const percentage = domain.topicCount ? (done / domain.topicCount) * 100 : 0;
          return (
            <Link
              key={domain.id}
              href={href}
              onClick={onNavigate}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "group block rounded-xl border px-3 py-3 transition-all",
                selected ? "border-cyan-300/20 bg-[#193344] text-white" : "border-transparent text-slate-400 hover:border-white/6 hover:bg-white/5 hover:text-white",
              )}
            >
              <span className="flex items-center gap-3">
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", selected ? "bg-cyan-300/12 text-cyan-300" : "bg-white/5 text-slate-400 group-hover:text-cyan-200")}> <Icon className="size-4" /> </span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{domain.title}</span>
                <span className="text-[10px] tabular-nums text-slate-500">{done}/{domain.topicCount}</span>
              </span>
              <Progress value={percentage} className="ml-11 mt-2 w-[calc(100%-2.75rem)]" />
            </Link>
          );
        })}
      </nav>

      <div className="m-4 rounded-2xl border border-cyan-300/12 bg-gradient-to-br from-cyan-400/9 to-emerald-400/4 p-4">
        <Sparkles className="size-4 text-cyan-300" />
        <p className="mt-3 text-xs font-semibold text-slate-200">하나씩 연결해 보세요</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">작은 개념을 이해할수록 다음 지식의 문이 열립니다.</p>
        {isDemo ? <span className="mt-3 inline-block text-[10px] text-cyan-300/70">시드 데이터 미리보기</span> : null}
      </div>
    </div>
  );
}

export function DashboardShell({
  children, domains, topicDomainMap, totalTopics, completedTopics, isDemo, isAuthenticated,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [demoCompleted, setDemoCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (!isDemo) return;
    const load = () => {
      try { setDemoCompleted(JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) ?? "[]") as string[]); }
      catch { setDemoCompleted([]); }
    };
    load();
    window.addEventListener("demo-progress-change", load);
    return () => window.removeEventListener("demo-progress-change", load);
  }, [isDemo]);

  const completedByDomain = useMemo(() => {
    if (!isDemo) return Object.fromEntries(domains.map((domain) => [domain.id, domain.completedCount]));
    const counts: Record<string, number> = {};
    for (const topicId of demoCompleted) {
      const domainId = topicDomainMap[topicId];
      if (domainId) counts[domainId] = (counts[domainId] ?? 0) + 1;
    }
    return counts;
  }, [demoCompleted, domains, isDemo, topicDomainMap]);

  const completed = isDemo ? demoCompleted.length : completedTopics;
  const percentage = totalTopics ? Math.round((completed / totalTopics) * 100) : 0;
  const selectedDomain = domains.find((domain) => pathname === `/roadmap/${domain.slug}`);
  const title = selectedDomain?.title ?? (pathname === "/dashboard" ? "학습 대시보드" : "전체 지식 지도");

  async function signOut() {
    await createClient().auth.signOut();
    router.refresh();
  }

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global shortcut to focus search with '/' or 'Cmd+K'
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement)?.tagName)) ||
        ((event.metaKey || event.ctrlKey) && event.key === "k")
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [selectedTrack, setSelectedTrack] = useState<string>("all");

  const filterValue = useMemo(() => ({ query, setQuery, difficulty, setDifficulty, selectedTrack, setSelectedTrack }), [query, difficulty, selectedTrack]);

  return (
    <FilterContext.Provider value={filterValue}>
      <div className="min-h-screen bg-[#09111b]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] border-r border-white/8 bg-[#0c1723] lg:block">
          <SidebarContents domains={domains} completedByDomain={completedByDomain} pathname={pathname} isDemo={isDemo} />
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="max-w-[290px] p-0 lg:hidden">
            <SheetTitle className="sr-only">도메인 메뉴</SheetTitle>
            <SheetDescription className="sr-only">로드맵 도메인으로 이동합니다.</SheetDescription>
            <SidebarContents domains={domains} completedByDomain={completedByDomain} pathname={pathname} onNavigate={() => setMobileOpen(false)} isDemo={isDemo} />
          </SheetContent>
        </Sheet>

        <div className="lg:pl-[270px]">
          <header className="sticky top-0 z-20 border-b border-white/7 bg-[#0b1520]/90 backdrop-blur-xl">
            <div className="flex min-h-[76px] flex-wrap items-center gap-3 px-4 py-3 md:px-7">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="메뉴 열기"><Menu className="size-5" /></Button>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300/70">Learning workspace</div>
                <h1 className="truncate text-base font-bold tracking-tight text-white md:text-lg">{title}</h1>
              </div>
              <div className="order-3 flex w-full items-center gap-2 md:order-2 md:w-auto">
                <label className="group flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 text-slate-400 transition-colors focus-within:border-cyan-400/50 focus-within:bg-[#0d1c2b] focus-within:ring-2 focus-within:ring-cyan-400/20 md:w-[210px] md:flex-none xl:w-[280px]">
                  <Search className="size-4 shrink-0 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="토픽 검색..."
                    aria-label="토픽 검색"
                    className="w-full min-w-0 bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded p-0.5 text-slate-500 hover:text-white"
                      aria-label="검색어 지우기"
                    >
                      <X className="size-3" />
                    </button>
                  ) : (
                    <kbd className="hidden font-mono text-[10px] text-slate-500 md:inline-block">/</kbd>
                  )}
                </label>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as Difficulty | "all")}
                  aria-label="난이도 필터"
                  className="h-10 rounded-xl border border-white/10 bg-[#152434] px-3 text-xs font-semibold text-slate-300 outline-none transition-colors hover:border-white/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                >
                  <option value="all">모든 난이도</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div className="order-2 flex items-center gap-2 md:order-3">
                <div className="hidden min-w-[120px] xl:block">
                  <div className="mb-1 flex justify-between text-[10px] text-slate-400"><span>전체 진도</span><span className="text-cyan-300">{percentage}%</span></div>
                  <Progress value={percentage} />
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-cyan-300 xl:hidden" aria-label={`전체 학습 진도 ${percentage}%`}>{percentage}%</span>
                {isDemo ? <Badge className="border-cyan-300/20 bg-cyan-300/8 text-cyan-200">DEMO</Badge> : isAuthenticated ? (
                  <Button variant="ghost" size="icon" onClick={signOut} aria-label="로그아웃"><LogOut className="size-4" /></Button>
                ) : (
                  <Button variant="secondary" size="sm" asChild><Link href="/login"><LogIn className="size-3.5" /> 로그인</Link></Button>
                )}
              </div>
            </div>

            {/* Curated Track Bar for Roadmap Views */}
            {pathname.startsWith("/roadmap") ? (
              <div className="border-t border-white/6 bg-[#08121c]/75 px-4 py-2 backdrop-blur-md md:px-7">
                <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    추천 학습 트랙:
                  </span>
                  {CURATED_TRACKS.map((track) => {
                    const isSelected = selectedTrack === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => setSelectedTrack(track.id)}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
                          isSelected
                            ? "bg-cyan-400/20 border border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                            : "border border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-200"
                        )}
                        title={track.description}
                      >
                        <span>{track.title}</span>
                        <span className={cn("rounded-full px-1.5 py-0.2 text-[10px]", isSelected ? "bg-cyan-400/30 text-cyan-100" : "bg-white/5 text-slate-500")}>
                          {track.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </header>

          <main className="min-h-[calc(100vh-76px)]">{children}</main>
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/6 px-6 py-5 text-[11px] text-slate-600">
            <span>IT Atlas · 개념을 연결하고 깊이를 쌓는 학습 공간</span>
            <span className="flex items-center gap-1"><Activity className="size-3" /> 10개 도메인 · {totalTopics}개 핵심 토픽</span>
          </footer>
        </div>
      </div>
    </FilterContext.Provider>
  );
}

export { DEMO_STORAGE_KEY };
