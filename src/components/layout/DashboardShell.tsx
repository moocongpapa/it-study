"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Blocks, BookOpen, ChevronRight, Cloud, Code2, Cpu, Database, GitBranch, HardDrive,
  LayoutDashboard, LayoutGrid, LogIn, LogOut, Menu, Network, Search, Server, ShieldCheck, SlidersHorizontal, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { CURATED_TRACKS } from "@/lib/curated-tracks";
import { cn } from "@/lib/utils";
import type { Difficulty, Domain } from "@/types/roadmap";

const icons = { Cpu, HardDrive, Network, GitBranch, Code2, Blocks, Database, Server, Cloud, ShieldCheck };
const DEMO_STORAGE_KEY = "it-atlas-demo-completed-v1";

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
  domains: Domain[];
  isDemo: boolean;
  isAuthenticated: boolean;
}

function SidebarContents({ domains, pathname, onNavigate }: { domains: Domain[]; pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/roadmap" onClick={onNavigate} className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-lg bg-slate-900 text-white"><BookOpen className="size-4" /></span>
        <span className="text-base font-bold tracking-tight text-slate-900">IT Atlas</span>
      </Link>
      <nav aria-label="학습 메뉴" className="space-y-1 px-3">
        <Link href="/roadmap" onClick={onNavigate} aria-current={pathname === "/roadmap" ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium", pathname === "/roadmap" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50")}><LayoutGrid className="size-4" />전체 학습 주제</Link>
        <Link href="/dashboard" onClick={onNavigate} aria-current={pathname === "/dashboard" ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium", pathname === "/dashboard" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50")}><LayoutDashboard className="size-4" />내 학습</Link>
      </nav>
      <p className="mb-2 mt-6 px-6 text-xs font-medium text-slate-400">분야별 학습</p>
      <nav aria-label="IT 도메인" className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {domains.map((domain) => {
          const Icon = icons[domain.icon_name as keyof typeof icons] ?? BookOpen;
          const href = "/roadmap/" + domain.slug;
          const selected = pathname === href;
          return (
            <Link key={domain.id} href={href} onClick={onNavigate} aria-current={selected ? "page" : undefined} className={cn("flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 transition-colors", selected ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 text-xs font-medium leading-5">{domain.title}</span>
              {selected ? <ChevronRight className="size-3 shrink-0" /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function DashboardShell({ children, domains, isDemo, isAuthenticated }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isRoadmap = pathname.startsWith("/roadmap");
  const hasFilters = difficulty !== "all" || selectedTrack !== "all";
  const selectedDomain = domains.find((domain) => pathname === "/roadmap/" + domain.slug);
  const title = selectedDomain?.title ?? (pathname === "/dashboard" ? "내 학습" : "전체 학습 주제");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const editing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (isRoadmap && !editing && (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key === "k"))) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRoadmap]);

  async function signOut() {
    await createClient().auth.signOut();
    router.refresh();
  }
  const filterValue = useMemo(() => ({ query, setQuery, difficulty, setDifficulty, selectedTrack, setSelectedTrack }), [query, difficulty, selectedTrack]);

  return (
    <FilterContext.Provider value={filterValue}>
      <div className="min-h-svh bg-slate-50">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white lg:block"><SidebarContents domains={domains} pathname={pathname} /></aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="max-w-[290px] p-0 lg:hidden">
            <SheetTitle className="sr-only">분야별 학습 메뉴</SheetTitle>
            <SheetDescription className="sr-only">학습 분야를 선택해 주제 목록으로 이동합니다.</SheetDescription>
            <SidebarContents domains={domains} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="lg:pl-60">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
            <div className="flex min-h-14 flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
              <Button variant="ghost" size="icon" className="size-9 shrink-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="메뉴 열기"><Menu className="size-5" /></Button>
              <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-slate-900">{title}</h1>
              {isRoadmap ? (
                <div className="order-3 flex w-full items-center gap-2 md:order-none md:ml-4 md:w-auto">
                  <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 md:w-56">
                    <Search className="size-4 shrink-0" />
                    <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="주제 검색" aria-label="토픽 검색" className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                    {query ? <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="rounded p-0.5 hover:text-slate-900"><X className="size-3.5" /></button> : null}
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls="topic-filters" aria-label={hasFilters ? "필터 설정 (적용 중)" : "필터 설정"} className={cn("h-9 shrink-0 gap-1.5 px-2.5", hasFilters || filtersOpen ? "bg-blue-50 text-blue-700" : "text-slate-600")}><SlidersHorizontal className="size-4" />필터{hasFilters ? <span className="size-1.5 rounded-full bg-blue-600" /> : null}</Button>
                </div>
              ) : null}
              <div className="flex shrink-0 items-center">
                {isDemo ? <Badge className="border-slate-200 bg-slate-50 text-slate-500">체험</Badge> : isAuthenticated ? <Button variant="ghost" size="icon" onClick={signOut} aria-label="로그아웃"><LogOut className="size-4" /></Button> : <Button variant="ghost" size="sm" asChild><Link href="/login"><LogIn className="size-3.5" />로그인</Link></Button>}
              </div>
            </div>
            {isRoadmap && filtersOpen ? (
              <div id="topic-filters" className="flex flex-wrap items-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-6">
                <label className="min-w-0 flex-1 text-xs text-slate-500 sm:max-w-64">학습 과정
                  <select value={selectedTrack} onChange={(event) => setSelectedTrack(event.target.value)} aria-label="학습 과정 필터" className="mt-1 block h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    {CURATED_TRACKS.map((track) => <option key={track.id} value={track.id}>{track.title}</option>)}
                  </select>
                </label>
                <label className="min-w-0 flex-1 text-xs text-slate-500 sm:max-w-40">난이도
                  <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty | "all")} aria-label="난이도 필터" className="mt-1 block h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <option value="all">모든 난이도</option><option value="beginner">기초</option><option value="intermediate">보통</option><option value="advanced">심화</option><option value="expert">전문</option>
                  </select>
                </label>
                {hasFilters ? <Button variant="ghost" size="sm" className="h-9 px-2 text-xs text-slate-500" onClick={() => { setDifficulty("all"); setSelectedTrack("all"); }}>초기화</Button> : null}
              </div>
            ) : null}
          </header>
          <main>{children}</main>
        </div>
      </div>
    </FilterContext.Provider>
  );
}

export { DEMO_STORAGE_KEY };
