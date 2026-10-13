#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import chalk from "chalk";
import pLimit from "p-limit";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createContentGenerator, type TopicBrief } from "./providers/index.ts";
import { validateTopicContent } from "./schemas/content-schema.ts";

for (const file of [".env.local", ".env"]) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) loadDotenv({ path, quiet: true });
}

type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
type DomainRow = { id: string; slug: string; title: string };
type TopicRow = { id: string; slug: string; title: string; summary: string; difficulty: Difficulty; domain_id: string };
type EdgeRow = { from_topic_id: string; to_topic_id: string };
type TopicIdRow = { topic_id: string };
type Candidate = TopicBrief & { domainSlug: string };
type Page<T> = { data: T[] | null; error: { message: string } | null };

interface CliOptions {
  domain?: string;
  topic?: string;
  limit?: number;
  concurrency: number;
  provider: string;
  model?: string;
  apply?: boolean;
  generateOnly?: boolean;
  dryRun?: boolean;
  publish?: boolean;
}

function positiveInt(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) throw new InvalidArgumentError("양의 정수를 입력하세요.");
  return Number(value);
}

function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL(또는 NEXT_PUBLIC_SUPABASE_URL)과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// PostgREST responses are capped by the project's max-rows setting. A stable
// order and explicit ranges prevent topics past the first page from vanishing.
async function allPages<T>(label: string, getPage: (from: number, to: number) => Promise<Page<T>>): Promise<T[]> {
  const pageSize = 500;
  const rows: T[] = [];
  for (let from = 0; ;) {
    const { data, error } = await getPage(from, from + pageSize - 1);
    if (error) throw new Error(`${label} 조회 실패: ${error.message}`);
    if (!data?.length) return rows;
    rows.push(...data);
    from += data.length;
  }
}

async function candidates(supabase: SupabaseClient, options: CliOptions): Promise<Candidate[]> {
  const [domains, topics, articles, quizzes, edges] = await Promise.all([
    allPages<DomainRow>("도메인", async (from, to) => await supabase.from("domains").select("id,slug,title").order("slug").range(from, to)),
    allPages<TopicRow>("토픽", async (from, to) => await supabase.from("topics").select("id,slug,title,summary,difficulty,domain_id").order("slug").range(from, to)),
    allPages<TopicIdRow>("아티클", async (from, to) => await supabase.from("articles").select("topic_id").order("topic_id").range(from, to)),
    allPages<TopicIdRow>("퀴즈", async (from, to) => await supabase.from("quizzes").select("topic_id").order("topic_id").order("id").range(from, to)),
    allPages<EdgeRow>("선수 관계", async (from, to) => await supabase.from("topic_prerequisites").select("from_topic_id,to_topic_id").order("id").range(from, to)),
  ]);
  const domainById = new Map(domains.map((domain) => [domain.id, domain]));
  const titleById = new Map(topics.map((topic) => [topic.id, topic.title]));
  const occupied = new Set([...articles, ...quizzes].map((row) => row.topic_id));
  const prereqs = new Map<string, string[]>();
  for (const edge of edges) {
    const title = titleById.get(edge.from_topic_id);
    if (title) prereqs.set(edge.to_topic_id, [...(prereqs.get(edge.to_topic_id) ?? []), title]);
  }

  const selected = topics.flatMap((topic): Candidate[] => {
    const domain = domainById.get(topic.domain_id);
    if (!domain || occupied.has(topic.id) || (options.domain && domain.slug !== options.domain)
      || (options.topic && topic.slug !== options.topic)) return [];
    return [{
      id: topic.id, slug: topic.slug, title: topic.title, summary: topic.summary,
      difficulty: topic.difficulty, domainTitle: domain.title, domainSlug: domain.slug,
      prerequisiteTitles: prereqs.get(topic.id) ?? [],
    }];
  });
  return options.limit ? selected.slice(0, options.limit) : selected;
}

