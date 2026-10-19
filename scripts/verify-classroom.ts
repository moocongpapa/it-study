import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { z } from "zod";
import LessonVisual from "../src/components/learning/LessonVisual.tsx";
import { LessonSchema, LessonReferenceSchema, type Lesson } from "../src/lib/lesson-schema.ts";
import { splitClassroomReference } from "../src/lib/classroom-markdown.ts";
import { averageAndMedian, classificationCounts, CLASSIFICATION_SAMPLES, logicResult, queueTurn, readFourBits, vectorSimilarities, neuronOutput, trainNeuron, scheduleExample, ATTENTION_EXAMPLE } from "../src/lib/lesson-math.ts";

const load=async(path:string)=>JSON.parse(await readFile(path,"utf8"));
const keys=["level_1_mental_model","level_2_core_engineering","level_3_troubleshooting","level_4_architecture_tradeoffs"] as const;
const clean=(s:string)=>s.replace(/<!-- beginner-guide:start -->[\s\S]*?<!-- beginner-guide:end -->/g,"").replace(/<!--[^]*?-->/g,"").trim().replace(/^# [^\n]+\n/,"").trim();
function renderLesson(source:string, lesson?:Lesson) {
  const errors:unknown[][]=[],previous=console.error;
  let html:string;
  try {
    console.error=(...args:unknown[])=>{errors.push(args);};
    html=renderToStaticMarkup(createElement(LessonVisual,{source,lesson}));
  }finally{console.error=previous;}
  assert.equal(errors.length,0,"SSR warning: "+JSON.stringify(errors));
  return html;
}
async function main(){
  const catalog=await load("src/lib/demo-catalog.json");
  const lessons=z.array(LessonSchema).parse(await load("src/lib/learning-lessons.json"));
  const rows=await load("content/readable-library.json");
  const refs=await load("content/classroom/reference-library.json");
  const library=await load("content/library.json");
  const quizBaseline=await load("content/classroom/quiz-baseline.json");
  const refBySlug=new Map<string,Record<string,string>>(refs.map((r:Record<string,string>)=>[r.slug,r]));
  const ids=new Set(lessons.map(l=>l.slug)),rowBySlug=new Map<string,Record<string,string>>(rows.map((r:Record<string,string>)=>[r.slug,r]));
  assert.equal(lessons.length,catalog.topics.length);assert.equal(ids.size,lessons.length);assert.equal(rows.length,lessons.length);
  const distribution:Record<string,number>={};let blocks=0,ssrViews=0,retainedReferences=0;
  for(const lesson of lessons){
    const row=rowBySlug.get(lesson.slug),ref=refBySlug.get(lesson.slug);
    assert(row&&ref,lesson.slug+": source missing");
    distribution[lesson.kind]=(distribution[lesson.kind]??0)+1;
    for(const [index,key]of keys.entries()){
      assert(row[key].length>=300,lesson.slug+": short chapter");
      const references=[...row[key].matchAll(/```learning\n([\s\S]*?)```/g)].map(m=>LessonReferenceSchema.parse(JSON.parse(m[1])));
      assert(references.length>0,lesson.slug+": visual missing");
      for(const reference of references){
        assert.equal(reference.slug,lesson.slug);blocks++;
        const html=renderLesson(JSON.stringify(reference),lesson);
        assert(!html.includes("그림 참조를 확인하지 못했어요")&&!html.includes("이 주제의 그림을 준비하고 있어요"),lesson.slug+": SSR fallback");
        assert(html.includes("<button")||html.includes("type=\"range\""),lesson.slug+": static-only lesson");
        ssrViews++;
      }
      if(index){
        assert.equal(splitClassroomReference(row[key]).reference,clean(ref[key]),lesson.slug+": technical reference changed");
        retainedReferences++;
      }
    }
  }
  assert.equal(Object.keys(distribution).length,14,"All fourteen visual formats must have real lessons");
  for(const row of library){
    const digest=createHash("sha256").update(JSON.stringify(row.quizzes)).digest("hex");
    assert.equal(digest,quizBaseline[row.slug],row.slug+": quizzes changed");
  }
  assert.equal(Object.keys(quizBaseline).length,library.length);
  assert.deepEqual([0,1,2,3].map(x=>logicResult("AND",!!(x&2),!!(x&1))),[false,false,false,true]);
  assert.deepEqual([0,1,2,3].map(x=>logicResult("OR",!!(x&2),!!(x&1))),[false,true,true,true]);
  assert.equal(logicResult("NOT",true,false),false);assert.equal(logicResult("NOT",false,true),true);
  assert.equal(readFourBits(15,true),-1);assert.equal(readFourBits(8,true),-8);assert.equal(readFourBits(10),10);
  assert.deepEqual(classificationCounts(.5),{tp:5,fp:2,fn:1,tn:4});
  assert.deepEqual(classificationCounts(0),{tp:6,fp:6,fn:0,tn:0});
  assert.deepEqual(classificationCounts(1),{tp:0,fp:0,fn:6,tn:6});
  let previous=classificationCounts(0);
  for(let cut=1;cut<=100;cut++){
    const next=classificationCounts(cut/100);
    assert.equal(Object.values(next).reduce((a,b)=>a+b,0),CLASSIFICATION_SAMPLES.length);
    assert(next.tp<=previous.tp&&next.fp<=previous.fp);previous=next;
  }
  assert.deepEqual(averageAndMedian([50,55,60,65,100]),{mean:66,median:60});
  assert.deepEqual(averageAndMedian([50,55,60,65,0]),{mean:46,median:55});
  assert.deepEqual(queueTurn(0,6,3),{finished:3,waiting:3});
  assert.deepEqual(queueTurn(3,6,3),{finished:3,waiting:6});
  assert.deepEqual(queueTurn(6,0,8),{finished:6,waiting:0});
  assert.equal(vectorSimilarities(0).scores[0],1);assert.equal(vectorSimilarities(90).scores[1],1);
  assert(Math.abs(vectorSimilarities(Math.atan2(.6,.8)*180/Math.PI).scores[2]-1)<1e-12);
  for(const row of ATTENTION_EXAMPLE)assert(Math.abs(row.reduce((a,b)=>a+b,0)-1)<1e-12);
  assert.deepEqual(scheduleExample(3),{integrationStart:5,total:6,apiCritical:true,uiCritical:false});
  assert.deepEqual(scheduleExample(1),{integrationStart:4,total:5,apiCritical:false,uiCritical:true});
  assert.equal(scheduleExample(2).apiCritical,true);assert.equal(scheduleExample(2).uiCritical,true);
  for(const a of [0,1,4])for(const b of [0,1,4])for(const target of [0,1]){
    const before=neuronOutput(a,b,.8,-.5,-.2),w=trainNeuron(a,b,target,.8,-.5,-.2),after=neuronOutput(a,b,w.w1,w.w2,w.bias);
    assert(Math.abs(target-after)<=Math.abs(target-before)+1e-12,"Single-sample gradient moved away from target");
  }
  for(const source of ['{"slug":"unknown","view":"explore"}','{"slug":"logic-gates","view":"execute","code":"alert(1)"}','not json']){
    assert.match(renderLesson(source),/그림 참조|그림을 준비/);
  }
  const report={checkedAt:new Date().toISOString(),articles:rows.length,chapters:rows.length*4,visualBlocks:blocks,ssrViews,retainedReferences,unchangedQuizSets:library.length,formats:distribution,teachingModels:"truth tables, signed bits, queue conservation, classification boundary/monotonicity, mean/median, cosine similarity, gradient improvement, attention normalization, parallel schedule",unsafeReferenceFallbacks:3};
  await writeFile("content/classroom/verification-report.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
