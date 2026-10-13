import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const learnerId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function scalar(sql, params = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0] ?? {})[0];
}

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
  `);

  for (const path of [
    "supabase/migrations/20261013000000_init_schema.sql",
    "supabase/migrations/20261013060132_interactive_learning.sql",
    "supabase/migrations/20261013062613_content_batch_atomic_write.sql",
    "supabase/migrations/20261014000000_content_batch_guarded_write.sql",
    "supabase/seed.sql",
    "supabase/quiz_seed.sql",
  ]) {
    await db.exec(await readFile(path, "utf8"));
  }
  for (const path of [
    "supabase/migrations/20261013060132_interactive_learning.sql",
    "supabase/migrations/20261014000000_content_batch_guarded_write.sql",
    "supabase/seed.sql",
    "supabase/quiz_seed.sql",
  ]) {
    await db.exec(await readFile(path, "utf8"));
  }

  const counts = await db.query(`select
    (select count(*)::int from public.domains) as domains,
    (select count(*)::int from public.topics) as topics,
    (select count(*)::int from public.topic_prerequisites) as edges,
    (select count(*)::int from public.quizzes) as quizzes,
    (select count(*)::int from public.articles) as articles`);
  const count = counts.rows[0];
  assert(count.domains === 10 && count.topics === 50 && count.edges === 78 && count.quizzes === 12 && count.articles === 1,
    `Unexpected seed counts: ${JSON.stringify(count)}`);
  assert(await scalar("select not has_column_privilege('authenticated', 'public.quizzes', 'answer_index', 'SELECT')"),
    "answer_index must not be readable by authenticated clients");
  assert(await scalar("select not has_column_privilege('authenticated', 'public.quizzes', 'accepted_answers', 'SELECT')"),
    "accepted_answers must not be readable by authenticated clients");

  await db.query("insert into auth.users(id) values ($1), ($2)", [learnerId, otherId]);
  const topics = (await db.query("select id, slug from public.topics")).rows;
  const edges = (await db.query("select from_topic_id, to_topic_id from public.topic_prerequisites")).rows;
  const goldenId = topics.find((item) => item.slug === "processes-threads")?.id;
  assert(goldenId, "Golden topic missing");
  const quizzes = (await db.query("select id, level, question_type, answer_index, accepted_answers from public.quizzes where topic_id = $1 order by level, question_type", [goldenId])).rows;

  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${learnerId}';`);
  let locked = false;
  try { await db.query("select * from public.submit_quiz_answer($1, 0, null)", [quizzes[0].id]); }
  catch { locked = true; }
  assert(locked, "Locked quiz accepted an answer");

  const needed = new Set();
  function collect(target) {
    for (const edge of edges.filter((item) => item.to_topic_id === target)) {
      if (!needed.has(edge.from_topic_id)) { needed.add(edge.from_topic_id); collect(edge.from_topic_id); }
    }
  }
  collect(goldenId);
  const completed = new Set();
  while (completed.size < needed.size) {
    let advanced = false;
    for (const id of needed) {
      if (completed.has(id) || edges.some((edge) => edge.to_topic_id === id && !completed.has(edge.from_topic_id))) continue;
      await db.query("insert into public.user_node_progress(user_id,topic_id,is_completed,current_level,completed_at) values ($1,$2,true,4,now())", [learnerId, id]);
      completed.add(id);
      advanced = true;
    }
    assert(advanced, "Prerequisite graph cannot be topologically sorted");
  }

  let bypassRejected = false;
  try { await db.query("insert into public.user_node_progress(user_id,topic_id,is_completed,current_level,completed_at) values ($1,$2,true,4,now())", [learnerId, goldenId]); }
  catch { bypassRejected = true; }
  assert(bypassRejected, "Direct mastery bypass was accepted");
  let topicSwapRejected = false;
  try { await db.query("update public.user_node_progress set topic_id = $1 where user_id = $2 and topic_id = $3", [goldenId, learnerId, [...completed][0]]); }
  catch { topicSwapRejected = true; }
  assert(topicSwapRejected, "Completed row could be reassigned to a quiz-backed topic");

  const first = quizzes[0];
  const wrong = await db.query("select * from public.submit_quiz_answer($1, $2, $3)", [first.id, first.question_type === "multiple_choice" ? 1 : null, first.question_type === "short_answer" ? "wrong" : null]);
  assert(wrong.rows[0].passed === false && wrong.rows[0].explanation, "Wrong answer feedback missing");

  for (const quiz of quizzes) {
    const answer = quiz.question_type === "multiple_choice" ? [quiz.answer_index, null] : [null, quiz.accepted_answers[0]];
    const response = await db.query("select * from public.submit_quiz_answer($1, $2, $3)", [quiz.id, ...answer]);
    assert(response.rows[0].passed === true && response.rows[0].explanation, "Correct answer not recorded");
  }
  assert(Number(await scalar("select count(*) from public.user_quiz_passes where user_id = $1", [learnerId])) === quizzes.length,
    "Quiz pass rows missing");
  await db.query("insert into public.user_node_progress(user_id,topic_id,is_completed,current_level,completed_at) values ($1,$2,true,4,now())", [learnerId, goldenId]);
  assert(Number(await scalar("select count(*) from public.user_learning_days where user_id = $1", [learnerId])) === 1,
    "Learning day was not recorded");
  await db.exec(`set request.jwt.claim.sub = '${otherId}';`);
  assert(Number(await scalar("select count(*) from public.user_node_progress")) === 0,
    "Another user can read learner progress");
  assert(Number(await scalar("select count(*) from public.user_quiz_passes")) === 0,
    "Another user can read quiz passes");
  assert(Number(await scalar("select count(*) from public.user_learning_days")) === 0,
    "Another user can read learning days");

  // Test guarded insert RPC function
  await db.exec(`set role service_role;`);
  const testTopic = topics.find((item) => item.slug === "tcp-udp-handshake");
  assert(testTopic, "Topic tcp-udp-handshake missing");
  const originalPayload = JSON.stringify([
    { level: 1, question: "Test Question 1 for TCP?", choices: ["A", "B", "C", "D"], answer_index: 0, explanation: "Exp 1" },
    { level: 2, question: "Test Question 2 for TCP?", choices: ["A", "B", "C", "D"], answer_index: 1, explanation: "Exp 2" },
    { level: 3, question: "Test Question 3 for TCP?", choices: ["A", "B", "C", "D"], answer_index: 2, explanation: "Exp 3" },
    { level: 4, question: "Test Question 4 for TCP?", choices: ["A", "B", "C", "D"], answer_index: 3, explanation: "Exp 4" }
  ]);
  const insertResult = await db.query(`
    select public.insert_generated_topic_content(
      $1,
      'Level 1 mental model test text with enough length to simulate real data.',
      'Level 2 core engineering test text with enough length to simulate real data.',
      'Level 3 troubleshooting test text with enough length to simulate real data.',
      'Level 4 architecture tradeoffs test text with enough length to simulate real data.',
      true,
      $2::jsonb
    )
  `, [testTopic.id, originalPayload]);
  assert(insertResult.rows[0].insert_generated_topic_content === "inserted", "Fresh topic was not inserted");
  const articleRow = await db.query("select is_published from public.articles where topic_id = $1", [testTopic.id]);
  assert(articleRow.rows[0]?.is_published === true, "insert_generated_topic_content did not insert article");
  const quizRows = await db.query("select count(*)::int as count from public.quizzes where topic_id = $1", [testTopic.id]);
  assert(quizRows.rows[0]?.count === 4, "insert_generated_topic_content did not insert quizzes");

  const repeat = await db.query(`select public.insert_generated_topic_content($1, 'OVERWRITE', 'OVERWRITE', 'OVERWRITE', 'OVERWRITE', false, $2::jsonb)`,
    [testTopic.id, originalPayload]);
  assert(repeat.rows[0].insert_generated_topic_content === "skipped_existing", "Existing content was not skipped");
  assert(await scalar("select level_1_mental_model from public.articles where topic_id = $1", [testTopic.id]) !== "OVERWRITE",
    "Existing article was overwritten");
  assert(Number(await scalar("select count(*) from public.quizzes where topic_id = $1", [testTopic.id])) === 4,
    "Existing quizzes were modified");

  const invalidTopic = topics.find((item) => item.id !== goldenId && item.id !== testTopic.id);
  let invalidRejected = false;
  try {
    await db.query(`select public.insert_generated_topic_content($1, 'one', 'two', 'three', 'four', false, $2::jsonb)`,
      [invalidTopic.id, JSON.stringify([{ level: 1, question: "Only one", choices: ["A", "B", "C", "D"], answer_index: 0, explanation: "Explanation" }])]);
  } catch { invalidRejected = true; }
  assert(invalidRejected, "Malformed content was accepted");
  assert(Number(await scalar("select count(*) from public.articles where topic_id = $1", [invalidTopic.id])) === 0,
    "Rejected content left a partial article");

  console.log(`SQL verified: ${count.domains} domains, ${count.topics} topics, ${count.edges} edges, ${count.quizzes} quizzes; RLS, mastery guard, and guarded atomic content insert passed.`);
} finally {
  await db.close();
}
