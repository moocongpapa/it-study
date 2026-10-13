import { NextResponse } from "next/server";
import { getArticle } from "@/lib/catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "잘못된 토픽 주소입니다." }, { status: 400 });
  }
  try {
    const article = await getArticle(slug);
    return NextResponse.json({ article }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "아티클을 불러오지 못했습니다." }, { status: 500 });
  }
}
