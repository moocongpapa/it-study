import { readFile, writeFile } from "node:fs/promises";
import { Command } from "commander";
import pLimit from "p-limit";
import { z } from "zod";
import { readLibrary } from "./content-library.ts";

const keys = ["level_1_mental_model", "level_2_core_engineering", "level_3_troubleshooting", "level_4_architecture_tradeoffs"] as const;
const ArticleSchema = z.object({
  id: z.uuid(), topic_id: z.uuid(),
  level_1_mental_model: z.string().min(1), level_2_core_engineering: z.string().min(1),
  level_3_troubleshooting: z.string().min(1), level_4_architecture_tradeoffs: z.string().min(1),
});
const QuizSchema = z.object({ id: z.uuid(), topic_id: z.uuid(), level: z.number().int().min(1).max(4), question: z.string(), choices: z.array(z.string()), question_type: z.enum(["multiple_choice", "short_answer"]) }).passthrough().refine(
  (q) => q.question_type === "multiple_choice" ? q.choices.length >= 2 : q.choices.length === 0,
  "Multiple-choice questions need choices; short-answer questions have none",
);

async function main() {
  const { baseUrl } = new Command().requiredOption("--base-url <url>", "Public application origin to verify; GET requests only").parse().opts<{ baseUrl: string }>();
  const base = new URL(baseUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || base.pathname !== "/")
    throw new Error("Provide an HTTPS origin without credentials, path, or query");
  const catalog = JSON.parse(await readFile("src/lib/demo-catalog.json", "utf8")) as { topics: { slug: string }[]; domains: { slug: string; title: string }[] };
  const library = new Map((await readLibrary()).map((row) => [row.slug, row]));
  const limit = pLimit(5);
  async function get(path: string) {
    const response = await fetch(new URL(path, base), { cache: "no-store", signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response;
  }
  const topics = await Promise.all(catalog.topics.map((topic) => limit(async () => {
    const article = ArticleSchema.parse((await (await get(`/api/articles/${topic.slug}`)).json()).article);
    const source = library.get(topic.slug);
    if (source && keys.some((key) => article[key] !== source[key])) throw new Error(`${topic.slug}: published body differs from source`);
    const payload = await (await get(`/api/quizzes/${article.topic_id}`)).json();
    const quizzes = z.array(QuizSchema).parse(payload.quizzes);
    if (new Set(quizzes.map((q) => q.level)).size !== 4 || quizzes.some((q) => q.topic_id !== article.topic_id))
      throw new Error(`${topic.slug}: quiz level or ownership mismatch`);
    if (quizzes.some((q) => "answer_index" in q || "explanation" in q || "accepted_answers" in q))
      throw new Error(`${topic.slug}: public quiz endpoint disclosed answer fields`);
    if (source && (quizzes.length !== 4 || source.quizzes.some((q) => !quizzes.some((live) => live.level === q.level && live.question === q.question && JSON.stringify(live.choices) === JSON.stringify(q.choices)))))
      throw new Error(`${topic.slug}: published quizzes differ from source`);
    console.log(`${topic.slug}: 4 levels / ${quizzes.length} quizzes OK`);
    return { slug: topic.slug, topicId: article.topic_id, articleId: article.id, levels: 4, quizzes: quizzes.length, sourceMatched: Boolean(source) };
  })));
  const domains = await Promise.all(catalog.domains.map((domain) => limit(async () => {
    const html = await (await get(`/roadmap/${domain.slug}`)).text();
    const escapedTitle = domain.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    if (!html.includes(escapedTitle)) throw new Error(`${domain.slug}: domain heading missing`);
    return { slug: domain.slug, status: 200 };
  })));
  const quizCount = topics.reduce((sum, topic) => sum + topic.quizzes, 0);
  if (topics.length !== 50 || quizCount !== 208) throw new Error("Production coverage totals mismatch");
  const report = { checkedAt: new Date().toISOString(), origin: base.origin, mode: "read-only GET", articles: topics.length, levels: topics.length * 4, quizzes: quizCount, sourceMatchedArticles: topics.filter((t) => t.sourceMatched).length, domains, topics };
  await writeFile("content/live-verification-report.json", JSON.stringify(report, null, 2) + "\n");
  console.log(`Production verified: ${report.articles} articles / ${report.levels} levels / ${report.quizzes} quizzes / ${domains.length} domains`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
