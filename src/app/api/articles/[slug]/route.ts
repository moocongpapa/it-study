import { NextResponse } from "next/server";
import { getArticle } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import lessons from "@/lib/learning-lessons.json";

const lessonsBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
const noCache = { "Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" };

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "잘못된 토픽 주소입니다." }, { status: 400, headers: noCache });
  }
  try {
    const started = performance.now();
    const article = await getArticle(slug);
    if (!article) return NextResponse.json({ article: null }, { status: 404, headers: noCache });
    return NextResponse.json({ article, lesson: lessonsBySlug.get(slug) ?? null }, { headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Vercel-CDN-Cache-Control": isSupabaseConfigured ? "public, max-age=60" : "no-store",
      "Server-Timing": `article;dur=${(performance.now() - started).toFixed(1)}`,
    } });
  } catch {
    return NextResponse.json({ error: "아티클을 불러오지 못했습니다." }, { status: 500, headers: noCache });
  }
}
