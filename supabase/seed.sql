-- Initial curriculum: 10 domains, 50 topics, 78 directed prerequisite edges.
-- Run after migrations/20261013000000_init_schema.sql. Reruns preserve editorial edits.
begin;

insert into public.domains (slug, title, description, icon_name, display_order) values
  ('hardware', '컴퓨터 하드웨어 & 연산 기초', '논리회로에서 CPU와 메모리 계층까지 계산의 물리적 토대를 학습한다.', 'Cpu', 1),
  ('operating-systems', '운영체제(OS) & 시스템', '프로세스, 주소 공간, 동기화와 커널 I/O를 이해한다.', 'HardDrive', 2),
  ('networks', '컴퓨터 네트워크', '계층 모델에서 전송, 이름 해석, HTTP와 트래픽 분산까지 잇는다.', 'Network', 3),
  ('algorithms', '자료구조 & 알고리즘', '복잡도와 자료구조를 근거로 탐색과 데이터 처리 비용을 분석한다.', 'GitBranch', 4),
  ('languages', '프로그래밍 패러다임 & 언어론', '실행 모델, 타입, 메모리와 프로그램 설계 패러다임을 다룬다.', 'Code2', 5),
  ('engineering', '소프트웨어 엔지니어링 & 설계', '변경 가능한 코드를 위한 설계, 테스트와 의사결정 기록을 다룬다.', 'Blocks', 6),
  ('databases', '데이터베이스 & 데이터 모델링', '스키마, 인덱스, 트랜잭션과 분산 저장을 연결한다.', 'Database', 7),
  ('distributed-systems', '백엔드 아키텍처 & 분산 시스템', 'API, 캐시, 메시징, 서비스 분리와 분산 일관성을 다룬다.', 'Server', 8),
  ('cloud-devops', '클라우드 인프라 & DevOps', '컨테이너, 오케스트레이션, 배포와 운영 관측을 다룬다.', 'Cloud', 9),
  ('web-security-ai', '웹 플랫폼 & 보안/신기술', '브라우저, 인증, 웹 공격, 성능과 LLM 인프라를 다룬다.', 'ShieldCheck', 10)
on conflict (slug) do nothing;

