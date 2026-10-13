import "server-only";
import type { Quiz, QuizFeedback } from "@/types/roadmap";

interface DemoQuiz extends Quiz {
  answerIndex: number | null;
  acceptedAnswers: string[];
  explanation: string;
}

const topicId = "processes-threads";

export const demoQuizBank: DemoQuiz[] = [
  {
    id: "process-l1-choice", topic_id: topicId, level: 1, question_type: "multiple_choice",
    question: "프로세스와 스레드의 경계를 가장 정확히 설명한 것은?",
    choices: ["프로세스는 주소 공간을 격리하고 같은 프로세스의 스레드는 주소 공간을 공유한다", "스레드는 각자 별도의 가상 주소 공간을 가진다", "프로세스는 CPU 코어 하나에만 묶인다", "스레드는 메모리를 전혀 사용하지 않는다"],
    answerIndex: 0, acceptedAnswers: [],
    explanation: "프로세스는 독립된 가상 주소 공간과 자원을 갖고, 같은 프로세스의 스레드는 코드·힙·전역 데이터를 공유한다. 각 스레드에는 실행 위치와 스택이 따로 있다.",
  },
  {
    id: "process-l1-short", topic_id: topicId, level: 1, question_type: "short_answer",
    question: "한 프로세스의 여러 스레드가 공통으로 사용하는 동적 메모리 영역은?",
    choices: [], answerIndex: null, acceptedAnswers: ["힙", "heap", "힙 영역"],
    explanation: "힙은 같은 프로세스의 스레드가 공유하는 주소 공간에 있다. 스택은 스레드별로 별도이지만, 메모리 안전 오류로 타 스레드 스택이 손상될 가능성까지 사라지는 것은 아니다.",
  },
  {
    id: "process-l2-choice", topic_id: topicId, level: 2, question_type: "multiple_choice",
    question: "스레드 전환 때 운영체제가 보존해야 하는 상태로 가장 적절한 것은?",
    choices: ["프로그램 카운터와 레지스터 상태", "모든 프로세스의 디스크 블록", "DNS 캐시 전체", "컴파일러의 소스 코드"],
    answerIndex: 0, acceptedAnswers: [],
    explanation: "스레드별 실행 문맥에는 프로그램 카운터, 레지스터, 스택 포인터 등이 포함된다. 모든 전환에서 전체 메모리를 복사하지 않는다.",
  },
  {
    id: "process-l2-short", topic_id: topicId, level: 2, question_type: "short_answer",
    question: "함수 호출 프레임을 스레드마다 따로 담는 메모리 영역은?",
    choices: [], answerIndex: null, acceptedAnswers: ["스택", "stack", "스택 영역"],
    explanation: "각 스레드는 자신만의 스택에 호출 프레임과 지역 변수를 둔다. 힙과 전역 데이터는 보통 같은 프로세스의 스레드가 공유한다.",
  },
  {
    id: "process-l3-choice", topic_id: topicId, level: 3, question_type: "multiple_choice",
    question: "두 스레드가 잠금 없이 공유 카운터를 증가시켜 값이 예상보다 작아졌다. 첫 조사로 적절한 것은?",
    choices: ["읽기-수정-쓰기 순서가 엇갈리는지 재현하고 경쟁 구간을 확인한다", "무조건 스레드 수를 두 배로 늘린다", "네트워크 DNS TTL을 낮춘다", "모든 카운터를 전역 상수로 바꾼다"],
    answerIndex: 0, acceptedAnswers: [],
    explanation: "증가 연산은 읽기·계산·쓰기의 여러 단계다. 스레드가 끼어들면 갱신이 사라질 수 있다. 로그와 ThreadSanitizer로 경쟁 구간을 찾고 원자 연산 또는 잠금을 적용한다.",
  },
  {
    id: "process-l3-short", topic_id: topicId, level: 3, question_type: "short_answer",
    question: "공유 변수에 동기화 없이 동시에 접근하여 결과가 실행 순서에 따라 달라지는 버그를 무엇이라 하나?",
    choices: [], answerIndex: null, acceptedAnswers: ["데이터 레이스", "data race", "데이터 경쟁"],
    explanation: "데이터 레이스는 동기화되지 않은 충돌 접근으로 발생한다. 타이밍을 바꿔 증상을 숨기지 말고 공유 상태의 소유권과 동기화 경계를 명확히 해야 한다.",
  },
  {
    id: "process-l4-choice", topic_id: topicId, level: 4, question_type: "multiple_choice",
    question: "신뢰하지 않는 플러그인을 실행하고 장애 전파를 최소화하려 한다. 우선 검토할 구조는?",
    choices: ["별도 프로세스와 제한된 IPC 경계", "한 프로세스의 공유 메모리 스레드만 사용", "모든 플러그인에 같은 관리자 권한 부여", "락을 없애고 스레드를 무제한 생성"],
    answerIndex: 0, acceptedAnswers: [],
    explanation: "별도 프로세스는 주소 공간과 권한 경계를 나누는 출발점이다. IPC·직렬화 비용과 운영 복잡성이 늘지만, 신뢰 경계와 실패 격리가 우선이면 이 비용을 감수할 이유가 있다.",
  },
  {
    id: "process-l4-short", topic_id: topicId, level: 4, question_type: "short_answer",
    question: "장애 격리와 독립 재시작을 우선할 때, 멀티스레드보다 먼저 비교할 실행 단위는?",
    choices: [], answerIndex: null, acceptedAnswers: ["프로세스", "별도 프로세스", "멀티프로세스", "process"],
    explanation: "프로세스 경계는 주소 공간 격리와 독립 재시작에 유리하다. 대신 IPC와 직렬화 비용, 프로세스별 자원 사용을 실제 워크로드로 측정해야 한다.",
  },
];

export function getPublicDemoQuizzes(id: string): Quiz[] {
  return demoQuizBank.filter((quiz) => quiz.topic_id === id).map((quiz) => ({
    id: quiz.id, topic_id: quiz.topic_id, level: quiz.level,
    question: quiz.question, choices: quiz.choices, question_type: quiz.question_type,
  }));
}

export function checkDemoQuizAnswer(quizId: string, choiceIndex: number | null, shortAnswer: string | null): QuizFeedback | null {
  const quiz = demoQuizBank.find((item) => item.id === quizId);
  if (!quiz) return null;
  const passed = quiz.question_type === "multiple_choice"
    ? choiceIndex === quiz.answerIndex
    : quiz.acceptedAnswers.some((answer) => answer.toLocaleLowerCase("ko").trim() === shortAnswer?.toLocaleLowerCase("ko").trim());
  return {
    passed,
    correctAnswer: quiz.question_type === "multiple_choice" ? quiz.choices[quiz.answerIndex ?? 0] : quiz.acceptedAnswers[0],
    explanation: quiz.explanation,
  };
}
