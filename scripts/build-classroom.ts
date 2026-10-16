import { readFile, readdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import { LessonSchema, LessonSpecSchema } from "../src/lib/lesson-schema.ts";

const keys = ["level_1_mental_model", "level_2_core_engineering", "level_3_troubleshooting", "level_4_architecture_tradeoffs"] as const;
const sourceSchema = z.object({ slug: z.string(), ...Object.fromEntries(keys.map((key) => [key, z.string().min(300)])) }) as z.ZodType<{slug: string} & Record<typeof keys[number], string>>;
const load = async (path: string) => JSON.parse(await readFile(path, "utf8"));
const clean = (s: string) => s.replace(/<!-- beginner-guide:start -->[\s\S]*?<!-- beginner-guide:end -->/g, "").replace(/<!--[^]*?-->/g, "").trim();
const plain = (s: string) => s.replace(/```[\s\S]*?```/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*#`>]/g, "").replace(/\s+/g, " ").trim();
function tableOptions(source: string) {
  const lines = source.split("\n");
  const start = lines.findIndex((l, i) => l.startsWith("|") && /^\|[- :|]+\|$/.test(lines[i + 1] ?? ""));
  if (start < 0) throw new Error("Comparison table missing");
  const cells = (s: string) => s.split("|").slice(1, -1).map((c) => plain(c));
  const headers = cells(lines[start]);
  const rows: string[][] = [];
  for (let i = start + 2; i < lines.length && lines[i].startsWith("|"); i++) rows.push(cells(lines[i]));
  if (headers[0] === "기준") {
    return headers.slice(1).map((label, i) => ({ label, gain: `${rows[0][0]}: ${rows[0][i + 1]}`, cost: rows.slice(1, 3).map((r) => `${r[0]}: ${r[i + 1]}`).join(". ") }));
  }
  return rows.slice(0, 5).map((row) => ({ label: row[0], gain: row[1], cost: row.slice(2).join(". ") }));
}
function coreDebug(source: string, bridge: string, steps: string[]) {
  const paragraphs = clean(source).replace(/^# [^\n]+\n/, "").split(/\n\s*\n/).filter((s) => !s.startsWith("```") && !s.startsWith("|")).map(plain).filter(Boolean);
  const marked = (pattern: RegExp) => paragraphs.find((s) => pattern.test(s));
  return [paragraphs[0], bridge, "지금은 원인을 단정하지 말아요. 입력과 실행 조건을 고정하고, 아래 원리의 어느 지점이 어긋났는지 한 가지씩 확인해 봐요. " + steps[0], marked(/^수정[:：]/) ?? "상세 사례의 진단 순서를 따라 작은 변경부터 적용해 봐요. 바뀐 결과와 그대로인 결과를 함께 기록하는 것이 중요해요.", marked(/^재검증[:：]|^수정 후 확인/) ?? "처음 문제가 생긴 조건과 경계값에서 다시 확인해요. 기대한 결과뿐 아니라 오류와 성능이 나빠지지 않았는지도 살펴봐요."];
}
const visual = (slug: string, view: string) => "```learning\n" + JSON.stringify({ slug, view }) + "\n```";
const notes = (s: string) => "<!-- classroom-reference:start -->\n" + clean(s).replace(/^# [^\n]+\n/, "").trim() + "\n<!-- classroom-reference:end -->";

async function main() {
  const catalog = await load("src/lib/demo-catalog.json") as {topics: {slug: string; title: string}[]};
  const refs = z.array(sourceSchema).parse(await load("content/classroom/reference-library.json"));
  const specs = z.array(LessonSpecSchema).parse(await load("content/classroom/lesson-specs.json"));
  const guides = (await Promise.all((await readdir("content/readability-guides")).filter((f) => f.endsWith(".json")).map((f) => load("content/readability-guides/" + f)))).flat();
  const expansion = (await Promise.all((await readdir("content/expansion")).filter((f) => f.endsWith(".json")).map((f) => load("content/expansion/" + f)))).flatMap((d) => d.topics);
  const specBySlug = new Map(specs.map((s) => [s.slug, s]));
  const refBySlug = new Map(refs.map((r) => [r.slug, r]));
  if (specs.length !== catalog.topics.length || specBySlug.size !== specs.length || refs.length !== catalog.topics.length || refBySlug.size !== refs.length) throw new Error("Classroom coverage mismatch");
  const lessons = [], articles = [];
  for (const topic of catalog.topics) {
    const spec = specBySlug.get(topic.slug), ref = refBySlug.get(topic.slug);
    if (!spec || !ref) throw new Error("Missing lesson: " + topic.slug);
    const g = guides.find((g) => g.slug === topic.slug), e = expansion.find((e) => e.slug === topic.slug);
    if (!g && !e) throw new Error("Missing editorial source: " + topic.slug);
    const steps: string[] = g?.steps ?? e.steps;
    const options = e ? e.options.map(([label,gain,cost]:string[])=>({label,gain,cost})) : tableOptions(ref.level_4_architecture_tradeoffs);
    const extraWords:Record<string,string>={
      "BOLA/IDOR":"요청의 식별자를 바꿔 다른 사람의 자료에 접근하는 등, 자료별 권한 검사가 빠져 생기는 문제예요.",
      RLS:"데이터베이스가 행마다 누가 읽고 바꿀 수 있는지 검사하는 정책이에요.",
      revoke:"전에 허용했던 자격을 더 이상 쓸 수 없게 취소하는 일이에요.",
      claim:"토큰 안에 적힌 사용자나 권한 등에 관한 정보예요. 누가 발급했는지와 지금도 유효한 정보인지 확인해야 해요.",
      "키 회전":"서명·검증에 쓰는 키를 새 키로 교체하고 이전 키와의 전환을 관리하는 일이에요.",
      "키 회전·키 회수":"검증에 쓰는 키를 바꾸거나 더 이상 신뢰하지 않게 만드는 일이에요.",
      "멱등":"같은 요청을 반복해도 의도한 결과가 중복해서 생기지 않도록 정한 성질이에요.",
      "오버헤드":"원하는 일 외에 준비·관리·전달 등에 추가로 드는 비용이에요.",
      "직렬화":"자료를 저장하거나 보내기 좋은 형태로 바꾸는 일이에요.",
      "폴링":"준비됐는지 주기적으로 다시 물어보는 방식이에요.",
      "워킹셋":"특정 작업이 최근에 자주 사용하는 자료의 범위예요.",
      "복잡도":"입력이 커질 때 필요한 작업이나 저장 공간이 어떤 모양으로 늘어나는지 나타내는 말이에요.",
      "격리":"서로의 데이터나 실패가 영향을 주는 범위를 나누는 것이에요. 어떤 경계를 나눴는지 함께 확인해요.",
    };
    const optionText=(JSON.stringify(options)+ref.level_2_core_engineering+ref.level_3_troubleshooting).toLocaleLowerCase();
    const terms = spec.terms ?? (g ? Object.entries(g.words) : e.terms).slice(0,6);
    const advancedTerms=Object.entries({...Object.fromEntries(Object.entries(extraWords).filter(([term])=>optionText.includes(term.toLocaleLowerCase()))),...(g?.advancedWords??{}),...Object.fromEntries(terms)}).slice(0,16);
    const lesson = LessonSchema.parse({
      ...spec, title: topic.title, story: g?.analogy ?? e.analogy,
      takeaway: g?.takeaway ?? e.summary, why: g?.why ?? e.why,
      limit: g?.limit ?? e.boundary, steps: spec.labels.map((label, i) => ({label, body: steps[i]})),
      terms, advancedTerms,
      question: g?.question ?? e.quizzes[0][0], answer: g?.answer ?? e.quizzes[0][1] + " — " + e.quizzes[0][5],
      debug: e?.incident ?? coreDebug(ref.level_3_troubleshooting, g.bridges["3"], steps),
      options,
    });
    lessons.push(lesson);
    const bodies = [
      `# ${topic.title}\n\n> **오늘의 질문** · ${lesson.hook}\n\n먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.\n\n${visual(topic.slug,"explore")}\n\n## 익숙한 장면과 연결해요\n\n${lesson.story}\n\n## 선생님과 한 번 정리해요\n\n${lesson.why}\n\n**한 줄로 말하면:** ${lesson.takeaway}\n\n${visual(topic.slug,"words")}\n\n**비유의 한계도 알아둘까요?** ${lesson.limit}\n\n${visual(topic.slug,"recall")}`,
      `# 한 장면씩 원리를 따라가요\n\n이번에는 **${lesson.steps.map((s) => s.label).join(" → ")}** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.\n\n${visual(topic.slug,"trace")}\n\n## 여기서 연결해 봐요\n\n${lesson.takeaway}\n\n왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.\n\n${notes(ref.level_2_core_engineering)}`,
      `# 오늘은 문제를 찾는 탐정이에요\n\n정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.\n\n${visual(topic.slug,"debug")}\n\n## 해결 뒤에도 한 번 더\n\n고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.\n\n${notes(ref.level_3_troubleshooting)}`,
      `# 이번에는 네가 설계자예요\n\n아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.\n\n${visual(topic.slug,"decide")}\n\n## 이유까지 말하면 더 좋아요\n\n“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.\n\n${notes(ref.level_4_architecture_tradeoffs)}`,
    ];
    const row = {slug: topic.slug, ...Object.fromEntries(keys.map((key, i) => [key, bodies[i]]))};
    articles.push(row);
    const foundation = ["logic-gates", "processes-threads"].includes(topic.slug);
    const path = `content/${foundation ? "foundations" : "topics"}/${topic.slug}.md`;
    const current = await readFile(path, "utf8");
    const quiz = current.split("<!-- quizzes -->")[1];
    if (!quiz && !foundation) throw new Error("Quiz section missing: " + topic.slug);
    await writeFile(path, bodies.map((body, i) => `<!-- level:${i+1} -->\n${body}`).join("\n") + (quiz ? "\n<!-- quizzes -->" + quiz : "\n"));
  }
  await writeFile("src/lib/learning-lessons.json", JSON.stringify(lessons, null, 2) + "\n");
  await writeFile("content/readable-library.json", JSON.stringify(articles, null, 2) + "\n");
  console.log(`Built ${lessons.length} visual lessons and ${articles.length * 4} classroom chapters.`);
}
main().catch((error) => {console.error(error); process.exitCode = 1;});