with seed(domain_slug, slug, title, summary, difficulty, estimated_minutes, display_order) as (
  values
  ('hardware','logic-gates','트랜지스터와 논리회로','스위칭 소자에서 논리 게이트와 조합회로를 구성한다.','beginner',45,1),
  ('hardware','binary-representation','2진수와 보수 표현','비트, 진법 변환, 부호 비트와 2의 보수를 설명한다.','beginner',50,2),
  ('hardware','binary-arithmetic','이진 산술과 오버플로','덧셈기, 자리올림, 오버플로와 정수 표현 범위를 구분한다.','intermediate',55,3),
  ('hardware','von-neumann-cpu','폰 노이만 구조와 CPU 레지스터','명령 인출·해독·실행과 PC, 레지스터, ALU의 역할을 추적한다.','beginner',60,4),
  ('hardware','memory-hierarchy','캐시 메모리와 메모리 계층','지역성, 캐시 라인, 적중률과 메모리 지연의 관계를 해석한다.','intermediate',70,5),

  ('operating-systems','processes-threads','프로세스와 스레드','주소 공간과 실행 흐름의 공유·격리 단위를 구분한다.','beginner',60,1),
  ('operating-systems','virtual-memory','가상 메모리와 페이징','페이지 테이블, TLB, 페이지 폴트와 주소 변환을 추적한다.','intermediate',75,2),
  ('operating-systems','context-switching','컨텍스트 스위칭','스케줄러가 레지스터와 실행 문맥을 저장·복원하는 비용을 이해한다.','intermediate',65,3),
  ('operating-systems','synchronization-deadlocks','동기화 기법과 데드락','뮤텍스, 세마포어, 원자 연산과 교착상태를 분석한다.','advanced',90,4),
  ('operating-systems','syscalls-io','시스템 콜과 I/O 모델','유저·커널 경계와 블로킹, 논블로킹, 이벤트 기반 I/O를 비교한다.','advanced',85,5),

  ('networks','osi-encapsulation','OSI 7계층과 캡슐화','계층별 책임과 패킷 캡슐화·역캡슐화를 설명한다.','beginner',55,1),
  ('networks','tcp-udp-handshake','TCP vs UDP와 3-Way Handshake','연결 설정, 신뢰성, 흐름 제어와 UDP의 비용을 비교한다.','intermediate',75,2),
  ('networks','dns-resolution','DNS 동작 원리','재귀·권한 서버, 캐시, TTL과 이름 해석 경로를 추적한다.','intermediate',60,3),
  ('networks','http-versions','HTTP/1.1부터 HTTP/3까지','연결 재사용, 멀티플렉싱, QUIC과 지연 특성을 비교한다.','advanced',85,4),
  ('networks','load-balancing','로드 밸런싱과 리버스 프록시','L4·L7 분산, 헬스체크, 세션 고정과 장애 대응을 설계한다.','advanced',80,5),

  ('algorithms','big-o','시간·공간 복잡도와 Big-O','입력 크기에 따른 시간 및 메모리 증가율을 분석한다.','beginner',55,1),
  ('algorithms','arrays-linked-lists','배열 vs 연결 리스트','연속 메모리와 포인터 연결의 접근·삽입 비용을 비교한다.','beginner',65,2),
  ('algorithms','hash-tables','해시 테이블과 충돌 해결','해시 함수, 버킷, 체이닝과 개방 주소법을 비교한다.','intermediate',70,3),
  ('algorithms','trees-bst','트리와 이진 탐색 트리','순회, 높이, 균형과 탐색 복잡도를 이해한다.','intermediate',75,4),
  ('algorithms','graph-search','그래프 탐색 DFS/BFS','그래프 표현과 탐색 순서, 최단 경로의 기본 조건을 구분한다.','intermediate',80,5),

  ('languages','compiler-interpreter','컴파일러 vs 인터프리터','소스 코드가 기계에서 실행되기까지의 번역 경로를 비교한다.','beginner',55,1),
  ('languages','stack-heap-gc','스택 vs 힙 메모리 할당과 GC','호출 프레임, 동적 할당, 객체 수명과 가비지 컬렉션을 설명한다.','intermediate',75,2),
  ('languages','oop-principles','객체지향 4대 특성과 원칙','추상화, 캡슐화, 상속, 다형성의 유용성과 한계를 다룬다.','intermediate',70,3),
  ('languages','functional-programming','함수형 프로그래밍과 순수 함수','불변성, 참조 투명성, 고차 함수와 효과 분리를 다룬다.','intermediate',75,4),
  ('languages','type-systems','정적 타입 vs 동적 타입','타입 검사 시점, 추론, 런타임 검증과 계약을 비교한다.','intermediate',70,5),

  ('engineering','solid','SOLID 5대 원칙','변경 방향과 의존성을 기준으로 객체 설계를 평가한다.','intermediate',75,1),
  ('engineering','design-patterns','핵심 디자인 패턴','Singleton, Factory, Observer의 의도와 오용을 구분한다.','intermediate',80,2),
  ('engineering','clean-code-refactoring','클린 코드와 리팩터링','동작을 보존하며 이름, 구조, 결합도를 개선한다.','intermediate',70,3),
  ('engineering','testing-pyramid','단위·통합·E2E 테스트 피라미드','테스트 경계, 속도, 신뢰도를 고려해 검증 층을 설계한다.','intermediate',80,4),
  ('engineering','architecture-decisions','아키텍처 의사결정 기록','맥락, 대안, 결정, 결과를 ADR로 남기고 재평가한다.','advanced',60,5),

  ('databases','relational-normalization','RDBMS 정규화와 역정규화','키, 함수 종속, 갱신 이상과 읽기 최적화의 균형을 잡는다.','intermediate',85,1),
  ('databases','btree-indexes','B-Tree 인덱스 동작 원리','정렬된 페이지, 탐색 경로, 선택도와 쓰기 비용을 설명한다.','advanced',90,2),
  ('databases','transactions-isolation','트랜잭션과 ACID·격리 수준','동시 실행 이상, MVCC와 격리 수준의 보장 범위를 다룬다.','advanced',100,3),
  ('databases','nosql-cap','NoSQL 유형과 CAP 정리','문서·키값·컬럼·그래프 저장과 장애 시 일관성 선택을 구분한다.','advanced',90,4),
  ('databases','replication-sharding','DB 복제와 샤딩','읽기 복제, 지연, 파티션 키, 재배치 비용을 설계한다.','expert',105,5),

  ('distributed-systems','rest-api','RESTful API 설계 원칙','리소스, HTTP 메서드, 상태 코드, 멱등성과 버저닝을 다룬다.','intermediate',75,1),
  ('distributed-systems','caching-strategies','캐싱 전략','로컬·분산 캐시, 무효화, TTL과 캐시 스탬피드를 분석한다.','advanced',90,2),
  ('distributed-systems','message-queues','메시지 큐와 비동기 처리','Kafka와 RabbitMQ의 전달 모델, 재시도와 중복 처리를 비교한다.','advanced',95,3),
  ('distributed-systems','monolith-vs-msa','모놀리식 vs MSA','배포 독립성, 데이터 소유권과 운영 복잡도의 경계를 정한다.','advanced',90,4),
  ('distributed-systems','saga-transactions','분산 트랜잭션과 Saga','보상 트랜잭션, 멱등성, 실패 복구와 관측을 설계한다.','expert',110,5),

  ('cloud-devops','vm-vs-containers','가상 머신 vs 컨테이너·Docker','커널 공유와 격리, 이미지, 레이어와 실행 단위를 비교한다.','intermediate',80,1),
  ('cloud-devops','kubernetes-basics','Kubernetes 오케스트레이션 기초','Pod, Deployment, Service, 스케줄링과 선언적 복구를 다룬다.','advanced',100,2),
  ('cloud-devops','cicd-pipelines','CI/CD 파이프라인 설계','빌드, 검증, 배포, 롤백 및 공급망 안전성을 설계한다.','intermediate',85,3),
  ('cloud-devops','iac','인프라 코드화(IaC)','선언적 상태, 변경 계획, 드리프트와 비밀값 관리를 다룬다.','advanced',85,4),
  ('cloud-devops','observability','모니터링·로깅과 가시성','메트릭, 로그, 트레이스, SLO와 알림을 연결한다.','advanced',95,5),

  ('web-security-ai','browser-rendering','브라우저 렌더링 파이프라인(CRP)','DOM·CSSOM, 레이아웃, 페인트와 합성을 추적한다.','intermediate',75,1),
  ('web-security-ai','web-auth','웹 인증: 쿠키·세션·JWT·OAuth2','자격 증명과 권한 위임, 세션 수명과 저장 위치를 구분한다.','advanced',95,2),
  ('web-security-ai','web-security','웹 보안: XSS·CSRF·SQL Injection','신뢰 경계와 입력·출력 처리, 토큰과 쿼리 매개변수를 적용한다.','advanced',100,3),
  ('web-security-ai','web-performance','대규모 트래픽 웹 최적화','CRP, CDN, 캐시, 로드 밸런싱과 백엔드 병목을 함께 분석한다.','expert',105,4),
  ('web-security-ai','llm-vector-infra','LLM 인프라와 벡터 데이터베이스 기초','임베딩, 근사 최근접 탐색, RAG, 서빙 지연과 평가를 다룬다.','expert',110,5)
)
insert into public.topics
  (domain_id, slug, title, summary, difficulty, estimated_minutes, display_order)
