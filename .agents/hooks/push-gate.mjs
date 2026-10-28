#!/usr/bin/env node
// PreToolUse 훅: `git push`는 현재 작업 트리가 하네스를 통과한 경우에만 허용합니다.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
process.chdir(root);

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { /* 입력 없음 */ }
const commandLine = String(input.toolCall?.args?.CommandLine ?? "");
if (!/\bgit\s+push\b/.test(commandLine)) { process.stdout.write("{}"); process.exit(0); }

function treeHash() {
  const files = spawnSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stdout.split("\0").filter(Boolean).sort();
  const hash = createHash("sha1");
  for (const file of files) { if (existsSync(file)) hash.update(file).update("\0").update(readFileSync(file)).update("\0"); }
  return hash.digest("hex");
}

const last = existsSync(".agents/harness-last.json") ? JSON.parse(readFileSync(".agents/harness-last.json", "utf8")) : null;
if (last?.ok && last.hash === treeHash()) {
  process.stdout.write(JSON.stringify({ decision: "allow", reason: `하네스 통과 확인 (${last.mode}, ${last.at})` }));
} else {
  process.stdout.write(JSON.stringify({ decision: "deny", reason: "푸시 전에 하네스를 통과해야 합니다. `npm run harness`를 실행하고, 통과한 뒤 코드를 더 바꿨다면 다시 실행하세요." }));
}
