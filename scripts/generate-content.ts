#!/usr/bin/env tsx
import { Command } from "commander";
import chalk from "chalk";
import pLimit from "p-limit";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createContentGenerator, type ContentGenerator, type TopicBrief } from "./providers/index.ts";
import type { TopicContent } from "./schemas/content-schema.ts";

// Load environment variables (.env.local first, then .env)
for (const envPath of [resolve(process.cwd(), ".env.local"), resolve(process.cwd(), ".env")]) {
  if (existsSync(envPath)) {
    loadDotenv({ path: envPath });
  }
}

interface CliOptions {
  domain?: string;
  topic?: string;
  limit?: string;
  concurrency: string;
  provider: string;
  model?: string;
  force: boolean;
  dryRun: boolean;
  publish: boolean;
}

interface TargetTopicRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  domain_id: string;
  domain_slug: string;
  domain_title: string;
  prerequisite_titles: string[];
}

function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      chalk.red.bold("\n[환경 변수 누락 오류]"),
      chalk.red(
        "\nSupabase 연결을 위해 SUPABASE_URL(또는 NEXT_PUBLIC_SUPABASE_URL)과\n" +
        "SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필수적으로 필요합니다.\n" +
        ".env.local 파일에 키를 설정해 주세요."
      )
    );
    process.exit(1);
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchCandidateTopics(
  supabase: SupabaseClient,
  options: CliOptions
): Promise<TargetTopicRecord[]> {
  // 1. Fetch domains
  const { data: domains, error: domainError } = await supabase
    .from("domains")
    .select("id, slug, title")
    .order("display_order");
  if (domainError) throw new Error(`도메인 목록 조회 실패: ${domainError.message}`);

  const domainMap = new Map<string, { slug: string; title: string }>();
  for (const d of domains || []) {
    domainMap.set(d.id, { slug: d.slug, title: d.title });
  }

  // 2. Fetch topics
  let topicQuery = supabase
    .from("topics")
    .select("id, slug, title, summary, difficulty, domain_id, display_order")
    .order("display_order");

  if (options.topic) {
    topicQuery = topicQuery.eq("slug", options.topic);
  }

  const { data: topics, error: topicsError } = await topicQuery;
  if (topicsError) throw new Error(`토픽 목록 조회 실패: ${topicsError.message}`);
  if (!topics || topics.length === 0) return [];

  // Filter by domain slug if requested
  const filteredTopics = options.domain
    ? topics.filter((t) => domainMap.get(t.domain_id)?.slug === options.domain)
    : topics;

  // 3. Fetch existing articles to identify topics that already have content
  const { data: existingArticles, error: articlesError } = await supabase
    .from("articles")
    .select("topic_id, is_published, level_1_mental_model");
  if (articlesError) throw new Error(`기존 아티클 조회 실패: ${articlesError.message}`);

  const existingArticleMap = new Map<string, boolean>();
  for (const a of existingArticles || []) {
    const hasContent = Boolean(a.level_1_mental_model && a.level_1_mental_model.trim().length > 0);
    existingArticleMap.set(a.topic_id, hasContent);
  }

  // 4. Fetch prerequisites to build rich topic context
  const { data: edges, error: edgesError } = await supabase
    .from("topic_prerequisites")
    .select("from_topic_id, to_topic_id");
  if (edgesError) throw new Error(`선수 지식 관계 조회 실패: ${edgesError.message}`);

  const topicTitleMap = new Map<string, string>();
  for (const t of topics) {
    topicTitleMap.set(t.id, t.title);
  }

  const prereqMap = new Map<string, string[]>();
  for (const edge of edges || []) {
    const list = prereqMap.get(edge.to_topic_id) || [];
    const fromTitle = topicTitleMap.get(edge.from_topic_id);
    if (fromTitle) list.push(fromTitle);
    prereqMap.set(edge.to_topic_id, list);
  }

  // 5. Select topics without content (unless --force is specified)
  const candidateTopics: TargetTopicRecord[] = [];
  for (const t of filteredTopics) {
    const hasContent = existingArticleMap.get(t.id) ?? false;
    if (!options.force && hasContent) {
      continue; // Skip already generated topics
    }

    const domainInfo = domainMap.get(t.domain_id) || { slug: "unknown", title: "알 수 없음" };
    candidateTopics.push({
      id: t.id,
      slug: t.slug,
      title: t.title,
      summary: t.summary,
      difficulty: t.difficulty,
      domain_id: t.domain_id,
      domain_slug: domainInfo.slug,
      domain_title: domainInfo.title,
      prerequisite_titles: prereqMap.get(t.id) || [],
    });
  }

  if (options.limit) {
    const limitNum = parseInt(options.limit, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      return candidateTopics.slice(0, limitNum);
    }
  }

  return candidateTopics;
}