select d.id, s.slug, s.title, s.summary,
  s.difficulty::public.topic_difficulty, s.estimated_minutes, s.display_order
from seed s join public.domains d on d.slug = s.domain_slug
on conflict (slug) do nothing;

-- Edges point from required knowledge to the topic that depends on it.
with edges(from_slug, to_slug) as (
  values
  ('logic-gates','binary-representation'),
  ('binary-representation','binary-arithmetic'),
  ('logic-gates','von-neumann-cpu'),
  ('binary-representation','von-neumann-cpu'),
  ('von-neumann-cpu','memory-hierarchy'),
  ('binary-arithmetic','memory-hierarchy'),
  ('von-neumann-cpu','processes-threads'),
  ('stack-heap-gc','processes-threads'),
  ('stack-heap-gc','virtual-memory'),
  ('memory-hierarchy','virtual-memory'),
  ('processes-threads','context-switching'),
  ('virtual-memory','context-switching'),
  ('processes-threads','synchronization-deadlocks'),
  ('context-switching','synchronization-deadlocks'),
  ('processes-threads','syscalls-io'),
  ('virtual-memory','syscalls-io'),
  ('osi-encapsulation','tcp-udp-handshake'),
  ('osi-encapsulation','dns-resolution'),
  ('tcp-udp-handshake','http-versions'),
  ('dns-resolution','http-versions'),
  ('http-versions','load-balancing'),
  ('tcp-udp-handshake','load-balancing'),
  ('big-o','arrays-linked-lists'),
  ('arrays-linked-lists','hash-tables'),
  ('big-o','hash-tables'),
  ('arrays-linked-lists','trees-bst'),
  ('big-o','trees-bst'),
  ('arrays-linked-lists','graph-search'),
  ('trees-bst','graph-search'),
  ('binary-representation','compiler-interpreter'),
  ('von-neumann-cpu','stack-heap-gc'),
  ('stack-heap-gc','oop-principles'),
  ('compiler-interpreter','type-systems'),
  ('type-systems','functional-programming'),
  ('oop-principles','solid'),
  ('solid','design-patterns'),
  ('solid','clean-code-refactoring'),
  ('clean-code-refactoring','testing-pyramid'),
  ('testing-pyramid','architecture-decisions'),
  ('design-patterns','architecture-decisions'),
  ('hash-tables','relational-normalization'),
  ('trees-bst','btree-indexes'),
  ('relational-normalization','btree-indexes'),
  ('relational-normalization','transactions-isolation'),
  ('synchronization-deadlocks','transactions-isolation'),
  ('osi-encapsulation','nosql-cap'),
  ('transactions-isolation','nosql-cap'),
  ('btree-indexes','replication-sharding'),
  ('transactions-isolation','replication-sharding'),
  ('http-versions','rest-api'),
  ('rest-api','caching-strategies'),
  ('memory-hierarchy','caching-strategies'),
  ('tcp-udp-handshake','message-queues'),
  ('synchronization-deadlocks','message-queues'),
  ('rest-api','monolith-vs-msa'),
  ('message-queues','monolith-vs-msa'),
  ('monolith-vs-msa','saga-transactions'),
  ('transactions-isolation','saga-transactions'),
  ('message-queues','saga-transactions'),
  ('virtual-memory','vm-vs-containers'),
  ('syscalls-io','vm-vs-containers'),
  ('vm-vs-containers','kubernetes-basics'),
  ('testing-pyramid','cicd-pipelines'),
  ('vm-vs-containers','iac'),
  ('kubernetes-basics','observability'),
  ('monolith-vs-msa','observability'),
  ('http-versions','browser-rendering'),
  ('http-versions','web-auth'),
  ('transactions-isolation','web-auth'),
  ('browser-rendering','web-security'),
  ('web-auth','web-security'),
  ('browser-rendering','web-performance'),
  ('caching-strategies','web-performance'),
  ('load-balancing','web-performance'),
  ('web-security','web-performance'),
  ('hash-tables','llm-vector-infra'),
  ('nosql-cap','llm-vector-infra'),
  ('observability','llm-vector-infra')
)
insert into public.topic_prerequisites (from_topic_id, to_topic_id)
select src.id, dst.id
from edges e
join public.topics src on src.slug = e.from_slug
join public.topics dst on dst.slug = e.to_slug
on conflict (from_topic_id, to_topic_id) do nothing;

