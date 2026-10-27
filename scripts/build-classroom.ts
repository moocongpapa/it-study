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
function activityFor(lesson: { kind: string; labels: string[]; panels?: {label: string}[]; buckets?: string[] }) {
  if (lesson.kind === "compare") return `${lesson.panels![0].label}과 ${lesson.panels![1].label}을 번갈아 선택하세요. 바로 아래 설명에서 무엇을 공유하고 무엇이 달라지는지 비교합니다. 버튼을 누르는 것보다 차이를 한 가지 말해 보는 것이 목표예요.`;
  if (lesson.kind === "sort") return `사례가 ${lesson.buckets![0]}과 ${lesson.buckets![1]} 중 어디에 해당하는지 골라 보세요. 고른 뒤 나오는 이유를 읽고, 같은 기준으로 다음 사례를 판단합니다.`;
  if (lesson.kind === "sequence") return `${lesson.labels.join(" → ")} 순서로 읽어 보세요. 뒤의 과정에서 필요한 것이 앞에서 어떻게 준비되는지 찾습니다. 숫자는 읽는 순서이며 모든 상황이 정확히 세 단계라는 뜻은 아닙니다.`;
  const instructions: Record<string,string> = {
    bits: "비트를 하나씩 바꾸며 오른쪽의 숫자가 어떻게 달라지는지 보세요. 각 자리의 값과 부호를 읽는 규칙을 구분합니다.",
    gate: "입력을 하나씩 바꾸며 출력을 보세요. AND와 OR에서 같은 입력이 다른 결과를 만드는 경우를 찾습니다.",
    capacity: "들어오는 양과 처리하는 양을 다르게 설정한 뒤 한 차례 진행하세요. 처리하지 못한 요청이 대기열에 남는지 확인합니다. 실제 시스템의 시간을 예측하는 측정 도구는 아닙니다.",
    growth: "입력 크기를 바꾸며 각 곡선이 늘어나는 모양을 비교하세요. 세로 값은 단순화한 연산 수이며 실제 실행 시간은 아닙니다.",
    distribution: "한 점수만 크게 바꿔 보세요. 평균과 중앙값 중 어느 값이 더 크게 움직이는지 비교합니다.",
    threshold: "판정 기준을 움직이며 맞게 찾은 것, 잘못 표시한 것, 놓친 것의 수를 비교하세요. 정밀도와 재현율이 답하는 질문은 서로 다릅니다.",
    vector: "방향을 바꾸며 어떤 벡터의 유사도가 높아지는지 보세요. 가까운 방향이 이 예시의 유사함을 뜻하며 사실성이나 품질 점수는 아닙니다.",
    network: "입력을 바꾼 뒤 ‘한 번 학습’을 눌러 예측이 어떻게 움직이는지 보세요. 학습 버튼은 정한 목표와의 차이를 줄이려 가중치를 조정합니다. 실제 대형 모델을 그대로 재현한 것은 아닙니다.",
    attention: "토큰을 하나 골라 다른 토큰에 주는 가중치를 비교하세요. 예시로 정한 숫자이며 실제 모델의 판단 원인을 증명하는 값은 아닙니다.",
    kanban: "진행 중 작업의 제한을 바꾼 뒤 새 작업을 시작해 보세요. 제한에 걸릴 때는 진행 중인 일을 먼저 끝내야 합니다.",
    schedule: "한 작업의 소요 시간을 바꾸고 전체 완료일을 보세요. 작업 하나가 빨라져도 전체 일정은 그대로인 경우를 찾아봅니다.",
  };
  if (!instructions[lesson.kind]) throw new Error("Activity guidance missing: " + lesson.kind);
  return instructions[lesson.kind];
}
const visual = (slug: string, view: string) => "```learning\n" + JSON.stringify({ slug, view }) + "\n```";
const notes = (s: string) => "<!-- classroom-reference:start -->\n" + clean(s).replace(/^# [^\n]+\n/, "").trim() + "\n<!-- classroom-reference:end -->";

async function main() {
  const catalog = await load("src/lib/demo-catalog.json") as {topics: {slug: string; title: string}[]};
  const refs = z.array(sourceSchema).parse(await load("content/classroom/reference-library.json"));
  const specs = z.array(LessonSpecSchema).parse(await load("content/classroom/lesson-specs.json"));
  const examples = z.record(z.string(), z.string().min(50).max(2000)).parse(await load("content/classroom/worked-examples.json"));
  const overrides = await load("content/classroom/teaching-overrides.json");
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
    const options = overrides[topic.slug]?.options ?? (e ? e.options.map(([label,gain,cost]:string[])=>({label,gain,cost})) : tableOptions(ref.level_4_architecture_tradeoffs));
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
      example: g?.example ?? examples[topic.slug], activity: activityFor(spec),
      ...(e ? { debug: e.incident } : {}),
      options, ...overrides[topic.slug],
    });
    lessons.push(lesson);
    const glossary = visual(topic.slug,"words");
    const bodies = [
      `# ${topic.title}\n\n> **먼저 한 문장:** ${lesson.takeaway}\n\n${lesson.why}\n\n## 먼저 알아둘 말\n\n${glossary}\n\n## 작은 예로 이해하기\n\n${lesson.example}\n\n## 익숙한 장면과 연결하기\n\n${lesson.story}\n\n**비유의 한계 — 이 점은 달라요:** ${lesson.limit}\n\n## 직접 확인하기\n\n${lesson.activity}\n\n${visual(topic.slug,"explore")}\n\n${visual(topic.slug,"recall")}`,
      `# ${topic.title} · 작동 원리\n\n${g?.bridges["2"] ?? e.explanation}\n\n## 전체 흐름부터 보기\n\n${visual(topic.slug,"trace")}\n\n## 예제와 내부 동작\n\n아래 자료를 읽을 때 **입력 → 바뀌는 값이나 상태 → 결과**를 찾아보세요. 모르는 말은 밑줄 표시를 눌러 뜻을 확인할 수 있어요.\n\n${notes(ref.level_2_core_engineering)}`,
      `# ${topic.title} · 문제 해결\n\n${g?.bridges["3"] ?? "아래는 학습용 가상 사례입니다. 확인한 사실과 아직 확인하지 않은 원인 후보를 나눠 읽어 보세요."}\n\n${lesson.debug ? visual(topic.slug,"debug") + "\n\n" : ""}## 구체적인 사례와 확인 방법\n\n같은 증상에도 원인이 여럿일 수 있어요. 먼저 발생 조건을 기록하고 증상을 재현할 수 있는지 확인하세요. **관찰한 증상 → 확인할 자료 → 수정 → 수정 후 확인(같은 조건으로 재검증)**을 연결해서 읽습니다.\n\n${notes(ref.level_3_troubleshooting)}`,
      `# ${topic.title} · 실무 선택\n\n${g?.bridges["4"] ?? e.decision}\n\n## 선택지를 비교해 보기\n\n방법을 하나 고르면 이득과 부담을 함께 볼 수 있어요. 어떤 조건을 중요하게 보는지에 따라 선택이 달라집니다.\n\n${visual(topic.slug,"decide")}\n\n## 판단 근거와 상세 비교\n\n“이 조건에서는 이 방법을 쓰고, 대신 이 부담을 감수한다”라고 설명할 수 있는지 확인해 보세요.\n\n${notes(ref.level_4_architecture_tradeoffs)}`,
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
