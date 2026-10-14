import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { validateTopicContent } from "./schemas/content-schema.ts";

const root = resolve(process.cwd(), "content/topics");
const keys = ["level_1_mental_model", "level_2_core_engineering", "level_3_troubleshooting", "level_4_architecture_tradeoffs"] as const;
const files = (await readdir(root)).filter((name) => name.endsWith(".md")).sort();
const rows = [];
for (const file of files) {
  const source = await readFile(resolve(root, file), "utf8");
  const segments = source.split(/<!-- (level:[1-4]|quizzes) -->/);
  const parts = new Map<string, string>();
  for (let i = 1; i < segments.length; i += 2) {
    if (parts.has(segments[i])) throw new Error(`${file}: duplicate section`);
    parts.set(segments[i], segments[i + 1].trim());
  }
  if (parts.size !== 5) throw new Error(`${file}: four levels and quizzes required`);
  const candidate = Object.fromEntries(keys.map((key, i) => [key, parts.get(`level:${i + 1}`)]));
  const content = validateTopicContent({ ...candidate, quizzes: JSON.parse(parts.get("quizzes") ?? "null") });
  const slug = file.slice(0, -3);
  rows.push({ slug, ...content });
}
await mkdir(resolve(process.cwd(), "content"), { recursive: true });
await writeFile(resolve(process.cwd(), "content/library.json"), JSON.stringify(rows, null, 2) + "\n");
console.log(`Built ${rows.length} articles, ${rows.length * 4} levels, ${rows.length * 4} quizzes.`);