insert into public.articles
  (topic_id, level_1_mental_model, level_2_core_engineering,
   level_3_troubleshooting, level_4_architecture_tradeoffs, is_published)
select t.id,
$md$
# Level 1 — 프로세스와 스레드: 건물과 작업자

**프로세스**는 운영체제가 한 프로그램을 실행하기 위해 마련한 독립된 작업 공간이다. 사무실 한 칸을 떠올려 보자. 다른 회사의 사무실에 바로 들어갈 수 없듯, 다른 프로세스의 메모리를 주소만 안다고 읽을 수 없다. 운영체제가 이 경계를 관리한다.

**스레드**는 그 사무실 안에서 실제로 일을 진행하는 작업자다. 한 프로세스에 스레드가 하나면 한 작업자가 일하고, 여러 개면 같은 서류함(힙과 전역 데이터)을 함께 쓰며 각자 자신의 메모장(스택)을 가진다. 작업자는 실행 중인 명령 위치도 각각 다르다.

```text
프로세스 A [주소 공간 A: 코드 | 전역 데이터 | 힙]
  ├─ 스레드 A1 [레지스터 | 스택 A1]
  └─ 스레드 A2 [레지스터 | 스택 A2]
프로세스 B [주소 공간 B: 코드 | 전역 데이터 | 힙]
  └─ 스레드 B1 [레지스터 | 스택 B1]
```