async function upsertContentToDatabase(
  supabase: SupabaseClient,
  topicId: string,
  content: TopicContent,
  isPublished: boolean
): Promise<void> {
  // 1. Try atomic write via RPC function if available
  const { error: rpcError } = await supabase.rpc("upsert_topic_content", {
    p_topic_id: topicId,
    p_level_1_mental_model: content.level_1_mental_model,
    p_level_2_core_engineering: content.level_2_core_engineering,
    p_level_3_troubleshooting: content.level_3_troubleshooting,
    p_level_4_architecture_tradeoffs: content.level_4_architecture_tradeoffs,
    p_is_published: isPublished,
    p_quizzes: content.quizzes,
  });

  if (!rpcError) {
    return;
  }

  // 2. Fallback to client-side sequential upserts
  console.warn(chalk.yellow(`  [Notice] RPC 미지원/오류 (${rpcError.message}), 직접 테이블 Upsert 수행`));

  // Upsert article
  const { error: articleError } = await supabase.from("articles").upsert(
    {
      topic_id: topicId,
      level_1_mental_model: content.level_1_mental_model,
      level_2_core_engineering: content.level_2_core_engineering,
      level_3_troubleshooting: content.level_3_troubleshooting,
      level_4_architecture_tradeoffs: content.level_4_architecture_tradeoffs,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "topic_id" }
  );

  if (articleError) {
    throw new Error(`아티클 Upsert 실패: ${articleError.message}`);
  }

  // Upsert quizzes
  const quizRows = content.quizzes.map((quiz) => ({
    topic_id: topicId,
    level: quiz.level,
    question: quiz.question,
    choices: quiz.choices,
    answer_index: quiz.answer_index,
    explanation: quiz.explanation,
    question_type: "multiple_choice",
    accepted_answers: [],
  }));

  const { error: quizError } = await supabase
    .from("quizzes")
    .upsert(quizRows, { onConflict: "topic_id,level,question" });

  if (quizError) {
    throw new Error(`퀴즈 Upsert 실패: ${quizError.message}`);
  }
}

