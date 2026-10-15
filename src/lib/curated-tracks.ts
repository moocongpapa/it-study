export interface CuratedTrack {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  icon: string;
  topicSlugs: string[];
}

export const CURATED_TRACKS: CuratedTrack[] = [
  {
    id: "all",
    title: "전체 주제",
    subtitle: "All Topics",
    badge: "50개 토픽",
    description: "컴퓨터 하드웨어부터 AI 인프라까지 10대 도메인의 전체 커리큘럼입니다.",
    icon: "Compass",
    topicSlugs: [], // 빈 배열은 전체 표시
  },
  {
    id: "pm-literacy",
    title: "기획자/PM 테크 리터러시 10선",
    subtitle: "For Tech PM & Product",
    badge: "비전공 추천 · 10선",
    description: "개발자와 막힘없이 대화하고 기술적 의사결정을 이해하기 위한 핵심 IT 개념 모음입니다.",
    icon: "Briefcase",
    topicSlugs: [
      "binary-representation",
      "processes-threads",
      "tcp-udp-handshake",
      "dns-resolution",
      "http-versions",
      "arrays-linked-lists",
      "hash-tables",
      "load-balancing",
      "btree-indexes",
      "vm-vs-containers",
    ],
  },
  {
    id: "beginner-starter",
    title: "비전공자 입문 스타터팩 8선",
    subtitle: "Absolute Beginners",
    badge: "입문자 최우선 · 8선",
    description: "진입 장벽이 가장 낮고 직관적인 비유로 원리를 깨우치는 필수 입문 노드입니다.",
    icon: "Sparkles",
    topicSlugs: [
      "logic-gates",
      "binary-representation",
      "von-neumann-cpu",
      "processes-threads",
      "osi-encapsulation",
      "big-o",
      "arrays-linked-lists",
      "relational-normalization",
    ],
  },
  {
    id: "frontend-core",
    title: "웹 프론트엔드 필수 인프라 15선",
    subtitle: "Modern Frontend Specialist",
    badge: "프론트엔드 · 15선",
    description: "브라우저가 서버와 통신하고 화면을 그리기까지 웹 개발자가 알아야 할 네트워크·자료구조·보안입니다.",
    icon: "Code2",
    topicSlugs: [
      "osi-encapsulation",
      "tcp-udp-handshake",
      "dns-resolution",
      "http-versions",
      "arrays-linked-lists",
      "hash-tables",
      "big-o",
      "load-balancing",
      "rest-api",
      "browser-rendering",
      "web-security",
      "web-performance",
      "web-auth",
      "caching-strategies",
      "llm-vector-infra",
    ],
  },
  {
    id: "backend-mastery",
    title: "백엔드 & 시스템 엔지니어링 20선",
    subtitle: "Backend & Systems",
    badge: "백엔드 코어 · 20선",
    description: "OS 커널부터 대규모 트랜잭션, 분산 캐시와 메시지 큐까지 단단한 서버 백본을 완성합니다.",
    icon: "Server",
    topicSlugs: [
      "processes-threads",
      "virtual-memory",
      "context-switching",
      "synchronization-deadlocks",
      "syscalls-io",
      "tcp-udp-handshake",
      "http-versions",
      "load-balancing",
      "hash-tables",
      "btree-indexes",
      "transactions-isolation",
      "replication-sharding",
      "caching-strategies",
      "message-queues",
      "nosql-cap",
      "vm-vs-containers",
      "kubernetes-basics",
      "web-auth",
      "monolith-vs-msa",
      "cicd-pipelines",
    ],
  },
];
