import type { Article } from "@/types/roadmap";
import type { Lesson } from "@/lib/lesson-schema";

export interface ArticlePayload { article: Article; lesson: Lesson | null }
const ttl = 60_000;
const capacity = 12;

/** Bounded cache of public content only. Never stores quizzes, sessions or progress. */
export function createArticleResource(fetcher: typeof fetch = fetch, now: () => number = Date.now) {
  const saved = new Map<string, { payload: ArticlePayload; expires: number }>();
  const pending = new Map<string, Promise<ArticlePayload>>();
  function peek(slug: string): ArticlePayload | undefined {
    const item = saved.get(slug);
    if (!item) return;
    if (item.expires <= now()) { saved.delete(slug); return; }
    saved.delete(slug); saved.set(slug, item);
    return item.payload;
  }
  function load(slug: string): Promise<ArticlePayload> {
    const cached = peek(slug);
    if (cached) return Promise.resolve(cached);
    const existing = pending.get(slug);
    if (existing) return existing;
    const request = (async () => {
      const response = await fetcher(`/api/articles/${encodeURIComponent(slug)}`, {
        credentials: "omit", signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(response.status === 404 ? "아직 공개된 학습 글이 없습니다." : "학습 글을 불러오지 못했습니다. 다시 시도해 주세요.");
      const payload = await response.json() as ArticlePayload;
      if (!payload.article?.is_published) throw new Error("공개된 학습 글을 확인하지 못했습니다.");
      if (payload.lesson && payload.lesson.slug !== slug) throw new Error("개념 설명과 연습 정보를 확인하지 못했습니다.");
      // Count edge-cache age too, so a second cache does not extend freshness.
      const age = Math.max(0, Number(response.headers.get("age")) || 0) * 1000;
      saved.set(slug, { payload, expires: now() + Math.max(0, ttl - age) });
      while (saved.size > capacity) saved.delete(saved.keys().next().value!);
      return payload;
    })().finally(() => pending.delete(slug));
    pending.set(slug, request);
    return request;
  }
  return { peek, load };
}

export const articleResource = createArticleResource();
let readerWarmup: Promise<unknown> | undefined;
export function warmArticle(slug: string) {
  // Intent-based only: no fetching every topic or consuming data-saver bandwidth.
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "")) return;
  readerWarmup ??= import("@/components/learning/LessonVisual").catch(() => { readerWarmup = undefined; });
  void articleResource.load(slug).catch(() => {});
}
