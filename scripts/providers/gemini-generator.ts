import { validateTopicContent, type TopicContent } from "../schemas/content-schema.ts";
import type { ContentGenerator, TopicBrief } from "./content-generator.ts";

const SYSTEM_PROMPT = `당신은 수석 컴퓨터 과학자이자 한국어 기술 교육 편집자입니다.
반드시 제공된 JSON Schema에 맞는 순수 JSON만을 반환해야 합니다. 마크다운 백틱(\`\`\`json)이나 인사말 등 JSON 외부 텍스트는 일체 출력하지 마십시오.

[작성 지침]
1. Level 1 (Mental Model): 비전공자도 쉽게 이해할 수 있는 일상 속 비유, 개념의 필요성, 직관적인 ASCII 다이어그램, 그리고 비유가 갖는 한계를 마크다운으로 명확히 설명합니다.
2. Level 2 (Core Engineering): 내부 동작 원리, 메모리 구조, CPU 레지스터/캐시, 커널/네트워크 스택 관점의 구체적 동작 흐름과 실제 실행 가능한 양질의 코드 예제 및 코드 해설을 제공합니다.
3. Level 3 (Troubleshooting): 실무 운영 환경에서 직면하는 구체적 에러 로그(스택 트레이스), 동시성 경쟁이나 성능 병목 원인 가설, 재현 조건, APM/프로파일링을 통한 진단 및 단계별 해결 검증 절차를 다룹니다.
4. Level 4 (Architecture Trade-offs): 최소 2개 이상의 아키텍처 대안 비교 표(지연 시간, 처리량, 운영 복잡도 등), 실패 모드, 대규모 트래픽(High-traffic) 확장 시 병목점과 실무 엔지니어링 의사결정 기준을 제시합니다.
5. Quizzes: 각 레벨(1, 2, 3, 4)당 정확히 1문제씩 총 4개의 4지선다 객관식 퀴즈를 생성합니다. 정답 인덱스(0~3)는 정확해야 하며, 오답 선택지도 그럴듯하게 설계하고, 상세한 정답 및 오답 해설을 작성하십시오.`;

export class GeminiContentGenerator implements ContentGenerator {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "gemini-2.5-flash"
  ) {}

  async generate(topic: TopicBrief, signal?: AbortSignal): Promise<TopicContent> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const userPrompt = JSON.stringify({
      domain: topic.domainTitle,
      topic: topic.title,
      summary: topic.summary,
      difficulty: topic.difficulty,
      prerequisites: topic.prerequisiteTitles,
    });

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `${SYSTEM_PROMPT}\n\n[입력 토픽 정보]\n${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 16384,
        temperature: 0.2,
      }
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini API 요청 실패 (${res.status}): ${errText}`);
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini API가 텍스트 응답을 반환하지 않았습니다.");
    }

    const parsedJson = JSON.parse(rawText);
    return validateTopicContent(parsedJson);
  }
}
