export interface GlossaryTerm {
  term: string;
  aliases?: string[];
  analogy: string; // 비전공자 일상 비유
  definition: string; // 기술적 핵심 정의
  category: "network" | "os" | "hardware" | "database" | "architecture" | "general";
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "패킷",
    aliases: ["Packet", "패킷(Packet)"],
    analogy: "배송 상자에 붙은 송장(출발지/도착지 주소)과 그 안에 든 편지 조각",
    definition: "네트워크를 통해 전송되는 데이터를 일정 크기로 자른 표준 전송 단위입니다.",
    category: "network",
  },
  {
    term: "핸드셰이크",
    aliases: ["Handshake", "3-Way Handshake"],
    analogy: "전화를 걸고 '여보세요?', '네 잘 들려요', '그럼 말씀하세요'라고 통화를 시작하는 인사 과정",
    definition: "두 컴퓨터가 본격적인 데이터 교환 전에 연결을 확인하고 신뢰성을 수립하는 사전 약속 절차입니다.",
    category: "network",
  },
  {
    term: "캐시",
    aliases: ["Cache", "캐시 메모리"],
    analogy: "책장(하드디스크)까지 가지 않고 책상 위(캐시)에 자주 읽는 책을 올려두는 것",
    definition: "속도가 빠른 장치와 느린 장치 사이의 속도 차이를 줄이기 위해 최근 사용한 데이터를 임시 보관하는 초고속 저장소입니다.",
    category: "hardware",
  },
  {
    term: "프로세스",
    aliases: ["Process"],
    analogy: "컴퓨터라는 건물 안에 독립된 방과 전용 사무실을 배정받아 일하는 독립된 작업 팀",
    definition: "메모리에 적재되어 OS로부터 독립된 메모리 공간(코드/데이터/힙/스택)을 할당받아 실행 중인 프로그램입니다.",
    category: "os",
  },
  {
    term: "스레드",
    aliases: ["Thread"],
    analogy: "같은 사무실(프로세스) 안에서 책상과 서류(메모리)를 함께 쓰며 각자 일하는 팀원들",
    definition: "프로세스 내부에서 실행 흐름의 최소 단위로, 프로세스의 메모리를 공유하면서 독립된 스택을 가집니다.",
    category: "os",
  },
  {
    term: "컨텍스트 스위칭",
    aliases: ["Context Switching", "문맥 교환"],
    analogy: "책을 읽다 덮고 다른 책을 읽기 위해 현재 페이지를 책갈피로 꽂아두고 새 책을 펼치는 과정",
    definition: "CPU가 한 작업에서 다른 작업으로 전환할 때, 현재 실행 상태(레지스터 값 등)를 저장하고 새 작업의 상태를 복원하는 작업입니다.",
    category: "os",
  },
  {
    term: "가상 메모리",
    aliases: ["Virtual Memory"],
    analogy: "통장 잔고보다 큰 수표를 발행할 수 있도록 은행(OS)이 임시로 크레딧을 대출해주는 마법 지갑",
    definition: "실제 물리 RAM 크기에 구애받지 않고 디스크 공간을 RAM처럼 확장하여 각 프로세스에 독립된 연속 주소를 제공하는 기법입니다.",
    category: "os",
  },
  {
    term: "데드락",
    aliases: ["Deadlock", "교착 상태"],
    analogy: "한 사람은 펜을 쥐고 종이를 원하고, 다른 사람은 종이를 쥐고 펜을 원해서 둘 다 영원히 멈춘 상태",
    definition: "둘 이상의 작업이 서로가 가진 자원을 놓기만을 기다리며 무한 대기에 빠진 상태입니다.",
    category: "os",
  },
  {
    term: "뮤텍스",
    aliases: ["Mutex", "상호 배제"],
    analogy: "화장실 문에 달린 단 하나뿐인 열쇠 (한 사람이 들어가면 잠그고, 나와야 다음 사람이 씀)",
    definition: "동시에 단 하나의 스레드만 공유 자원에 접근할 수 있도록 보장하는 상호 배제 동기화 도구입니다.",
    category: "os",
  },
  {
    term: "인덱스",
    aliases: ["Index", "DB 인덱스"],
    analogy: "두꺼운 전공 서적 맨 뒤에 알파벳순으로 정리된 '색인/찾아보기' 페이지",
    definition: "데이터베이스 테이블의 검색 속도를 획기적으로 높이기 위해 정렬된 키 값과 물리 주소를 매핑한 자료구조입니다.",
    category: "database",
  },
  {
    term: "로드 밸런서",
    aliases: ["Load Balancer", "부하 분산기"],
    analogy: "은행 창구 번호표 기계가 손님을 비어 있는 창구 1, 2, 3번으로 골고루 배정해주는 것",
    definition: "네트워크 트래픽을 여러 대의 서버로 고르게 분산하여 서버 다운을 막고 가용성을 높이는 장치/소프트웨어입니다.",
    category: "architecture",
  },
  {
    term: "지연 시간",
    aliases: ["Latency", "레이턴시"],
    analogy: "편지를 우체통에 넣고 상대방이 받아보기까지 걸리는 배송 소요 시간",
    definition: "데이터 요청이 전송되어 대상에 도달하고 응답이 시작되기까지 걸리는 시간(주로 ms, ns 단위)입니다.",
    category: "general",
  },
  {
    term: "처리량",
    aliases: ["Throughput", "스루풋"],
    analogy: "1시간 동안 고속도로 톨게이트를 통과할 수 있는 자동차의 총 대수",
    definition: "단위 시간당 시스템이 성공적으로 처리할 수 있는 데이터나 작업의 양(예: RPS, Mbps)입니다.",
    category: "general",
  },
];
