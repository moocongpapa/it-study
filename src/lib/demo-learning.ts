import { calculateNextReview, initialReviewSchedule } from "@/lib/spaced-repetition";
import type { UserNodeProgress } from "@/types/roadmap";

export const DEMO_COMPLETED_KEY = "it-atlas-demo-completed-v1";
export const DEMO_LEARNING_KEY = "it-atlas-demo-learning-v1";
export const DEMO_PROGRESS_EVENT = "demo-progress-change";

export interface DemoLearningState {
  progress: Record<string, UserNodeProgress>;
  passedQuizIds: string[];
  learningDays: string[];
}

const emptyState = (): DemoLearningState => ({ progress: {}, passedQuizIds: [], learningDays: [] });

export function readDemoLearning(): DemoLearningState {
  if (typeof window === "undefined") return emptyState();
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_LEARNING_KEY) ?? "null") as DemoLearningState | null;
    const state = stored && stored.progress && Array.isArray(stored.passedQuizIds) && Array.isArray(stored.learningDays)
      ? stored : emptyState();
    const legacyIds = JSON.parse(localStorage.getItem(DEMO_COMPLETED_KEY) ?? "[]") as string[];
    for (const topicId of legacyIds) {
      state.progress[topicId] ??= {
        topic_id: topicId, is_completed: true, current_level: 4,
        self_assessment: null, completed_at: null,
      };
    }
    return state;
  } catch { return emptyState(); }
}

export function getDemoProgressRows(): UserNodeProgress[] {
  const state = readDemoLearning();
  return Object.values(state.progress);
}

function writeDemoLearning(state: DemoLearningState) {
  localStorage.setItem(DEMO_LEARNING_KEY, JSON.stringify(state));
  localStorage.setItem(DEMO_COMPLETED_KEY, JSON.stringify(
    Object.values(state.progress).filter((item) => item.is_completed).map((item) => item.topic_id),
  ));
  window.dispatchEvent(new Event(DEMO_PROGRESS_EVENT));
}

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function setBrowserTopicCompletion(topicId: string, completed: boolean, selfAssessment: number | null = null): UserNodeProgress {
  const state = readDemoLearning();
  const existing = state.progress[topicId];
  if (existing?.is_completed === completed) return existing;
  if (!completed) {
    const updated: UserNodeProgress = {
      ...existing, topic_id: topicId, is_completed: false, completion_source: null,
      current_level: 1, self_assessment: existing?.self_assessment ?? null,
      completed_at: null, last_reviewed_at: null, next_review_at: null,
      review_interval_days: 0, ease_factor: 2.5, review_count: 0,
    };
    state.progress[topicId] = updated;
    writeDemoLearning(state);
    return updated;
  }
  const schedule = initialReviewSchedule();
  state.progress[topicId] = {
    topic_id: topicId, is_completed: true, completion_source: "manual", current_level: 4,
    self_assessment: selfAssessment, completed_at: schedule.lastReviewedAt,
    last_reviewed_at: schedule.lastReviewedAt,
    next_review_at: schedule.nextReviewAt,
    review_interval_days: schedule.intervalDays,
    ease_factor: schedule.easeFactor,
    review_count: schedule.reviewCount,
  };
  state.learningDays = [...new Set([...state.learningDays, todayInSeoul()])];
  writeDemoLearning(state);
  return state.progress[topicId];
}

export function completeDemoTopic(topicId: string, selfAssessment: number) {
  return setBrowserTopicCompletion(topicId, true, selfAssessment);
}

export function clearDemoCompletedTopics(topicIds?: string[]) {
  if (typeof window === "undefined") return;
  const state = readDemoLearning();
  if (!topicIds) {
    state.progress = {};
  } else {
    for (const id of topicIds) {
      delete state.progress[id];
    }
  }
  writeDemoLearning(state);
}

export function markDemoQuizPassed(quizId: string) {
  const state = readDemoLearning();
  if (state.passedQuizIds.includes(quizId)) return;
  state.passedQuizIds = [...state.passedQuizIds, quizId];
  state.learningDays = [...new Set([...state.learningDays, todayInSeoul()])];
  writeDemoLearning(state);
}

export function reviewDemoTopic(topicId: string, quality: number): UserNodeProgress | null {
  const state = readDemoLearning();
  const existing = state.progress[topicId];
  if (!existing?.is_completed) return null;
  const schedule = calculateNextReview({
    reviewCount: existing.review_count ?? 0,
    easeFactor: existing.ease_factor ?? 2.5,
    quality,
  });
  const updated: UserNodeProgress = {
    ...existing, self_assessment: quality,
    last_reviewed_at: schedule.lastReviewedAt,
    next_review_at: schedule.nextReviewAt,
    review_interval_days: schedule.intervalDays,
    ease_factor: schedule.easeFactor,
    review_count: schedule.reviewCount,
  };
  state.progress[topicId] = updated;
  state.learningDays = [...new Set([...state.learningDays, todayInSeoul()])];
  writeDemoLearning(state);
  return updated;
}
