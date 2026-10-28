#!/usr/bin/env node
// 하네스 러너: 변경된 파일에 맞는 검증만 골라 실행하고, 결과를 .agents/harness-last.json에 기록합니다.
//   npm run harness         → quick (변경 영향 범위만)
//   npm run harness:full    → full  (모든 검증 + 프로덕션 빌드 + UI 스모크)
//   --fast                  → 느린 검증(content·build·ui)을 뺀 빠른 점검. Stop 훅 전용이며 푸시 허용 기록으로는 인정되지 않음
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const RESULT_PATH = ".agents/harness-last.json";
const mode = process.argv.includes("--full") ? "full" : process.argv.includes("--fast") ? "fast" : "quick";
const quiet = process.argv.includes("--quiet");

const sh = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** 커밋 여부와 무관하게 "현재 작업 트리 내용"을 식별하는 해시 (push 게이트와 공유). */
export function treeHash() {
  const files = sh("git", ["ls-files", "-co", "--exclude-standard", "-z"]).stdout.split("\0").filter(Boolean).sort();
  const hash = createHash("sha1");
  for (const file of files) {
    if (!existsSync(file)) continue;
    hash.update(file).update("\0").update(readFileSync(file)).update("\0");
  }
  return hash.digest("hex");
}

function changedFiles() {
  const status = sh("git", ["status", "--porcelain"]).stdout.split("\n").filter(Boolean).map((line) => line.slice(3).replace(/^.* -> /, ""));
  const unpushed = sh("git", ["diff", "--name-only", "@{u}..HEAD"]).stdout.split("\n").filter(Boolean);
  return [...new Set([...status, ...unpushed])];
}

/** when: 변경 파일 경로가 하나라도 일치하면 실행. null이면 항상 실행. */
const stages = [
  { name: "harness:check", cmd: ["npm", "run", "harness:check", "--silent"], when: null },
  { name: "typecheck", cmd: ["npm", "run", "typecheck", "--silent"], when: null },
  { name: "lint", cmd: ["npm", "run", "lint", "--silent"], when: null },
  { name: "db:verify", cmd: ["npm", "run", "db:verify", "--silent"], when: /^(supabase|scripts\/verify-schema)/ },
  { name: "completion:verify", cmd: ["npm", "run", "completion:verify", "--silent"], when: /^(src\/(lib|app\/api)|supabase|scripts\/verify-completion)/ },
  { name: "loading:verify", cmd: ["npm", "run", "loading:verify", "--silent"], when: /^(src\/(lib\/article|app\/api\/articles|components\/reader)|content\/|scripts\/verify-article)/ },
  { name: "practice:verify", cmd: ["npm", "run", "practice:verify", "--silent"], when: /^(src\/(lib\/practice|components\/practice|app\/\(dashboard\)\/practice)|scripts\/verify-practice)/ },
  { name: "content:verify", cmd: ["npm", "run", "content:verify", "--silent"], when: /^(content\/|scripts\/(content|build|rewrite|seed|verify-content))/, slow: true },
  { name: "content:verify-classroom", cmd: ["npm", "run", "content:verify-classroom", "--silent"], when: /^(content\/classroom|scripts\/(build-classroom|verify-classroom))/ },
  { name: "build", cmd: ["npm", "run", "build", "--silent"], when: /^(src\/|package(-lock)?\.json|next\.config|tests\/)/, slow: true },
  { name: "ui (Playwright: 오류·가로 스크롤·접근성)", cmd: ["npm", "run", "harness:ui", "--silent"], when: /^(src\/|tests\/|playwright\.config)/, slow: true },
];

const log = (text) => { if (!quiet) console.log(text); };
const changed = changedFiles();
const results = [];
let ok = true;

log(`\n하네스 실행 (${mode}) · 변경 파일 ${changed.length}개\n`);
for (const stage of stages) {
  const selected = mode === "fast" && stage.slow ? false
    : mode === "full" ? true
    : stage.when === null ? true
    : changed.some((file) => stage.when.test(file));
  if (!selected) { results.push({ name: stage.name, status: "skipped" }); log(`  - ${stage.name} (${mode === "fast" && stage.slow ? "fast 모드" : "변경 없음"}, 건너뜀)`); continue; }
  const started = Date.now();
  let run = sh(stage.cmd[0], stage.cmd.slice(1));
  if (run.status !== 0 && stage.name === "build" && /SecurityFatalError/.test(`${run.stdout}\n${run.stderr}`)) {
    run = sh(stage.cmd[0], stage.cmd.slice(1));
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const passed = run.status === 0;
  const tail = passed ? "" : `${run.stdout}\n${run.stderr}`.trim().split("\n").slice(-25).join("\n");
  results.push({ name: stage.name, status: passed ? "passed" : "failed", seconds: Number(seconds), tail });
  log(`  ${passed ? "✓" : "✗"} ${stage.name} (${seconds}s)`);
  if (!passed) { ok = false; log(tail.replace(/^/gm, "      ")); if (mode !== "full") break; }
}

mkdirSync(".agents", { recursive: true });
writeFileSync(RESULT_PATH, JSON.stringify({ ok, mode, hash: treeHash(), at: new Date().toISOString(), results }, null, 2));
log(`\n${ok ? "✅ 하네스 통과 — 커밋·푸시해도 됩니다." : "❌ 하네스 실패 — 위 오류를 고친 뒤 다시 실행하세요."}\n`);
process.exit(ok ? 0 : 1);
