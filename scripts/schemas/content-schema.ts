import { z } from "zod";

export const QuizItemSchema = z.object({
  level: z.number().int().min(1).max(4).describe("퀴즈 난이도 레벨 (1~4)"),
  question: z.string().min(10).max(1000).describe("명확한 객관식 문제 질문"),
  choices: z.array(z.string().min(1).max(500)).length(4).describe("4개의 상호 배타적인 보기 목록"),
  answer_index: z.number().int().min(0).max(3).describe("정답 보기의 인덱스 (0~3)"),
  explanation: z.string().min(20).max(3000).describe("정답인 이유와 오답 선택지에 대한 명쾌한 해설"),
});

export const TopicContentSchema = z.object({
  level_1_mental_model: z.string().min(200).max(20_000)
    .describe("비전공자 맞춤 일상적 비유, 직관적 다이어그램 설명 마크다운 (비유의 한계 포함)"),
  level_2_core_engineering: z.string().min(200).max(25_000)
    .describe("내부 동작 원리, 메모리/CPU/네트워크 관점, 실제 동작 코드 예제 마크다운"),
  level_3_troubleshooting: z.string().min(200).max(25_000)
    .describe("실무 에러 로그, 동시성/병목 이슈, 실전 디버깅 시나리오 및 해결 마크다운"),
  level_4_architecture_tradeoffs: z.string().min(200).max(25_000)
    .describe("아키텍처 트레이드오프 비교, 대규모 트래픽 설계, 엔지니어링 의사결정 기준 마크다운"),
  quizzes: z.array(QuizItemSchema).length(4)
    .describe("각 레벨당 1개씩 총 4개의 퀴즈 (Level 1, 2, 3, 4 각각 한 문제씩)"),
});

export type TopicContent = z.infer<typeof TopicContentSchema>;

/** Checks relationships that JSON Schema cannot express. */
export function validateTopicContent(input: unknown): TopicContent {
  const content = TopicContentSchema.parse(input);
  const levels = new Set(content.quizzes.map((quiz) => quiz.level));
  if (levels.size !== 4 || ![1, 2, 3, 4].every((level) => levels.has(level))) {
    throw new Error("퀴즈는 Level 1~4에 각각 한 문제씩 있어야 합니다.");
  }
  const questions = new Set<string>();
  for (const quiz of content.quizzes) {
    const normalizedQuestion = quiz.question.trim().toLocaleLowerCase("ko");
    if (questions.has(normalizedQuestion)) throw new Error("중복된 퀴즈 질문이 있습니다.");
    questions.add(normalizedQuestion);
    if (new Set(quiz.choices.map((choice) => choice.trim().toLocaleLowerCase("ko"))).size !== 4) {
      throw new Error(`Level ${quiz.level}의 선택지가 중복되었습니다.`);
    }
  }
  return content;
}