**왜 둘 다 필요한가?** 메모리 격리는 한 작업의 오류가 다른 작업을 망가뜨릴 가능성을 낮춘다. 반대로 같은 주소 공간을 쓰는 스레드는 데이터를 빠르게 공유하며 여러 일을 진행할 수 있다. 다만 서류함을 동시에 고치면 결과가 꼬일 수 있으므로 조정 규칙이 필요하다.

**확인:** 브라우저의 탭을 별도 프로세스로 격리할 때 얻는 이점은 무엇인가? 한 프로세스 안의 스레드 두 개가 동일한 전역 변수를 바꿀 때 어떤 일이 생길 수 있는가?
$md$,
$md$
# Level 2 — OS 내부 동작과 메모리 구조

프로그램 파일은 디스크의 정적인 명령·데이터다. 실행하면 커널이 프로세스 식별자, 가상 주소 공간, 열린 파일 기술자, 권한, 스케줄링 정보를 마련한다. 주소 공간에는 코드, 읽기 전용 데이터, 전역 데이터, 힙, 각 스레드의 스택과 메모리 매핑 영역이 포함된다. 스레드는 그 안에서 프로그램 카운터와 레지스터 집합, 스택, 스케줄링 상태를 가진 실행 흐름이다.

Linux에서는 스레드도 스케줄러가 다루는 태스크다. 같은 스레드 그룹의 태스크는 `clone` 계열 플래그에 따라 주소 공간과 파일 기술자 테이블 등을 공유한다. 공유와 독립은 항목별로 따져야 한다. 예를 들어 스택은 스레드마다 별도지만 같은 주소 공간에 놓여 있으므로 잘못된 포인터를 가진 다른 스레드가 그 스택을 손상시킬 수 있다. 프로세스 사이에서는 일반적으로 페이지 테이블이 분리되지만 공유 메모리 매핑을 명시적으로 만들 수도 있다.

CPU 코어가 스레드를 실행할 때 해당 스레드의 레지스터 상태를 적재한다. 실행 가능한 스레드가 코어보다 많으면 스케줄러가 번갈아 실행한다. **동시성**은 작업 진행 구간이 겹치는 성질이고, **병렬성**은 여러 코어에서 같은 순간 명령이 실행되는 성질이다. 스레드가 많다고 CPU 병렬 속도가 자동으로 증가하지 않는다.

```c
#include <pthread.h>
#include <stdio.h>

static void *worker(void *arg) {
    int *shared = arg;          // 같은 프로세스의 힙/전역 주소에 접근 가능
    printf("value=%d\n", *shared);
    return NULL;
}

int main(void) {
    int value = 42;
    pthread_t thread;
    if (pthread_create(&thread, NULL, worker, &value) != 0) return 1;
    if (pthread_join(thread, NULL) != 0) return 1;
    return 0;
}
```

이 예제에서 `value`는 메인 스레드의 스택에 있지만 `pthread_join`으로 메인 함수가 끝나기 전 작업 스레드를 기다리므로 주소의 수명이 유지된다. `join` 없이 함수를 반환하거나, 수명이 끝난 지역 변수의 주소를 넘기면 위험하다. 같은 프로세스에서 공유된다는 사실만으로 접근이 항상 안전해지는 것도 아니다.

