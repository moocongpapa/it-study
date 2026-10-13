import { validateTopicContent, type TopicContent } from "../schemas/content-schema.ts";
import type { ContentGenerator, TopicBrief } from "./content-generator.ts";

export class MockContentGenerator implements ContentGenerator {
  async generate(topic: TopicBrief): Promise<TopicContent> {
    const rawContent: TopicContent = {
      level_1_mental_model: `# ${topic.title} — Level 1: 직관적 멘탈 모델

## 1. 일상 속 비유로 이해하기
${topic.title}은(는) 일상 생활에서 비유하자면 마치 도서관의 대출 데스크나 우편 배달 시스템과 같습니다.
- **기본 개념**: ${topic.summary}
- **도메인**: ${topic.domainTitle}
- **선수 지식**: ${topic.prerequisiteTitles.length > 0 ? topic.prerequisiteTitles.join(", ") : "없음"}

\`\`\`
+------------------+         요청 전달         +------------------+
|      사용자      | ----------------------> |    ${topic.title}     |
|   (클라이언트)   | <---------------------- |   (처리 및 응답)  |
+------------------+         결과 수신         +------------------+
\`\`\`

## 2. 왜 이 개념이 필요할까요?
복잡한 컴퓨터 시스템에서 효율성과 안전성을 확보하기 위해 필수적입니다. 이 추상화가 없다면 개발자는 모든 하위 수준의 물리적 제약을 직접 제어해야 합니다.

## 3. 비유의 한계
현실의 비유는 직관을 돕지만, 실제 컴퓨터 내부에서는 나노초(ns) 단위의 클럭과 물리 메모리 버스, 전기 신호로 동작하므로 현실의 물리적 한계와는 다른 특성을 보입니다.
`,
      level_2_core_engineering: `# ${topic.title} — Level 2: 코어 엔지니어링 및 내부 동작 원리

## 1. 내부 아키텍처 및 메커니즘
컴퓨터 아키텍처 관점에서 ${topic.title}은(는) CPU 레지스터, 메모리 계층, OS 커널 또는 네트워크 스택과 긴밀하게 상호작용합니다.

\`\`\`typescript
// 실행 가능한 예제 코드 (${topic.slug})
export async function executeCoreProcess(payload: Record<string, unknown>): Promise<void> {
  const startTime = performance.now();
  try {
    console.log("[CoreEngine] 작업 초기화:", payload);
    // 내부 상태 전이 및 로직 실행
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log("[CoreEngine] 처리 완료 (소요시간: %dms)", performance.now() - startTime);
  } catch (err) {
    console.error("[CoreEngine] 처리 실패:", err);
    throw err;
  }
}
\`\`\`

## 2. 메모리 및 CPU 관점의 동작 흐름
1. **메모리 할당**: 스택과 힙 메모리 상에서 컨텍스트가 생성되고 포인터가 정렬됩니다.
2. **시스템 호출 및 컨텍스트 스위칭**: 필요 시 유저 모드에서 커널 모드로의 전환이 발생합니다.
3. **자원 해제**: 실행이 완료되면 캐시 라인 플러시 및 가비지 컬렉션/해제가 수행됩니다.
`,
      level_3_troubleshooting: `# ${topic.title} — Level 3: 실전 트러블슈팅 및 장애 진단

## 1. 실무에서 흔히 발생하는 에러 로그
\`\`\`
ERROR 2026-10-13 14:32:01.412 [pool-3-thread-18] SystemHealthMonitor:
  OperationTimeoutException: ${topic.slug} pipeline bottleneck detected.
  at CoreExecutor.processTask(CoreExecutor.ts:142)
  at WorkerThread.run(WorkerThread.ts:88)
  Caused by: ResourceContentionException: Lock acquisition failed after 5000ms.
\`\`\`

## 2. 원인 가설 및 재현 조건
- **원인 1**: 동시성 경쟁(Race Condition)으로 인한 락 경합 및 데드락.
- **원인 2**: 메모리 누수 또는 커넥션 풀 고갈로 인한 지연 증가.

## 3. 단계별 진단 및 해결 방법
1. **메트릭 계측**: 프로파일러(pprof 또는 APM)를 통해 병목 스레드를 식별합니다.
2. **락 세분화**: 전역 락 대신 세분화된 락 또는 락프리(Lock-free) 자료구조로 전환합니다.
3. **회귀 검증**: 카오스 엔지니어링 및 부하 테스트를 수행하여 재발 여부를 검증합니다.
`,
      level_4_architecture_tradeoffs: `# ${topic.title} — Level 4: 아키텍처 트레이드오프 및 대규모 설계

## 1. 아키텍처 대안 비교

| 평가 항목 | 대안 A (동기식 중앙 집중형) | 대안 B (비동기 이벤트 기반 분산형) |
| :--- | :--- | :--- |
| **지연 시간 (Latency)** | 낮음 (단일 홉 처리) | 상대적으로 높음 (큐 경유) |
| **처리량 (Throughput)** | 병목 발생 시 제한적 | 수평 확장(Scale-out) 용이 |
| **복잡도 & 운영 비용** | 낮음 (디버깅 용이) | 높음 (분산 추적 필요) |
| **일관성 보장** | 강한 일관성 (ACID) | 최종 일관성 (Eventual Consistency) |

## 2. 대규모 트래픽 환경에서의 설계 기준
초당 요청 수(RPS)가 100,000건을 초과하는 환경에서는 단일 인스턴스의 연산 능력 한계를 넘어서므로, 샤딩(Sharding) 및 비동기 메시지 버퍼링을 결합해야 합니다.
`,
      quizzes: [
        {
          level: 1,
          question: `${topic.title}의 기본 개념과 일상 비유에 대한 설명 중 가장 적절한 것은 무엇입니까?`,
          choices: [
            `${topic.title}은(는) 시스템의 복잡성을 추상화하여 안전하고 일관된 동작을 보장한다.`,
            `${topic.title}은(는) 물리적 하드웨어 없이 소프트웨어만으로 항상 완벽하게 작동한다.`,
            `${topic.title}은(는) 컴퓨터 시스템의 속도를 무제한으로 빠르게 만드는 마법 도구이다.`,
            `${topic.title}은(는) 모든 프로그래밍 언어에서 완전히 동일한 구문으로 제공된다.`
          ],
          answer_index: 0,
          explanation: `${topic.title}의 본질은 하위 계층의 복잡도를 감추고 시스템의 일관성과 효율성을 높이는 데 있습니다.`
        },
        {
          level: 2,
          question: `${topic.title}의 내부 엔지니어링 동작 관점에서 올바른 서술은 무엇입니까?`,
          choices: [
            "메모리 정렬과 하드웨어 레지스터 상태를 고려하여 컨텍스트가 안전하게 전이된다.",
            "CPU 캐시 적중률과 관계없이 메모리 접근 시간은 항상 나노초 단위로 일정하다.",
            "시스템 콜은 유저 모드 권한 내에서 커널 개입 없이 즉시 완료된다.",
            "동시성 환경에서도 락이나 동기화 메커니즘이 전혀 필요하지 않다."
          ],
          answer_index: 0,
          explanation: "코어 엔지니어링 수준에서는 CPU 모드 전환, 메모리 레이아웃, 레지스터 보존 등이 정확하게 맞물려 작동합니다."
        },
        {
          level: 3,
          question: `${topic.title} 환경에서 락 경합과 타임아웃 장애가 발생했을 때 권장되는 해결책은 무엇입니까?`,
          choices: [
            "APM과 프로파일링을 통해 병목 구간을 식별하고 락 세분화 또는 비동기 처리를 도입한다.",
            "타임아웃 임계치를 무제한(Infinite)으로 늘려 모든 요청이 완료될 때까지 대기한다.",
            "문제가 발생한 노드를 주기적으로 강제 재부팅하는 크론잡을 추가한다.",
            "동시 요청을 모두 차단하고 단일 스레드로만 서비스를 전환한다."
          ],
          answer_index: 0,
          explanation: "타임아웃 장애는 계측을 통한 병목 스레드 파악과 락 경합 완화가 근본적인 해결책입니다."
        },
        {
          level: 4,
          question: `${topic.title} 도입 시 대규모 분산 아키텍처 관점에서 고려해야 할 핵심 트레이드오프는 무엇입니까?`,
          choices: [
            "강한 일관성(ACID)과 즉각적 지연 시간 vs 최종 일관성(Eventual Consistency)과 대규모 처리량 간의 균형",
            "개발자 생산성 향상과 하드웨어 구매 비용 간에는 어떠한 상관관계도 없다.",
            "모놀리스 아키텍처가 언제나 마이크로서비스보다 비용과 성능 모든 면에서 우월하다.",
            "대규모 트래픽에서는 데이터 손실을 감수하고 캐시만 사용하는 것이 유일한 해법이다."
          ],
          answer_index: 0,
          explanation: "대규모 분산 환경에서는 CAP 정리 및 일관성과 지연 시간, 가용성 사이의 의도적인 트레이드오프 선택이 핵심입니다."
        }
      ]
    };

    return validateTopicContent(rawContent);
  }
}
