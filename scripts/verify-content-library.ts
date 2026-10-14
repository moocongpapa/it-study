import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { JSDOM } from "jsdom";
import { PGlite } from "@electric-sql/pglite";
import pLimit from "p-limit";
import { readLibrary, librarySql } from "./content-library.ts";

const levelKeys = ["level_1_mental_model", "level_2_core_engineering", "level_3_troubleshooting", "level_4_architecture_tradeoffs"] as const;
function ensure(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main() {
  const rows = await readLibrary();
  const catalog = JSON.parse(await readFile("src/lib/demo-catalog.json", "utf8"));
  const expected: string[] = catalog.topics.filter((t: { slug: string }) => !["logic-gates", "processes-threads"].includes(t.slug)).map((t: { slug: string }) => t.slug);
  ensure(rows.length === expected.length && expected.every((slug) => rows.some((r) => r.slug === slug)), "48-topic coverage mismatch");
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  Object.assign(globalThis, { window: dom.window, document: dom.window.document });
  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
  const temp = await mkdtemp(join(tmpdir(), "it-study-content-"));
  const urls = new Set<string>();
  const answerCounts = [0, 0, 0, 0];
  const questions = new Set<string>();
  let diagrams = 0, pythonExamples = 0, jsExamples = 0, sqlExamples = 0;
  try {
    for (const row of rows) {
      const levels = levelKeys.map((key) => row[key]);
      ensure(levels.every((s) => s.length >= 300), `${row.slug}: article too short`);
      ensure(levels[0].includes("```mermaid") && levels[0].includes("비유의 한계"), `${row.slug}: mental model incomplete`);
      ensure(levels[1].includes("```"), `${row.slug}: engineering example missing`);
      ensure(/가상|재현/.test(levels[2]) && /재검증|수정 후 확인/.test(levels[2]), `${row.slug}: troubleshooting contract missing`);
      ensure(levels[3].includes("|---") && levels[3].includes("참고:"), `${row.slug}: tradeoffs or references missing`);
      const sampleDb = new PGlite();
      try {
        for (const [level, body] of levels.entries()) {
          ensure((body.match(/^```/gm) ?? []).length % 2 === 0, `${row.slug}: unbalanced fence`);
          for (const match of body.matchAll(/```([\w+-]+)\n([\s\S]*?)```/g)) {
            const [, language, source] = match;
            if (language === "mermaid") { await mermaid.parse(source); diagrams++; }
            if (language === "python") {
              const path = join(temp, `${row.slug}-${level}.py`);
              await writeFile(path, source); execFileSync("python3", [path], { timeout: 10000, stdio: "pipe" }); pythonExamples++;
            }
            if (language === "javascript" || language === "typescript") {
              const path = join(temp, `${row.slug}-${level}.${language === "typescript" ? "ts" : "mjs"}`);
              await writeFile(path, source);
              execFileSync("node", language === "typescript" ? ["--import", "tsx", path] : [path], { timeout: 10000, stdio: "pipe" }); jsExamples++;
            }
            if (language === "sql") { await sampleDb.exec(source); sqlExamples++; }
          }
          for (const m of body.matchAll(/\]\((https:\/\/[^)]+)\)/g)) urls.add(m[1]);
        }
      } finally { await sampleDb.close(); }
      for (const quiz of row.quizzes) {
        ensure(!questions.has(quiz.question), `${row.slug}: duplicate global question`); questions.add(quiz.question);
        answerCounts[quiz.answer_index]++;
      }
    }
  } finally { await rm(temp, { recursive: true, force: true }); dom.window.close(); }
  ensure(answerCounts.every((n) => n > 0), "Unbalanced answer positions");

  const db = new PGlite();
  let dbCounts;
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
    for (const path of ["supabase/migrations/20261013000000_init_schema.sql", "supabase/migrations/20261013060132_interactive_learning.sql", "supabase/migrations/20261013062613_content_batch_atomic_write.sql", "supabase/migrations/20261014000000_content_batch_guarded_write.sql", "supabase/seed.sql", "supabase/quiz_seed.sql"])
      await db.exec(await readFile(path, "utf8"));
    const starters = JSON.parse(await readFile("content/starter-content.json", "utf8"));
    await db.query(librarySql(starters));
    const before = await db.query("select level_1_mental_model from public.articles a join public.topics t on t.id=a.topic_id where t.slug='processes-threads'");
    const result = await db.query<{ outcome: string }>(librarySql(rows));
    ensure(result.rows.length === 48 && result.rows.every((x) => x.outcome === "inserted"), "Atomic insert incomplete");
    const repeat = await db.query<{ outcome: string }>(librarySql(rows));
    ensure(repeat.rows.every((x) => x.outcome === "skipped_existing"), "Repeat changed existing content");
    const after = await db.query("select level_1_mental_model from public.articles a join public.topics t on t.id=a.topic_id where t.slug='processes-threads'");
    ensure(JSON.stringify(before.rows) === JSON.stringify(after.rows), "Golden content was overwritten");
    dbCounts = (await db.query<{ articles: number; quizzes: number; uncovered: number }>(`select
      (select count(*)::int from public.articles where is_published) as articles,
      (select count(*)::int from public.quizzes) as quizzes,
      (select count(*)::int from public.topics t where (select count(distinct level) from public.quizzes q where q.topic_id=t.id)<>4) as uncovered`)).rows[0];
    ensure(dbCounts.articles === 50 && dbCounts.quizzes === 208 && dbCounts.uncovered === 0, "Full library database counts mismatch");
  } finally { await db.close(); }

  let references: Array<{ url: string; status: number | string }> = [];
  if (process.argv.includes("--links")) {
    const limit = pLimit(5);
    references = await Promise.all([...urls].map((url) => limit(async () => {
      try { const response = await fetch(url, { signal: AbortSignal.timeout(20000) }); await response.body?.cancel(); return { url, status: response.status }; }
      catch { return { url, status: "unreachable" }; }
    })));
    ensure(references.every((r) => typeof r.status === "number" && r.status < 400), `Reference errors: ${JSON.stringify(references.filter((r) => typeof r.status !== "number" || r.status >= 400))}`);
  }
  const report = { checkedAt: new Date().toISOString(), articles: rows.length, levels: rows.length * 4, quizzes: questions.size, answerCounts, diagrams, executedExamples: { python: pythonExamples, jsAndTs: jsExamples, sql: sqlExamples }, database: dbCounts, references, minLevelCharacters: levelKeys.map((key) => Math.min(...rows.map((r) => r[key].length))) };
  await writeFile("content/verification-report.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ ...report, references: `${references.length} checked` }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
