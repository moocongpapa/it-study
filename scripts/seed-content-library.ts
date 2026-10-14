import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { librarySql, readLibrary } from "./content-library.ts";

async function main() {
  const options = new Command().option("--apply", "Insert published articles using guarded RPC")
    .option("--project-ref <ref>", "Required target project ref for --apply")
    .option("--export-sql <directory>", "Write one atomic SQL statement per domain; no DB access")
    .parse().opts<{ apply?: boolean; projectRef?: string; exportSql?: string }>();
  const rows = await readLibrary();
  const catalog = JSON.parse(await readFile(resolve("src/lib/demo-catalog.json"), "utf8"));
  const topicBySlug = new Map<string, { domain_id: string }>(catalog.topics.map((t: { slug: string; domain_id: string }) => [t.slug, t]));
  if (rows.some((row) => !topicBySlug.has(row.slug))) throw new Error("Library contains unknown topic");
  console.log(`Validated ${rows.length} articles / ${rows.length * 4} quizzes`);
  if (options.exportSql) {
    if (options.apply) throw new Error("Choose --export-sql or --apply");
    await mkdir(resolve(options.exportSql), { recursive: true });
    for (const domain of catalog.domains) {
      const selected = rows.filter((r) => topicBySlug.get(r.slug)?.domain_id === domain.id);
      await writeFile(resolve(options.exportSql, `${domain.slug}.sql`), librarySql(selected));
    }
    console.log(`SQL exported to ${resolve(options.exportSql)}`);
    return;
  }
  if (!options.apply) { console.log("Dry run. Use --apply --project-ref <ref> to insert; existing content is preserved."); return; }
  config({ path: ".env.local", quiet: true });
  config({ path: ".env", quiet: true });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !options.projectRef) throw new Error("URL, service role key, and --project-ref are required");
  if (new URL(url).hostname !== `${options.projectRef}.supabase.co`) throw new Error("Target project mismatch");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const row of rows) {
    const { data: topic, error: lookupError } = await db.from("topics").select("id").eq("slug", row.slug).single();
    if (lookupError || !topic) throw new Error(`${row.slug}: topic lookup failed`);
    const { data, error } = await db.rpc("insert_generated_topic_content", {
      p_topic_id: topic.id, p_level_1_mental_model: row.level_1_mental_model,
      p_level_2_core_engineering: row.level_2_core_engineering,
      p_level_3_troubleshooting: row.level_3_troubleshooting,
      p_level_4_architecture_tradeoffs: row.level_4_architecture_tradeoffs,
      p_is_published: true, p_quizzes: row.quizzes,
    });
    if (error || !["inserted", "skipped_existing"].includes(data)) throw new Error(`${row.slug}: ${error?.message || "unexpected RPC result"}`);
    console.log(`${row.slug}: ${data}`);
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
