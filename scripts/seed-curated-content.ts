#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { validateTopicContent } from "./schemas/content-schema.ts";

for (const file of [".env.local", ".env"]) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) loadDotenv({ path, quiet: true });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply")) throw new Error("사용법: npm run content:seed-starter -- [--apply]");
  const apply = args.includes("--apply");
  const rows = JSON.parse(await readFile(resolve(process.cwd(), "content/starter-content.json"), "utf8")) as Array<{ slug: string }>;
  for (const row of rows) validateTopicContent(row);
  console.log(`검증된 입문 아티클 ${rows.length}개: ${rows.map((row) => row.slug).join(", ")}`);
  if (!apply) {
    console.log("미리보기입니다. DB에 저장하려면 --apply를 추가하세요.");
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const row of rows) {
    const content = validateTopicContent(row);
    const { data: topic, error: topicError } = await db.from("topics").select("id").eq("slug", row.slug).single();
    if (topicError || !topic) throw new Error(`${row.slug} 토픽 조회 실패: ${topicError?.message ?? "없음"}`);
    const { data, error } = await db.rpc("insert_generated_topic_content", {
      p_topic_id: topic.id,
      p_level_1_mental_model: content.level_1_mental_model,
      p_level_2_core_engineering: content.level_2_core_engineering,
      p_level_3_troubleshooting: content.level_3_troubleshooting,
      p_level_4_architecture_tradeoffs: content.level_4_architecture_tradeoffs,
      p_is_published: true,
      p_quizzes: content.quizzes,
    });
    if (error) throw new Error(`${row.slug} 저장 실패: ${error.message}`);
    if (data !== "inserted" && data !== "skipped_existing") throw new Error(`알 수 없는 저장 결과: ${String(data)}`);
    console.log(`${row.slug}: ${data}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
