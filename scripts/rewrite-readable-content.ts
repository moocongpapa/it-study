import { readFile, readdir, writeFile } from "node:fs/promises";
import { z } from "zod";

const GuideSchema = z.object({
  slug: z.string(), title: z.string().min(5), takeaway: z.string().min(10),
  why: z.string().min(20), analogy: z.string().min(30), steps: z.array(z.string().min(15)).min(3).max(4),
  diagram: z.string().startsWith("flowchart"), example: z.string().min(30),
  words: z.record(z.string(), z.string()), advancedWords: z.record(z.string(), z.string()),
  limit: z.string().min(20), question: z.string().min(10), answer: z.string().min(20),
  bridges: z.object({ "2": z.string().min(30), "3": z.string().min(30), "4": z.string().min(30) }),
});
const keys = ["level_1_mental_model", "level_2_core_engineering", "level_3_troubleshooting", "level_4_architecture_tradeoffs"] as const;
function table(words: Record<string, string>) {
  return "| 용어 | 쉬운 뜻 |\n|---|---|\n" + Object.entries(words).map(([term, meaning]) => `| ${term.replaceAll("|", "\\|")} | ${meaning.replaceAll("|", "\\|")} |`).join("\n");
}

async function main() {
  const catalog = JSON.parse(await readFile("src/lib/demo-catalog.json", "utf8")) as { topics: { slug: string }[] };
  const guides: z.infer<typeof GuideSchema>[] = [];
  for (const file of (await readdir("content/readability-guides")).filter((f) => f.endsWith(".json")).sort())
    guides.push(...z.array(GuideSchema).parse(JSON.parse(await readFile(`content/readability-guides/${file}`, "utf8"))));
  if (!guides.length || new Set(guides.map((g) => g.slug)).size !== guides.length || guides.some((g) => !catalog.topics.some((t) => t.slug === g.slug)))
    throw new Error("Readability guides must be unique and reference known topics");
  const output = [];
  for (const guide of guides) {
    const legacy = ["logic-gates", "processes-threads"].includes(guide.slug);
    const path = `content/${legacy ? "foundations" : "topics"}/${guide.slug}.md`;
    const source = await readFile(path, "utf8");
    const split = source.split(/<!-- (level:[1-4]|quizzes) -->/);
    const sections = new Map<string, string>();
    for (let i = 1; i < split.length; i += 2) sections.set(split[i], split[i + 1].trim());
    if (![1, 2, 3, 4].every((level) => sections.has(`level:${level}`))) throw new Error(`${guide.slug}: missing level`);
    sections.set("level:1", `# ${guide.title}\n\n> **한 문장으로:** ${guide.takeaway}\n\n## 왜 필요한가요?\n\n${guide.why}\n\n## 일상에서 떠올려 보기\n\n${guide.analogy}\n\n## 순서대로 따라가기\n\n${guide.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n\n\`\`\`mermaid\n${guide.diagram}\n\`\`\`\n\n## 작은 예로 확인하기\n\n${guide.example}\n\n## 처음 만나는 용어\n\n${table(guide.words)}\n\n**비유의 한계:** ${guide.limit}\n\n## 스스로 확인\n\n${guide.question}\n\n**답과 이유:** ${guide.answer}`);
    for (const level of [2, 3, 4] as const) {
      const original = sections.get(`level:${level}`)!.replace(/<!-- beginner-guide:start -->[\s\S]*?<!-- beginner-guide:end -->\s*/g, "");
      const heading = original.match(/^# [^\n]+\n*/);
      if (!heading) throw new Error(`${guide.slug}: level ${level} has no heading`);
      const intro = `<!-- beginner-guide:start -->\n## 읽기 전 길잡이\n\n${guide.bridges[String(level) as "2" | "3" | "4"]}\n\n${level === 2 ? `## 이 단계에서 만날 말\n\n${table(guide.advancedWords)}\n\n` : ""}<!-- beginner-guide:end -->\n\n`;
      sections.set(`level:${level}`, `${heading[0].trim()}\n\n${intro}${original.slice(heading[0].length).trim()}`);
    }
    const updated = [1, 2, 3, 4].map((level) => `<!-- level:${level} -->\n${sections.get(`level:${level}`)}`).join("\n") + (sections.has("quizzes") ? `\n<!-- quizzes -->\n${sections.get("quizzes")}` : "") + "\n";
    await writeFile(path, updated);
    output.push({ slug: guide.slug, ...Object.fromEntries(keys.map((key, i) => [key, sections.get(`level:${i + 1}`)])) });
  }
  await writeFile("content/readable-library.json", JSON.stringify(output, null, 2) + "\n");
  console.log(`Revised ${output.length} articles with beginner explanations and 200 level guides`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
