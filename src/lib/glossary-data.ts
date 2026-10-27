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
    definition: "네트워크에서 주소 등 전달에 필요한 정보와 데이터를 묶어 보내는 단위입니다. 크기와 형식은 사용하는 규칙에 따라 달라집니다.",
    category: "network",
  },
  {
    term: "핸드셰이크",
    aliases: ["Handshake", "3-Way Handshake"],
    analogy: "전화를 걸고 '여보세요?', '네 잘 들려요', '그럼 말씀하세요'라고 통화를 시작하는 인사 과정",
    definition: "통신을 시작할 때 양쪽이 상태나 사용할 규칙을 주고받는 과정입니다. TCP의 3단계 핸드셰이크는 연결을 준비하지만 상대의 신원을 인증하지는 않습니다.",
    category: "network",
  },
  {
    term: "캐시",
    aliases: ["Cache", "캐시 메모리"],
    analogy: "책장(하드디스크)까지 가지 않고 책상 위(캐시)에 자주 읽는 책을 올려두는 것",
    definition: "다시 필요할 것으로 예상하는 자료나 계산 결과를 가까운 곳에 보관해, 다음에 가져오는 비용을 줄이는 방법입니다. 저장장치뿐 아니라 웹 응답에도 쓸 수 있습니다.",
    category: "hardware",
  },
  {
    term: "프로세스",
    aliases: ["Process"],
    analogy: "컴퓨터라는 건물 안에 독립된 방과 전용 사무실을 배정받아 일하는 독립된 작업 팀",
    definition: "실행 중인 프로그램에 운영체제가 마련한 주소 공간과 자원의 단위입니다. 보통 다른 프로세스와 주소 공간이 나뉘며, 필요하면 공유 메모리를 따로 설정할 수 있습니다.",
    category: "os",
  },
  {
    term: "스레드",
    aliases: ["Thread"],
    analogy: "같은 사무실(프로세스) 안에서 책상과 서류(메모리)를 함께 쓰며 각자 일하는 팀원들",
    definition: "프로세스 안에서 명령을 실행하는 흐름입니다. 같은 프로세스의 스레드는 힙 등 자료를 공유하고, 각자 레지스터 상태와 스택을 가집니다. 스택이 따로 있어도 메모리 보호 경계가 생기는 것은 아닙니다.",
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
    analogy: "회사마다 같은 서랍 번호를 써도, 회사 이름과 번호를 함께 보고 각자의 실제 서랍으로 연결하는 안내표",
    definition: "프로그램이 쓰는 주소를 실제 메모리 위치에 연결하고 접근 권한을 관리하는 체계입니다. 일부 내용을 디스크로 옮길 수도 있지만, 무제한 RAM을 만들어 주는 기능은 아닙니다.",
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
    definition: "조건에 맞는 행을 찾는 비용을 줄이기 위해 별도로 관리하는 자료구조입니다. B-Tree 등 여러 종류가 있으며, 저장 공간과 쓰기 작업의 비용이 추가됩니다. 모든 조회에서 더 빠른 것은 아닙니다.",
    category: "database",
  },
  {
    term: "로드 밸런서",
    aliases: ["Load Balancer", "부하 분산기"],
    analogy: "은행 창구 번호표 기계가 손님을 비어 있는 창구 1, 2, 3번으로 골고루 배정해주는 것",
    definition: "요청을 정한 규칙에 따라 여러 서버로 전달하는 장치나 소프트웨어입니다. 서버 상태를 확인해 전달 대상을 바꿀 수 있지만, 서버 장애를 완전히 막아 주지는 않습니다.",
    category: "architecture",
  },
  {
    term: "지연 시간",
    aliases: ["Latency", "레이턴시"],
    analogy: "편지를 우체통에 넣고 상대방이 받아보기까지 걸리는 배송 소요 시간",
    definition: "정한 시작 지점부터 끝 지점까지 걸린 시간입니다. 첫 응답까지인지 전체 처리 완료까지인지, 측정 범위를 함께 밝혀야 비교할 수 있습니다.",
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
