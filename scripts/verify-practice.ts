import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PRACTICE_CASES } from "../src/lib/practice-cases.ts";
import { readPracticeDraft, exportPracticeWorkbook } from "../src/lib/practice-workbook.ts";
import { PracticeWorkbench } from "../src/components/practice/PracticeWorkbench.tsx";

async function main() {
const catalog = JSON.parse(await readFile("src/lib/demo-catalog.json", "utf8"));
const topics = new Set(catalog.topics.map((topic: { slug: string }) => topic.slug));
assert.equal(new Set(PRACTICE_CASES.map((lesson) => lesson.slug)).size, PRACTICE_CASES.length);
for (const lesson of PRACTICE_CASES) {
  assert(lesson.sources.length >= 2 && lesson.decisions.length >= 3 && lesson.worksheet.length >= 3);
  assert.equal(new Set(lesson.sources.map((source) => source.id)).size, lesson.sources.length);
  assert.equal(new Set(lesson.worksheet.map((field) => field.id)).size, lesson.worksheet.length);
  for (const decision of lesson.decisions) {
    assert(Number.isInteger(decision.correctIndex) && decision.correctIndex >= 0 && decision.correctIndex < decision.options.length);
    assert(decision.hint.length && decision.options.every((option) => option.explanation.length > 30));
  }
  lesson.related.forEach(({ slug }) => assert(topics.has(slug), `Broken topic link: ${slug}`));
  lesson.references.forEach(({ url }) => assert.equal(new URL(url).protocol, "https:"));

  // SSR cannot access browser storage; actual form is hydrated on the client.
  const markup = renderToStaticMarkup(createElement(PracticeWorkbench, { lesson }));
  assert(markup.includes("작성 양식을 준비하고 있어요."));
  assert(markup.includes(lesson.decisions[0].question));
  assert.equal(readPracticeDraft("broken json", lesson).checked.length, 0);
  assert.deepEqual(readPracticeDraft('{"version":99,"answers":{}}', lesson).answers, {});
  const field = lesson.worksheet[0].id;
  const restored = readPracticeDraft(JSON.stringify({
    version: 1, answers: { [field]: "가".repeat(5000), unknown: "ignore", [lesson.worksheet[1].id]: 17 },
    checked: [0, 0, -1, 0.5, "1", 999],
  }), lesson);
  assert.equal(restored.answers[field].length, 4000);
  assert.deepEqual(Object.keys(restored.answers), [field]);
  assert.deepEqual(restored.checked, [0]);
  const multiline = "내 판단: 원문을 확인한다.\n근거: 자료 1";
  const draft = readPracticeDraft(JSON.stringify({ version: 1, answers: { [field]: multiline }, checked: [0] }), lesson);
  const output = exportPracticeWorkbook(lesson, draft);
  assert(output.includes(multiline) && output.includes("- [x] ") && output.includes("- [ ] "));
  assert(output.includes(lesson.sources[0].body) && output.includes(lesson.references[0].url));
}
console.log(`Practice verified: ${PRACTICE_CASES.length} cases, topic links, decision feedback, SSR, corrupt/stale drafts, bounded input, multiline workbook export.`);

}
main().catch((error) => { console.error(error); process.exitCode = 1; });
