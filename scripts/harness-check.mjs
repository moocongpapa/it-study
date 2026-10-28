#!/usr/bin/env node
// Fast static invariant check (<1s) for IT Atlas cross-file consistency and white-tone UI rules.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

// 1. Catalog & Domain integrity
const catalog = JSON.parse(readFileSync("src/lib/demo-catalog.json", "utf8"));
const domainIds = new Set(catalog.domains.map((d) => d.id));
const topicIds = new Set(catalog.topics.map((t) => t.id));
const topicSlugs = new Set(catalog.topics.map((t) => t.slug));

check(catalog.domains.length >= 10, `도메인 수 부족: ${catalog.domains.length}`);
check(catalog.topics.length >= 50, `토픽 수 부족: ${catalog.topics.length}`);

for (const topic of catalog.topics) {
  check(domainIds.has(topic.domain_id), `토픽 ${topic.slug}: 유효하지 않은 domain_id (${topic.domain_id})`);
}

for (const edge of catalog.prerequisites) {
  check(topicIds.has(edge.from_topic_id), `선수 관계 오류: 없는 from_topic_id (${edge.from_topic_id})`);
  check(topicIds.has(edge.to_topic_id), `선수 관계 오류: 없는 to_topic_id (${edge.to_topic_id})`);
  check(edge.from_topic_id !== edge.to_topic_id, `선수 관계 자기 참조: ${edge.from_topic_id}`);
}

// 2. Curated tracks slug sync
const tracksSrc = readFileSync("src/lib/curated-tracks.ts", "utf8");
for (const match of tracksSrc.matchAll(/topicSlugs:\s*\[([\s\S]*?)\]/g)) {
  for (const slugMatch of match[1].matchAll(/"([a-z0-9-]+)"/g)) {
    const slug = slugMatch[1];
    check(topicSlugs.has(slug), `curated-tracks.ts: 카탈로그에 없는 토픽 슬러그 "${slug}"`);
  }
}

// 3. White-tone flat UI invariant (no dark-theme regressions in src/)
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

const forbiddenDarkPatterns = [
  { re: /className="dark"/, label: 'html className="dark" 사용 금지 (화이트 톤 유지)' },
  { re: /bg-\[#0[0-9a-fA-F]{5}\]/, label: "어두운 배경 하드코딩(bg-[#0...]) 금지" },
];

for (const file of walk("src")) {
  const content = readFileSync(file, "utf8");
  for (const { re, label } of forbiddenDarkPatterns) {
    check(!re.test(content), `${file}: ${label}`);
  }
}

if (errors.length > 0) {
  console.error("❌ harness:check 실패:");
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}
console.log(`✓ harness:check 통과 (도메인 ${domainIds.size}개, 토픽 ${topicIds.size}개, 카탈로그·트랙·화이트톤 규칙 정상)`);
