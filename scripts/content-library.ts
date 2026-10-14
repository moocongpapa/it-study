import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateTopicContent, type TopicContent } from "./schemas/content-schema.ts";

export type LibraryRow = TopicContent & { slug: string };
export async function readLibrary(): Promise<LibraryRow[]> {
  const raw: unknown = JSON.parse(await readFile(resolve(process.cwd(), "content/library.json"), "utf8"));
  if (!Array.isArray(raw)) throw new Error("Content library must be an array");
  const seen = new Set<string>();
  return raw.map((item) => {
    const slug = item?.slug;
    if (typeof slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || seen.has(slug))
      throw new Error(`Invalid or duplicate slug: ${slug}`);
    seen.add(slug);
    return { slug, ...validateTopicContent(item) };
  });
}

export function librarySql(rows: LibraryRow[]): string {
  const json = JSON.stringify(rows);
  if (json.includes("$it_study_content$")) throw new Error("SQL delimiter collision");
  return `WITH payload AS (
  SELECT value AS c FROM jsonb_array_elements($it_study_content$${json}$it_study_content$::jsonb)
)
SELECT t.slug, public.insert_generated_topic_content(
  t.id, c->>'level_1_mental_model', c->>'level_2_core_engineering',
  c->>'level_3_troubleshooting', c->>'level_4_architecture_tradeoffs',
  true, c->'quizzes'
) AS outcome
FROM payload JOIN public.topics t ON t.slug=c->>'slug';\n`;
}
