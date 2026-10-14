import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DomainNotFound() {
  return <div className="grid min-h-[65vh] place-items-center p-8 text-center"><div><p className="text-5xl font-bold text-blue-700">404</p><h2 className="mt-4 text-xl font-bold">도메인을 찾지 못했습니다</h2><p className="mt-2 text-sm text-slate-500">전체 지도에서 다른 학습 경로를 선택해 주세요.</p><Button asChild className="mt-6"><Link href="/roadmap">전체 지도 보기</Link></Button></div></div>;
}
