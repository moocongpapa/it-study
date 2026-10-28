#!/usr/bin/env node
// 푸시 후 확인: 현재 HEAD 커밋이 Vercel 프로덕션에 READY로 배포됐는지 폴링하고, 실제 응답(200)까지 확인합니다.
//   npm run harness:deploy                     (HEAD 기준)
//   HARNESS_PROD_URL=https://내도메인 npm run harness:deploy   (커스텀 도메인 응답까지 확인)
import { spawnSync } from "node:child_process";

const sha = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
const maxMinutes = 6;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findDeployment() {
  const run = spawnSync("npx", ["--yes", "vercel", "list", "--json", "--limit", "10"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (run.status !== 0) throw new Error(`vercel list 실패: ${run.stderr.trim().split("\n").pop()}`);
  const json = JSON.parse(run.stdout.slice(run.stdout.indexOf("{")));
  return json.deployments.find((d) => d.meta?.githubCommitSha === sha);
}

const deadline = Date.now() + maxMinutes * 60_000;
let deployment;
while (Date.now() < deadline) {
  deployment = findDeployment();
  if (deployment) console.log(`  · ${deployment.state} (${deployment.url})`);
  else console.log("  · 아직 이 커밋의 배포가 시작되지 않았어요. 대기 중...");
  if (deployment && ["READY", "ERROR", "CANCELED"].includes(deployment.state)) break;
  await sleep(15_000);
}

if (!deployment || deployment.state !== "READY") {
  console.error(`\n❌ 배포 실패 또는 시간 초과 (커밋 ${sha.slice(0, 7)}, 상태: ${deployment?.state ?? "없음"})`);
  process.exit(1);
}

const target = process.env.HARNESS_PROD_URL;
if (target) {
  const response = await fetch(target, { redirect: "follow" });
  if (!response.ok) { console.error(`\n❌ ${target} 응답 ${response.status}`); process.exit(1); }
  console.log(`  · ${target} → ${response.status}`);
} else {
  console.log("  · HARNESS_PROD_URL이 없어 응답 확인은 건너뜀 (Vercel 배포 READY만 확인)");
}
console.log(`\n✅ 배포 확인 완료 — 커밋 ${sha.slice(0, 7)}`);
