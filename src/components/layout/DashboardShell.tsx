"use client";

import { createContext, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronDown, FlaskConical, LayoutDashboard, LogIn, LogOut, Menu } from "lucide-react";
import { DomainIcon, domainLabel } from "@/components/layout/DomainIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Difficulty, Domain } from "@/types/roadmap";

const DEMO_STORAGE_KEY = "it-atlas-demo-completed-v1";
interface FilterState {
  query: string; setQuery: (value: string) => void;
  difficulty: Difficulty | "all"; setDifficulty: (value: Difficulty | "all") => void;
  selectedTrack: string; setSelectedTrack: (trackId: string) => void;
}
const FilterContext = createContext<FilterState | null>(null);
export function useRoadmapFilters() {
  const value = useContext(FilterContext);
  if (!value) throw new Error("RoadmapFilterProvider가 필요합니다.");
  return value;
}
const mainLinks = [
  { href: "/roadmap", label: "주제 둘러보기", icon: BookOpen },
  { href: "/dashboard", label: "내 학습", icon: LayoutDashboard },
  { href: "/practice", label: "실무 연습실", icon: FlaskConical },
];
const domainGroups = [
  { label: "컴퓨터·개발", from: 1, to: 10 },
  { label: "데이터·AI", from: 11, to: 16 },
  { label: "프로젝트·제품", from: 17, to: Infinity },
];

function SidebarContents({ domains, pathname, onNavigate }: { domains: Domain[]; pathname: string; onNavigate: () => void }) {
  return <div className="flex h-full min-h-0 flex-col">
    <Link href="/roadmap" onClick={onNavigate} className="flex h-20 shrink-0 items-center gap-2.5 px-5 text-brand-900"><BookOpen className="size-8 stroke-[1.6]"/><span className="text-xl font-bold tracking-tight">IT Atlas</span></Link>
    <nav aria-label="학습 메뉴" className="space-y-1 px-3 pb-5">
      {mainLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={onNavigate} aria-current={pathname.startsWith(href) ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", pathname.startsWith(href) ? "bg-brand-100 text-brand-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}><Icon className="size-[18px]"/>{label}</Link>)}
    </nav>
    <div className="mx-5 border-t border-slate-200"/>
    <nav aria-label="학습 분야" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
      {domainGroups.map((group) => <details key={group.label} open className="group mb-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-xs font-semibold text-slate-600 [&::-webkit-details-marker]:hidden">{group.label}<ChevronDown className="size-3.5 transition-transform group-not-open:-rotate-90"/></summary>
        <div className="space-y-0.5">{domains.filter((d) => d.display_order >= group.from && d.display_order <= group.to).map((domain) => {
          const href = `/roadmap/${domain.slug}`;
          return <Link key={domain.id} href={href} title={domain.title} onClick={onNavigate} aria-current={pathname === href ? "page" : undefined} className={cn("flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] leading-5 transition-colors", pathname === href ? "bg-brand-100 font-semibold text-brand-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}><DomainIcon name={domain.icon_name} className="size-4 shrink-0 opacity-80"/><span>{domainLabel(domain.slug, domain.title)}</span></Link>;
        })}</div>
      </details>)}
    </nav>
  </div>;
}

export function DashboardShell({ children, domains, isDemo, isAuthenticated }: { children: React.ReactNode; domains: Domain[]; isDemo: boolean; isAuthenticated: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const selectedDomain = domains.find((domain) => pathname === `/roadmap/${domain.slug}`);
  const title = selectedDomain ? domainLabel(selectedDomain.slug, selectedDomain.title) : pathname === "/dashboard" ? "내 학습" : pathname.startsWith("/practice") ? "실무 연습실" : "주제 둘러보기";
  function navigateFromMenu() { setMobileOpen(false); setQuery(""); setDifficulty("all"); setSelectedTrack("all"); }
  async function signOut() { await createClient().auth.signOut(); router.refresh(); }
  const filterValue = useMemo(() => ({ query, setQuery, difficulty, setDifficulty, selectedTrack, setSelectedTrack }), [query, difficulty, selectedTrack]);
  return <FilterContext.Provider value={filterValue}>
    <div className="min-h-svh bg-slate-50">
      <a href="#main-content" className="skip-link">본문으로 바로가기</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-slate-200 bg-[#fafbf9] lg:block"><SidebarContents domains={domains} pathname={pathname} onNavigate={navigateFromMenu}/></aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="max-w-[290px] bg-[#fafbf9] p-0 lg:hidden"><SheetTitle className="sr-only">분야별 학습 메뉴</SheetTitle><SheetDescription className="sr-only">학습 분야를 선택해 주제 목록으로 이동합니다.</SheetDescription><SidebarContents domains={domains} pathname={pathname} onNavigate={navigateFromMenu}/></SheetContent></Sheet>
      <div className="lg:pl-56">
        <header className="border-b border-slate-200 bg-white/90">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-8">
            <Button variant="ghost" size="icon" className="-ml-2 shrink-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="메뉴 열기" aria-expanded={mobileOpen} aria-haspopup="dialog"><Menu className="size-5"/></Button>
            <span className="mr-1 hidden text-sm text-slate-500 lg:inline">학습 <span aria-hidden="true" className="mx-2 text-slate-300">/</span></span>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{title}</h1>
            {isDemo ? <Badge className="border-slate-200 bg-slate-100 text-slate-600">체험</Badge> : isAuthenticated ? <Button variant="ghost" size="icon" onClick={signOut} aria-label="로그아웃"><LogOut className="size-4"/></Button> : <Button size="sm" asChild><Link href={`/login?next=${encodeURIComponent(pathname)}`}><LogIn className="size-3.5"/>로그인</Link></Button>}
          </div>
          <nav aria-label="빠른 학습 메뉴" className="flex border-t border-slate-100 px-4 lg:hidden">{mainLinks.map(({ href, label }) => <Link key={href} href={href} onClick={navigateFromMenu} aria-current={pathname.startsWith(href) ? "page" : undefined} className={cn("flex min-h-11 flex-1 items-center justify-center border-b-2 px-2 text-xs font-medium", pathname.startsWith(href) ? "border-brand-700 text-brand-800" : "border-transparent text-slate-600")}>{label}</Link>)}</nav>
        </header>
        <main id="main-content" tabIndex={-1} className="outline-none">{children}</main>
      </div>
    </div>
  </FilterContext.Provider>;
}
export { DEMO_STORAGE_KEY };
