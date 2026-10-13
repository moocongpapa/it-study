export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

export interface ReviewScheduleInput {
  reviewCount: number;
  easeFactor: number;
  quality: number;
  reviewedAt?: Date;
}

export interface ReviewSchedule {
  reviewCount: number;
  easeFactor: number;
  intervalDays: number;
  lastReviewedAt: string;
  nextReviewAt: string;
}

/** Fixed-interval SM-2 variant: quality 1–2 restarts, 3–5 advances. */
export function calculateNextReview({
  reviewCount, easeFactor, quality, reviewedAt = new Date(),
}: ReviewScheduleInput): ReviewSchedule {
  if (!Number.isInteger(reviewCount) || reviewCount < 0 || !Number.isFinite(easeFactor)
      || !Number.isInteger(quality) || quality < 1 || quality > 5
      || Number.isNaN(reviewedAt.getTime())) {
    throw new Error("올바르지 않은 복습 입력입니다.");
  }

  const success = quality >= 3;
  const nextCount = success ? Math.min(reviewCount + 1, REVIEW_INTERVALS_DAYS.length - 1) : 0;
  const delta = 5 - quality;
  const nextEase = Math.max(1.3, Math.min(9.99, easeFactor + 0.1 - delta * (0.08 + delta * 0.02)));
  const intervalDays = REVIEW_INTERVALS_DAYS[nextCount];
  const nextReviewAt = new Date(reviewedAt.getTime() + intervalDays * 86_400_000);
  return {
    reviewCount: nextCount,
    easeFactor: Math.round(nextEase * 100) / 100,
    intervalDays,
    lastReviewedAt: reviewedAt.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
  };
}

export function initialReviewSchedule(now = new Date()): ReviewSchedule {
  const nextReviewAt = new Date(now.getTime() + 86_400_000);
  return {
    reviewCount: 0, easeFactor: 2.5, intervalDays: 1,
    lastReviewedAt: now.toISOString(), nextReviewAt: nextReviewAt.toISOString(),
  };
}
