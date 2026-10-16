import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const learner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const migration = "supabase/migrations/20261016141247_manual_topic_completion.sql";
const one = async (sql, params = []) => (await db.query(sql, params)).rows[0];
const complete = async (topic, done) => (await one("select public.set_topic_completion($1,$2) saved", [topic, done])).saved;
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated, anon, service_role;`);
  for (const path of ["supabase/migrations/20261013000000_init_schema.sql", "supabase/migrations/20261013060132_interactive_learning.sql", "supabase/seed.sql", "supabase/quiz_seed.sql", migration, migration]) {
    await db.exec(await readFile(path, "utf8"));
  }
  await db.query("insert into auth.users values($1),($2)", [learner,other]);
  const topic = (await one("select id from topics where slug='processes-threads'")).id;
  const quiz = (await one("select id from quizzes where topic_id=$1 limit 1", [topic])).id;
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${learner}';`);
  // A learner may mark any article read; that does not assert quiz mastery.
  const marked = await complete(topic,true);
  assert(marked.is_completed && marked.completion_source === "manual");
  assert.equal(marked.self_assessment,null);
  assert.equal(new Date(marked.next_review_at)-new Date(marked.last_reviewed_at),86400000);
  assert.equal((await one("select count(*)::int n from user_quiz_passes")).n,0);
  assert.equal((await one("select count(*)::int n from user_learning_days")).n,1);
  assert.deepEqual(await complete(topic,true),marked,"Repeat reset the review schedule or timestamp");
  // Simulate a quiz request which read 'not complete' before the manual mark.
  await db.query("insert into user_node_progress(user_id,topic_id,is_completed,current_level) values($1,$2,false,2) on conflict(user_id,topic_id) do nothing",[learner,topic]);
  await db.query("update user_node_progress set is_completed=false,current_level=2,completed_at=null where user_id=$1 and topic_id=$2 and is_completed=false",[learner,topic]);
  assert.equal((await one("select is_completed from user_node_progress where topic_id=$1",[topic])).is_completed,true,"Stale quiz progress erased a manual mark");
  await assert.rejects(db.query("update user_node_progress set completion_source='quiz' where topic_id=$1",[topic]),"Manual completion was promoted to fake quiz mastery");
  await assert.rejects(db.query("select * from submit_quiz_answer($1,0,null)",[quiz]),"Manual completion skipped quiz prerequisites");
  const reset = await complete(topic,false);
  assert.equal(reset.is_completed,false); assert.equal(reset.completed_at,null); assert.equal(reset.next_review_at,null);
  assert.deepEqual(await complete(topic,false),reset,"Repeat undo wrote again");
  await complete(topic,true);
  await db.exec(`set request.jwt.claim.sub='${other}';`);
  assert.equal((await one("select count(*)::int n from user_node_progress")).n,0);
  await assert.rejects(db.query("insert into user_node_progress(user_id,topic_id,is_completed,current_level,completed_at,completion_source) values($1,$2,true,4,now(),'manual')",[learner,topic]));
  const otherProgress = await complete(topic,true);
  assert(otherProgress.is_completed);
  await complete(topic,false);
  await db.exec(`set request.jwt.claim.sub='${learner}';`);
  assert.equal((await one("select is_completed from user_node_progress where topic_id=$1",[topic])).is_completed,true,"Another user's undo changed learner progress");
  await assert.rejects(db.query("select set_topic_completion($1,true,6::smallint)",[topic]));
  await assert.rejects(db.query("select set_topic_completion($1,null)",[topic]));
  await assert.rejects(db.query("select set_topic_completion('99999999-9999-4999-8999-999999999999',true)"));
  await db.exec("set request.jwt.claim.sub='';");
  await assert.rejects(complete(topic,true),"Missing session was accepted");
  await db.exec("set role anon;");
  await assert.rejects(complete(topic,true),"Anonymous role can execute completion RPC");
  await db.exec("reset role;");
  assert.equal((await one("select count(*)::int n from user_quiz_passes")).n,0);
  assert.equal((await one("select count(*)::int n from quizzes")).n,12);
  console.log("Completion verified: manual mark/undo, repeat safety, 1-day review, quiz separation, RLS ownership, session/input checks, migration reapply.");
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await db.close(); }