**확인:** 각 스레드의 스택이 따로 있는데도 한 스레드가 다른 스레드의 스택을 손상시킬 수 있는 이유를 설명해 보자.
$md$,
$md$
# Level 3 — 동시성 버그와 디버깅

대표적인 실패는 **데이터 레이스**다. 두 스레드가 같은 메모리 위치에 동기화 없이 접근하고, 적어도 하나가 쓰면 실행 순서에 따라 결과가 달라진다. `counter++`는 읽기·더하기·쓰기의 여러 단계이므로 두 스레드가 같은 옛 값을 읽으면 증가분 하나가 사라진다. C/C++의 데이터 레이스는 단순한 값 누락을 넘어 정의되지 않은 동작이다.

```c
// 잘못된 예: 여러 스레드가 counter++를 실행
long counter = 0;

// 수정 예 1: C11 원자 연산
#include <stdatomic.h>
atomic_long safe_counter = 0;
atomic_fetch_add_explicit(&safe_counter, 1, memory_order_relaxed);
```

카운터처럼 다른 데이터와 불변식을 묶지 않아도 될 때는 원자 연산이 적합하다. 계좌 잔액과 거래 내역처럼 여러 값을 함께 바꿔야 하면 뮤텍스로 임계 구역을 보호한다. `volatile`은 스레드 동기화의 대체물이 아니다. 잠금이 항상 빠른 것도 아니다. 경합이 심하면 스레드가 잠들거나 계속 재시도하며 지연이 커진다.

실전 진단 순서:

1. **재현:** 입력, 스레드 수, 코어 수, 부하 조건을 기록하고 실패를 반복한다.
2. **계측:** C/C++은 ThreadSanitizer(`-fsanitize=thread`)로 경쟁 접근을 찾고, 프로덕션에서는 오류율·대기 시간·잠금 경합을 측정한다. 계측 자체가 타이밍을 바꿀 수 있다.
3. **상태 확인:** 스레드 덤프나 `gdb`의 `thread apply all bt`로 각 스레드가 실행 중인지, 잠금·I/O 대기 중인지 본다.
4. **원인 분류:** 데이터 레이스, 교착상태, 기아, 유실된 깨움, 이미 해제된 메모리 접근을 구분한다. 교착상태라면 잠금 획득 순서를 일관되게 만들고, 조건 변수라면 조건을 `while`로 다시 검사한다.
5. **수정 검증:** 불변식을 명시하고 재현 테스트, 스트레스 테스트, 성능 회귀를 함께 확인한다.

예를 들어 A 스레드는 `users_lock → orders_lock`, B 스레드는 `orders_lock → users_lock` 순서로 잡으면 서로 기다릴 수 있다. 모든 경로가 같은 순서로 잠금을 잡도록 고치거나, 데이터 소유권을 한 작업자에게 모아 공유를 줄인다. 락 순서 수정이 어려우면 제한 시간과 실패 복구도 설계하되, 타임아웃만으로 무결성 문제가 해결되지는 않는다.

**확인:** 원자 카운터로 충분한 상황과 여러 값에 대한 뮤텍스가 필요한 상황을 각각 하나씩 들어 보자.
$md$,
$md$
# Level 4 — 멀티프로세스와 멀티스레드의 설계 선택

| 기준 | 여러 프로세스 | 한 프로세스의 여러 스레드 |
|---|---|---|
| 장애 격리 | 주소 공간 분리로 메모리 손상의 전파를 제한 | 한 스레드의 잘못된 포인터가 전체 프로세스를 종료시킬 수 있음 |
| 데이터 교환 | IPC, 소켓, 공유 메모리 등 명시적 경계와 직렬화 비용 | 힙 공유가 쉬우나 동기화·소유권 설계 필요 |
| 자원 비용 | 프로세스별 페이지 테이블·파일 상태 등 관리 비용 | 주소 공간 공유로 상대적으로 가벼움. 스택·스케줄링 비용은 여전히 존재 |
| 보안 경계 | 별도 권한·샌드박스 구성에 유리 | 같은 권한과 주소 공간을 공유하므로 격리 수단으로 부적합 |
| 운영 | 독립 재시작·배포·자원 제한이 쉬움 | 프로세스 내부 작업 큐와 스레드 풀 조정이 중요 |

