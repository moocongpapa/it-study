#!/usr/bin/env node
// Stop 훅: 코드가 바뀐 채 에이전트가 멈추려 하면 quick 하네스를 돌리고, 실패 시 계속 작업하도록 되돌립니다.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
process.chdir(root);
const allow = () => { process.stdout.write(JSON.stringify({ decision: "allow" })); process.exit(0); };

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { /* 입력 없음 */ }
// 무한 루프 방지: 같은 응답에서 두 번 이상 되돌리지 않는다.
if (input.terminationReason !== "model_stop" || (input.executionNum ?? 1) > 2) allow();

const status = spawnSync("git", ["status", "--porcelain"], { encoding: "utf8" }).stdout;
const touchesCode = status.split("\n").some((line) => /\s(src|scripts|content|supabase)\//.test(line) || /package(-lock)?\.json|\.tsx?$/.test(line));
if (!touchesCode) allow();

const run = spawnSync("node", ["scripts/harness.mjs", "--fast", "--quiet"], { encoding: "utf8", timeout: 110_000 });
if (run.status === 0) allow();

let reason = "하네스(quick)가 실패했습니다. 오류를 고친 뒤 `npm run harness`로 다시 확인하세요.";
if (existsSync(".agents/harness-last.json")) {
  const last = JSON.parse(readFileSync(".agents/harness-last.json", "utf8"));
  const failed = last.results.find((r) => r.status === "failed");
  if (failed) reason += `\n[${failed.name}]\n${failed.tail}`;
}
process.stdout.write(JSON.stringify({ decision: "continue", reason }));
