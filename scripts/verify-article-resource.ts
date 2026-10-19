import assert from "node:assert/strict";
import { createArticleResource, type ArticlePayload } from "../src/lib/article-resource.ts";

const payload = (id: string): ArticlePayload => ({ article: {
  id, topic_id: id, is_published: true, created_at: "", updated_at: "",
  level_1_mental_model: id, level_2_core_engineering: id,
  level_3_troubleshooting: id, level_4_architecture_tradeoffs: id,
}, lesson: null });
const json = (id: string, age = 0) => new Response(JSON.stringify(payload(id)), { headers: { age: String(age) } });
async function main() {
  let time = 0, requests = 0;
  let resolve!: (response: Response) => void;
  const resource = createArticleResource(((_url: string, options: RequestInit) => {
    requests++;
    assert.equal(options.credentials, "omit");
    assert.equal(options.headers, undefined);
    return new Promise<Response>((done) => { resolve = done; });
  }) as typeof fetch, () => time);
  const first = resource.load("one"), duplicate = resource.load("one");
  assert.equal(first, duplicate); assert.equal(requests, 1);
  resolve(json("one")); await first;
  assert.equal(resource.peek("one")?.article.id, "one");
  assert.equal((await resource.load("one")).article.id, "one"); assert.equal(requests, 1);
  time = 60_001;
  const expired = resource.load("one"); assert.equal(requests, 2);
  resolve(json("edited", 55)); await expired;
  time += 5_000;
  assert.equal(resource.peek("one"), undefined, "CDN age extended stale content in memory");

  let failedRequests = 0;
  const retry = createArticleResource((async () => {
    if (++failedRequests === 1) return new Response("unavailable", { status: 503 });
    return json("recovered");
  }) as typeof fetch);
  await assert.rejects(retry.load("retry")); assert.equal(retry.peek("retry"), undefined);
  assert.equal((await retry.load("retry")).article.id, "recovered");

  const bounded = createArticleResource((async (url: string) => json(url)) as typeof fetch);
  for (let n = 0; n < 13; n++) await bounded.load(`topic-${n}`);
  assert.equal(bounded.peek("topic-0"), undefined);
  assert(bounded.peek("topic-12"));
  const hidden = createArticleResource((async () => new Response(JSON.stringify({ article: { is_published: false } }))) as typeof fetch);
  await assert.rejects(hidden.load("hidden")); assert.equal(hidden.peek("hidden"), undefined);
  const missing = createArticleResource((async () => new Response("missing", { status: 404 })) as typeof fetch);
  await assert.rejects(missing.load("missing")); assert.equal(missing.peek("missing"), undefined);
  console.log("Article resource verified: deduplication, instant reuse, TTL/edge age, retry, bounded memory, no credentials, no caching hidden/missing/failures.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