의사결정은 **작업 특성, 격리 요구, 통신량, 실패 복구** 순서로 한다. 서로 신뢰하지 않는 플러그인이나 사용자 코드는 별도 프로세스 또는 더 강한 샌드박스에 두는 편이 안전하다. 작은 공유 상태를 아주 자주 갱신하는 CPU 작업은 스레드와 분할된 데이터 구조가 유리할 수 있다. 독립 작업을 서비스 간에 분리하면 프로세스 경계가 복구와 운영 책임을 명확히 한다. 실제 비용은 워크로드로 측정해야 한다.

CPU 사용률이 높은 작업은 코어 수, 스레드 풀 크기, 작업 분할과 캐시 경합을 함께 본다. I/O 중심 작업은 스레드 수를 무한히 늘리기보다 비동기 I/O·백프레셔·연결 풀을 비교한다. 언어 런타임도 중요하다. 예를 들어 CPython의 일반적인 GIL 환경에서는 CPU 중심 Python 바이트코드에 스레드를 늘린다고 여러 코어를 모두 활용하지 못할 수 있지만, I/O 대기나 GIL을 해제하는 네이티브 코드는 별개다. 런타임과 버전을 확인한다.

**선택 예시:** 이미지 변환처럼 독립적이며 CPU 중심인 작업은 제한된 수의 워커 프로세스와 큐를 출발점으로 삼는다. 각 작업의 데이터가 크고 공유가 빈번하다면 직렬화 비용을 측정한 뒤 스레드 풀 또는 공유 메모리를 검토한다. 반면 한 프로세스의 웹 서버가 수천 연결을 처리한다면 요청당 스레드 하나보다 이벤트 기반 I/O와 제한된 워커 풀을 검토한다.

**아키텍처 질문:** 장애 격리를 강화하기 위해 프로세스를 분리했을 때 생기는 IPC 비용과 데이터 일관성 문제를 어떻게 관측하고 제한할 것인가?
$md$,
true
from public.topics t where t.slug = 'processes-threads'
on conflict (topic_id) do nothing;

insert into public.quizzes (topic_id, level, question, choices, answer_index, explanation)
select t.id, q.level, q.question, q.choices::jsonb, q.answer_index, q.explanation
from public.topics t
cross join (values
  (1, '한 프로세스의 두 스레드가 기본적으로 공유하는 것은?', '["프로그램 카운터", "일반적인 힙 주소 공간", "각자의 레지스터", "각자의 호출 스택"]', 1, '스레드는 프로세스의 주소 공간을 공유하지만 실행 문맥과 스택은 각각 가진다.'),
  (2, '스레드별 스택이 분리되어 있어도 다른 스레드가 이를 손상시킬 수 있는 이유는?', '["각 스택이 같은 가상 주소 공간에 있기 때문", "모든 스레드의 스택 포인터가 같기 때문", "커널이 모든 스택을 자동 병합하기 때문"]', 0, '스택 영역은 서로 다르지만 동일한 프로세스의 주소 공간 안에 있다.'),
  (3, 'C에서 여러 스레드가 counter++를 동기화 없이 수행할 때 가장 정확한 설명은?', '["항상 정확하다", "값만 간혹 누락되며 동작은 정의되어 있다", "데이터 레이스로 정의되지 않은 동작이다"]', 2, '읽기·수정·쓰기가 원자적이지 않고 C의 데이터 레이스는 정의되지 않은 동작이다.'),
  (4, '서로 신뢰하지 않는 플러그인을 실행할 때 우선 고려할 구조는?', '["같은 주소 공간의 스레드만 사용", "별도 프로세스와 권한 격리", "전역 변수만 줄이기"]', 1, '프로세스 경계와 별도 권한은 메모리 및 장애 격리에 유리하다.')
) as q(level, question, choices, answer_index, explanation)
where t.slug = 'processes-threads'
on conflict (topic_id, level, question) do nothing;

commit;
