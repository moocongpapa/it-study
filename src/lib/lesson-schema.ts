import { z } from "zod";

const text = z.string().min(1).max(2000);
export const LessonKindSchema = z.enum(["sequence", "compare", "sort", "capacity", "bits", "gate", "growth", "distribution", "threshold", "vector", "network", "attention", "kanban", "schedule"]);
export const LessonSpecSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), kind: LessonKindSchema,
  hook: text, labels: z.array(text.max(30)).length(3),
  terms: z.array(z.tuple([text,text])).min(3).max(6).optional(),
  panels: z.array(z.object({ label: text, meaning: text, caution: text })).length(2).optional(),
  buckets: z.array(text).length(2).optional(),
  items: z.array(z.object({ text, bucket: z.number().int().min(0).max(1), explanation: text })).min(2).max(4).optional(),
}).superRefine((s, ctx) => {
  if (s.kind === "compare" && !s.panels) ctx.addIssue({ code: "custom", message: "Compare panels required" });
  if (s.kind === "sort" && (!s.items || !s.buckets)) ctx.addIssue({ code: "custom", message: "Sorting cases required" });
});
export const LessonSchema = z.object({
  slug: text, title: text, hook: text, story: text, takeaway: text, why: text, limit: text,
  example: text, activity: text,
  kind: LessonKindSchema,
  steps: z.array(z.object({ label: text, body: text })).length(3),
  terms: z.array(z.tuple([text, text])).min(3).max(6),
  advancedTerms: z.array(z.tuple([text,text])).min(3).max(16),
  question: text, answer: text,
  debug: z.array(text).length(5).optional(),
  options: z.array(z.object({ label: text, gain: text, cost: text })).min(2).max(5),
  panels: z.array(z.object({ label: text, meaning: text, caution: text })).length(2).optional(),
  buckets: z.array(text).length(2).optional(),
  items: z.array(z.object({ text, bucket: z.number().int().min(0).max(1), explanation: text })).min(2).max(4).optional(),
});
export const LessonReferenceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  view: z.enum(["explore", "trace", "words", "recall", "debug", "decide"]),
}).strict();
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonReference = z.infer<typeof LessonReferenceSchema>;