async function main() {
  const program = new Command();

  program
    .name("content-generator")
    .description("Supabase 토픽 대상 LLM 4단계 심도 아티클 및 단계별 퀴즈 자동 생성 & Upsert CLI 배치")
    .option("-d, --domain <slug>", "특정 도메인 슬러그로 필터링 (예: operating-systems, hardware)")
    .option("-t, --topic <slug>", "특정 단일 토픽 슬러그로 필터링 (예: processes-threads)")
    .option("-l, --limit <number>", "처리할 최대 토픽 개수")
    .option("-c, --concurrency <number>", "동시 요청 수 제한 (p-limit)", "2")
    .option("-p, --provider <name>", "LLM 프로바이더 (openai | gemini | mock)", "openai")
    .option("-m, --model <name>", "LLM 모델명 (미지정 시 프로바이더 기본값 사용)")
    .option("-f, --force", "이미 콘텐츠가 있는 토픽도 덮어쓰기", false)
    .option("--dry-run", "DB에 저장하지 않고 생성 및 Zod 검증만 수행", false)
    .option("--publish", "생성 후 즉시 공개(is_published=true) 상태로 저장", true)
    .option("--no-publish", "비공개 초안(is_published=false) 상태로 저장")
    .parse(process.argv);

  const options = program.opts<CliOptions>();
  const concurrency = Math.max(1, parseInt(options.concurrency, 10) || 2);

  console.log(chalk.cyan.bold("\n========================================================"));
  console.log(chalk.cyan.bold(" 🚀 IT Knowledge Mastery — LLM 콘텐츠 자동 생성 파이프라인"));
  console.log(chalk.cyan.bold("========================================================"));
  console.log(chalk.gray(`• Provider     : `) + chalk.greenBright(options.provider));
  if (options.model) console.log(chalk.gray(`• Model        : `) + chalk.greenBright(options.model));
  console.log(chalk.gray(`• Concurrency  : `) + chalk.yellow(concurrency));
  console.log(chalk.gray(`• Force Mode   : `) + (options.force ? chalk.red("ON (덮어쓰기)") : chalk.blue("OFF (신규만)")));
  console.log(chalk.gray(`• Dry-Run      : `) + (options.dryRun ? chalk.magenta("ON (DB 쓰기 생략)") : chalk.gray("OFF")));
  console.log(chalk.gray(`• Publish      : `) + (options.publish ? chalk.green("true (즉시 공개)") : chalk.yellow("false (초안)")));
  if (options.domain) console.log(chalk.gray(`• Domain Filter: `) + chalk.whiteBright(options.domain));
  if (options.topic) console.log(chalk.gray(`• Topic Filter : `) + chalk.whiteBright(options.topic));
  console.log(chalk.cyan("--------------------------------------------------------\n"));

  // 1. Initialize Supabase Admin Client
  const supabase = getSupabaseAdminClient();

  // 2. Initialize LLM Generator
  let generator: ContentGenerator;
  try {
    generator = createContentGenerator({
      provider: options.provider,
      model: options.model,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red.bold("\n[생성기 초기화 오류]"), chalk.red(msg));
    process.exit(1);
  }

  // 3. Find candidate topics
  console.log(chalk.blue("🔍 처리 대상 토픽 조회 중..."));
  let candidateTopics: TargetTopicRecord[];
  try {
    candidateTopics = await fetchCandidateTopics(supabase, options);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red.bold("\n[토픽 조회 오류]"), chalk.red(msg));
    process.exit(1);
  }

  if (candidateTopics.length === 0) {
    console.log(chalk.green("✨ 처리할 미생성 토픽이 없습니다. 모든 토픽이 이미 최신 상태입니다."));
    console.log(chalk.gray("   (기존 토픽을 강제로 재생성하려면 --force 옵션을 사용하세요)\n"));
    return;
  }

  console.log(chalk.cyan(`📋 총 ${chalk.bold(candidateTopics.length)}개의 토픽이 생성 대상으로 선정되었습니다.`));
  console.log(chalk.gray("--------------------------------------------------------"));

  // 4. Run batch processing with p-limit
  const limit = pLimit(concurrency);
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  const tasks = candidateTopics.map((topic, index) => {
    return limit(async () => {
      const topicIndexStr = `[${index + 1}/${candidateTopics.length}]`;
      const topicTag = `[${topic.domain_slug}] ${topic.title} (${topic.slug})`;
      console.log(chalk.blueBright(`\n${topicIndexStr} 시작: `) + chalk.bold(topicTag));

      const brief: TopicBrief = {
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        summary: topic.summary,
        difficulty: topic.difficulty,
        domainTitle: topic.domain_title,
        prerequisiteTitles: topic.prerequisite_titles,
      };

      const topicStartTime = performance.now();

      try {
        // Step A: LLM generation & Zod validation
        process.stdout.write(chalk.gray(`  └─ LLM 아티클(Level 1~4) 및 퀴즈 생성 중... `));
        const content = await generator.generate(brief);
        const elapsedSec = ((performance.now() - topicStartTime) / 1000).toFixed(1);
        process.stdout.write(chalk.green(`완료 (${elapsedSec}s)\n`));

        // Step B: DB Upsert (unless --dry-run)
        if (options.dryRun) {
          console.log(chalk.magenta(`  └─ [Dry-Run] DB Upsert 건너뜀 (검증 성공)`));
        } else {
          process.stdout.write(chalk.gray(`  └─ Supabase DB에 원자적 Upsert 중... `));
          await upsertContentToDatabase(supabase, topic.id, content, options.publish);
          process.stdout.write(chalk.green(`성공\n`));
        }

        console.log(
          chalk.greenBright(`  ✔ ${topic.title} 처리 완료: `) +
          chalk.gray(`아티클 4레벨 + 퀴즈 4문항 정상 반영`)
        );
        successCount++;
      } catch (err: unknown) {
        failCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`  ✖ ${topic.title} 처리 실패: `) + chalk.redBright(errMsg));
      }
    });
  });

  await Promise.all(tasks);

  const totalElapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(chalk.cyan.bold("\n========================================================"));
  console.log(chalk.cyan.bold(" 🏁 배치 작업 완료 보고"));
  console.log(chalk.cyan.bold("========================================================"));
  console.log(chalk.gray(`• 총 대상 토픽 : `) + chalk.bold(candidateTopics.length));
  console.log(chalk.gray(`• 성공        : `) + chalk.greenBright.bold(`${successCount}개`));
  console.log(chalk.gray(`• 실패        : `) + (failCount > 0 ? chalk.redBright.bold(`${failCount}개`) : chalk.gray("0개")));
  console.log(chalk.gray(`• 총 소요 시간 : `) + chalk.yellow(`${totalElapsedSec}초`));
  console.log(chalk.cyan.bold("========================================================\n"));

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red.bold("\n치명적 오류 발생:"), err);
  process.exit(1);
});