async function main(): Promise<void> {
  const program = new Command()
    .name("content-generator")
    .description("빈 토픽의 4단계 아티클과 레벨별 퀴즈를 생성합니다. 기본 실행은 대상 조회만 합니다.")
    .option("-d, --domain <slug>", "도메인 슬러그 필터")
    .option("-t, --topic <slug>", "토픽 슬러그 필터")
    .option("-l, --limit <count>", "최대 처리 토픽 수", positiveInt)
    .option("-c, --concurrency <count>", "동시 LLM 요청 수 (최대 5)", positiveInt, 2)
    .option("-p, --provider <name>", "생성기 (openai | mock)", "openai")
    .option("-m, --model <name>", "모델 이름")
    .option("--generate-only", "LLM 생성 및 Zod 검증 후 저장하지 않음")
    .option("--dry-run", "--generate-only와 동일")
    .option("--apply", "검증된 결과를 원자적으로 DB에 저장")
    .option("--publish", "--apply 시 즉시 공개 (기본은 초안)")
    .parse(process.argv);
  const options = program.opts<CliOptions>();
  if (options.concurrency > 5) throw new Error("--concurrency는 1~5 사이여야 합니다.");
  if (options.apply && (options.generateOnly || options.dryRun)) throw new Error("--apply와 --generate-only/--dry-run을 동시에 사용할 수 없습니다.");
  if (options.publish && !options.apply) throw new Error("--publish는 --apply와 함께 사용하세요.");
  if (options.apply && options.provider === "mock") throw new Error("mock 생성기는 DB에 저장할 수 없습니다.");
  const mode = options.apply ? "저장" : options.generateOnly || options.dryRun ? "생성 검증" : "대상 미리보기";
  console.log(chalk.cyan(`콘텐츠 배치 · ${mode}`));
  const supabase = adminClient();
  const targets = await candidates(supabase, options);
  console.log(chalk.cyan(`대상 ${targets.length}개`));
  for (const topic of targets) console.log(`  ${topic.domainSlug} / ${topic.slug} — ${topic.title}`);
  if (!targets.length || (!options.apply && !options.generateOnly && !options.dryRun)) return;

  const generator = createContentGenerator({ provider: options.provider, model: options.model });
  const limiter = pLimit(options.concurrency);
  const controller = new AbortController();
  process.once("SIGINT", () => controller.abort());
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  await Promise.all(targets.map((topic) => limiter(async () => {
    if (controller.signal.aborted) return;
    try {
      const content = validateTopicContent(await generator.generate(topic, controller.signal));
      if (options.apply) {
        const { data, error } = await supabase.rpc("insert_generated_topic_content", {
          p_topic_id: topic.id,
          p_level_1_mental_model: content.level_1_mental_model,
          p_level_2_core_engineering: content.level_2_core_engineering,
          p_level_3_troubleshooting: content.level_3_troubleshooting,
          p_level_4_architecture_tradeoffs: content.level_4_architecture_tradeoffs,
          p_is_published: Boolean(options.publish),
          p_quizzes: content.quizzes,
        });
        if (error) throw new Error(`원자적 저장 실패: ${error.message}. 최신 마이그레이션을 적용했는지 확인하세요.`);
        if (data === "inserted") inserted++;
        else if (data === "skipped_existing") skipped++;
        else throw new Error(`알 수 없는 DB 응답: ${String(data)}`);
      } else inserted++;
      console.log(chalk.green(`${topic.slug}: ${options.apply ? "저장 완료" : "검증 완료"}`));
    } catch (error) {
      failed++;
      console.error(chalk.red(`${topic.slug}: ${error instanceof Error ? error.message : String(error)}`));
    }
  })));
  console.log(`완료: ${inserted} · 기존 콘텐츠 보존: ${skipped} · 실패: ${failed}`);
  if (failed || controller.signal.aborted) process.exitCode = 1;
}

main().catch((error) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
