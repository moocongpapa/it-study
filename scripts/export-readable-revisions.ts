import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { Command } from "commander";
import { z } from "zod";

const fields = ["level_1_mental_model", "level_2_core_engineering", "level_3_troubleshooting", "level_4_architecture_tradeoffs"] as const;
const RowSchema = z.object({ slug: z.string(), level_1_mental_model: z.string().min(300), level_2_core_engineering: z.string().min(300), level_3_troubleshooting: z.string().min(300), level_4_architecture_tradeoffs: z.string().min(300) });

async function main() {
  const options = new Command().requiredOption("--baseline-file <path>", "JSON snapshot of slug/body_hash before editing")
    .requiredOption("--out-dir <path>", "Directory for guarded SQL; this script never writes to DB").parse().opts<{ baselineFile: string; outDir: string }>();
  const rows = z.array(RowSchema).min(1).parse(JSON.parse(await readFile("content/readable-library.json", "utf8")));
  const baseline = z.array(z.object({ slug: z.string(), body_hash: z.string().regex(/^[0-9a-f]{32}$/) })).min(1).parse(JSON.parse(await readFile(options.baselineFile, "utf8")));
  const hashBySlug = new Map(baseline.map((r) => [r.slug, r.body_hash]));
  if (hashBySlug.size !== baseline.length || new Set(rows.map((r) => r.slug)).size !== rows.length || rows.some((r) => !hashBySlug.has(r.slug))) throw new Error("Snapshot/revision coverage mismatch");
  const catalog = JSON.parse(await readFile("src/lib/demo-catalog.json", "utf8")) as { domains: { id: string; slug: string }[]; topics: { slug: string; domain_id: string }[] };
  const enriched = rows.map((row) => ({ ...row, old_hash: hashBySlug.get(row.slug)!, new_hash: createHash("md5").update(fields.map((f) => row[f]).join("|")).digest("hex") }));
  await mkdir(resolve(options.outDir), { recursive: true });
  for (const domain of catalog.domains) {
    const slugs = catalog.topics.filter((t) => t.domain_id === domain.id).map((t) => t.slug);
    const domainRows = enriched.filter((row) => slugs.includes(row.slug));
    if (!domainRows.length) continue;
    const payload = JSON.stringify(domainRows);
    if (payload.includes("$revision_payload$") || payload.includes("$readable_revision$")) throw new Error("SQL delimiter collision");
    const assignments = fields.map((f) => f + " = p.c->>'" + f + "'").join(",\n      ");
    const sql = [
      "-- Article-only edit; expected baseline protects concurrent changes.",
      "DO $readable_revision$",
      "DECLARE",
      "  payload jsonb := $revision_payload$" + payload + "$revision_payload$::jsonb;",
      "  matched integer;",
      "BEGIN",
      "  PERFORM 1 FROM public.articles a JOIN public.topics t ON t.id=a.topic_id",
      "    JOIN jsonb_array_elements(payload) p(c) ON p.c->>'slug'=t.slug ORDER BY a.id FOR UPDATE OF a;",
      "  SELECT count(*) INTO matched FROM public.articles a JOIN public.topics t ON t.id=a.topic_id",
      "    JOIN jsonb_array_elements(payload) p(c) ON p.c->>'slug'=t.slug",
      "    WHERE md5(concat_ws('|',a.level_1_mental_model,a.level_2_core_engineering,a.level_3_troubleshooting,a.level_4_architecture_tradeoffs)) IN (p.c->>'old_hash',p.c->>'new_hash');",
      "  IF matched <> jsonb_array_length(payload) THEN RAISE EXCEPTION 'Article changed or missing; entire domain revision aborted'; END IF;",
      "  UPDATE public.articles a SET " + assignments,
      "    FROM public.topics t JOIN jsonb_array_elements(payload) p(c) ON p.c->>'slug'=t.slug",
      "    WHERE a.topic_id=t.id AND md5(concat_ws('|',a.level_1_mental_model,a.level_2_core_engineering,a.level_3_troubleshooting,a.level_4_architecture_tradeoffs))=p.c->>'old_hash'",
      "      AND p.c->>'old_hash'<>p.c->>'new_hash';",
      "END $readable_revision$;",
      "SELECT t.slug, md5(concat_ws('|',a.level_1_mental_model,a.level_2_core_engineering,a.level_3_troubleshooting,a.level_4_architecture_tradeoffs)) AS body_hash",
      "FROM public.articles a JOIN public.topics t ON t.id=a.topic_id WHERE t.slug IN (" + slugs.map((s) => "'" + s + "'").join(",") + ") ORDER BY t.slug;",
      "",
    ].join("\n");
    await writeFile(resolve(options.outDir, domain.slug + ".sql"), sql);
  }
  await writeFile(resolve(options.outDir, "expected-hashes.json"), JSON.stringify(enriched.map((r) => ({ slug: r.slug, body_hash: r.new_hash })), null, 2) + "\n");
  console.log(`Exported ${rows.length} guarded article revisions to ${resolve(options.outDir)}`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
