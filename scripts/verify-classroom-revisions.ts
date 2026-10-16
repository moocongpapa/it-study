import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { Command } from "commander";
import { PGlite } from "@electric-sql/pglite";

const keys=["level_1_mental_model","level_2_core_engineering","level_3_troubleshooting","level_4_architecture_tradeoffs"] as const;
async function main(){
  const {sqlDir}=new Command().requiredOption("--sql-dir <path>","Guarded SQL exported by content:export-revisions").parse().opts<{sqlDir:string}>();
  const source=JSON.parse(await readFile("content/classroom/reference-library.json","utf8"));
  const edited=JSON.parse(await readFile("content/readable-library.json","utf8"));
  const catalog=JSON.parse(await readFile("src/lib/demo-catalog.json","utf8"));
  const db=new PGlite();
  try{
    await db.exec(`create table public.topics(id uuid primary key default gen_random_uuid(),slug text unique not null);
      create table public.articles(id uuid primary key default gen_random_uuid(),topic_id uuid unique references public.topics(id),level_1_mental_model text,level_2_core_engineering text,level_3_troubleshooting text,level_4_architecture_tradeoffs text,edit_count integer not null default 0);
      create function mark_edit() returns trigger language plpgsql as $$begin new.edit_count=old.edit_count+1;return new;end$$;
      create trigger mark_article_edit before update on public.articles for each row execute function mark_edit();`);
    for(const row of source){
      const id=(await db.query<{id:string}>("insert into public.topics(slug) values($1) returning id",[row.slug])).rows[0].id;
      await db.query(`insert into public.articles(topic_id,${keys.join(",")}) values($1,$2,$3,$4,$5)`,[id,...keys.map(k=>row[k])]);
    }
    const allHash=async()=>(await db.query<{hash:string}>("select md5(string_agg(row_to_json(a)::text,'|' order by a.id)) hash from public.articles a")).rows[0].hash;
    const hardwareSql=await readFile(resolve(sqlDir,"hardware.sql"),"utf8");
    await db.exec("update public.articles a set level_1_mental_model=a.level_1_mental_model||' concurrent edit' from public.topics t where t.id=a.topic_id and t.slug='logic-gates'");
    const before=await allHash();let rejected=false;
    try{await db.exec(hardwareSql);}catch{rejected=true;}
    assert(rejected,"Concurrent edit was overwritten");assert.equal(await allHash(),before,"Rejected domain partially changed");
    const original=source.find((r:{slug:string})=>r.slug==="logic-gates");
    await db.query("update public.articles a set level_1_mental_model=$1 from public.topics t where t.id=a.topic_id and t.slug='logic-gates'",[original.level_1_mental_model]);
    await db.exec("drop trigger mark_article_edit on public.articles;update public.articles set edit_count=0;create trigger mark_article_edit before update on public.articles for each row execute function mark_edit();");
    for(const domain of catalog.domains)await db.exec(await readFile(resolve(sqlDir,domain.slug+".sql"),"utf8"));
    const hashes=(await db.query<{slug:string;body_hash:string;edit_count:number}>(`select t.slug,md5(concat_ws('|',${keys.map(k=>"a."+k).join(",")})) body_hash,a.edit_count from public.articles a join public.topics t on t.id=a.topic_id`)).rows;
    assert.equal(hashes.length,edited.length);
    for(const row of edited){const actual=hashes.find(r=>r.slug===row.slug);assert(actual);assert.equal(actual.body_hash,createHash("md5").update(keys.map(k=>row[k]).join("|")).digest("hex"));assert.equal(actual.edit_count,1);}
    const after=await allHash();
    for(const domain of catalog.domains)await db.exec(await readFile(resolve(sqlDir,domain.slug+".sql"),"utf8"));
    assert.equal(await allHash(),after,"Repeat issued an unnecessary update");
    const report={checkedAt:new Date().toISOString(),articles:hashes.length,domainBatches:catalog.domains.length,concurrentEditRejected:true,domainAtomicity:true,repeatProducedNoUpdates:true,bodyHashesMatched:true};
    await writeFile("content/classroom/revision-verification-report.json",JSON.stringify(report,null,2)+"\n");console.log(report);
  }finally{await db.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
