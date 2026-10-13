# IT 지식 지도와 선수 학습 그래프

이 문서는 **10개 도메인, 131개 토픽**의 초기 전체 체계다. `supabase/seed.sql`은 이 중 각 도메인 핵심 5개, 총 50개를 실제 DB에 등록하며, 아래 표의 `계획` 토픽 81개는 후속 시드 배치로 추가한다. 현재 SQL에는 핵심 토픽 간 선수 간선 78개가 들어 있다. 모든 slug는 전역 고유 ID이며, `A → B`는 A를 완료한 뒤 B를 학습한다는 뜻이다.

## 공통 학습 깊이

| 레벨 | 학습 결과 | 검증 증거 |
|---|---|---|
| Level 1 멘탈 모델 | 왜 필요한지 일상 비유와 그림으로 설명 | 초심자에게 2분 안에 설명 |
| Level 2 코어 엔지니어링 | 데이터·메모리·CPU·네트워크 흐름과 코드 추적 | 실행 경로 또는 상태 변화 도식화 |
| Level 3 실무 트러블슈팅 | 재현, 계측, 원인 분리, 수정 검증 | 로그·프로파일·테스트로 장애 분석 |
| Level 4 아키텍처 트레이드오프 | 부하·실패·비용 조건에서 설계 선택 | 대안 비교와 결정 기록(ADR) |

**난이도**는 토픽 진입 난도이며 4개 레벨은 *모든 아티클의 심도*다. Expert 토픽에도 Level 1~4를 모두 쓴다. 대시보드의 잠금 조건은 직접 선수가 모두 완료된 경우다. 1단계부터 읽는 기능은 열어 둘 수 있으나, 완료 표시와 추천 순서는 선수 조건을 따른다.

## 전체 구조

```text
디지털 회로 → CPU/메모리 → OS 실행/주소 공간 → 네트워크/언어/알고리즘
                                            ↓
                           설계·DB → API/분산 시스템 → 클라우드/웹 보안/AI
```

표의 선수 slug는 권장 직접 선수다. 시드 행은 `seed.sql` 간선과 정확히 같고, 계획 행은 앞으로 추가할 간선이다. `—`는 진입 토픽을 뜻한다.

## 1. 컴퓨터 하드웨어 & 연산 기초

학습 흐름: 회로 → 명령 실행 → 메모리/가속기.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `logic-gates` · 트랜지스터와 논리회로 | Beginner | — | 시드 |
| 핵심 | `binary-representation` · 2진수와 보수 표현 | Beginner | `logic-gates` | 시드 |
| 핵심 | `binary-arithmetic` · 이진 산술과 오버플로 | Intermediate | `binary-representation` | 시드 |
| 핵심 | `von-neumann-cpu` · 폰 노이만 구조와 CPU 레지스터 | Beginner | `logic-gates`, `binary-representation` | 시드 |
| 핵심 | `memory-hierarchy` · 캐시 메모리와 메모리 계층 | Intermediate | `von-neumann-cpu`, `binary-arithmetic` | 시드 |
| CPU와 메모리 | `isa-assembly` · 명령어 집합(ISA)과 어셈블리 | Intermediate | `von-neumann-cpu`, `binary-arithmetic` | 계획 |
| CPU와 메모리 | `cpu-pipeline` · CPU 파이프라인과 분기 예측 | Advanced | `von-neumann-cpu`, `memory-hierarchy` | 계획 |
| CPU와 메모리 | `simd-vectorization` · SIMD와 벡터화 | Advanced | `isa-assembly`, `cpu-pipeline` | 계획 |
| CPU와 메모리 | `cache-coherence` · 멀티코어 캐시 일관성 | Expert | `memory-hierarchy`, `processes-threads` | 계획 |
| 가속기와 저장 장치 | `gpu-computing` · GPU 연산 모델과 메모리 | Advanced | `simd-vectorization`, `memory-hierarchy` | 계획 |
| 가속기와 저장 장치 | `storage-io-hardware` · SSD·NVMe와 저장 장치 I/O | Advanced | `memory-hierarchy` | 계획 |
| 성능 분석 | `hardware-performance-counters` · 하드웨어 성능 카운터와 병목 | Expert | `cpu-pipeline`, `memory-hierarchy` | 계획 |

## 2. 운영체제(OS) & 시스템

학습 흐름: 주소 공간 → 실행 흐름 → 동기화/I/O.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `processes-threads` · 프로세스와 스레드 | Beginner | `von-neumann-cpu`, `stack-heap-gc` | 시드 |
| 핵심 | `virtual-memory` · 가상 메모리와 페이징 | Intermediate | `stack-heap-gc`, `memory-hierarchy` | 시드 |
| 핵심 | `context-switching` · 컨텍스트 스위칭 | Intermediate | `processes-threads`, `virtual-memory` | 시드 |
| 핵심 | `synchronization-deadlocks` · 동기화 기법과 데드락 | Advanced | `processes-threads`, `context-switching` | 시드 |
| 핵심 | `syscalls-io` · 시스템 콜과 I/O 모델 | Advanced | `processes-threads`, `virtual-memory` | 시드 |
| 스케줄링과 통신 | `cpu-scheduling` · CPU 스케줄링 정책 | Advanced | `context-switching` | 계획 |
| 스케줄링과 통신 | `ipc-mechanisms` · 프로세스 간 통신(IPC) | Advanced | `processes-threads`, `syscalls-io` | 계획 |
| I/O와 저장 | `filesystems` · 파일 시스템과 저널링 | Advanced | `syscalls-io`, `storage-io-hardware` | 계획 |
| I/O와 저장 | `async-io` · 비동기 I/O와 이벤트 루프 | Advanced | `syscalls-io`, `tcp-udp-handshake` | 계획 |
| 메모리와 격리 | `memory-mapped-io` · mmap·페이지 캐시·제로 카피 | Expert | `virtual-memory`, `syscalls-io` | 계획 |
| 메모리와 격리 | `namespaces-cgroups` · Linux 네임스페이스와 cgroups | Expert | `processes-threads`, `virtual-memory` | 계획 |
| 메모리와 격리 | `os-isolation-security` · 운영체제 권한·격리·샌드박스 | Expert | `syscalls-io`, `namespaces-cgroups` | 계획 |

## 3. 컴퓨터 네트워크

학습 흐름: 계층 → 전송 → 애플리케이션/엣지.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `osi-encapsulation` · OSI 7계층과 캡슐화 | Beginner | — | 시드 |
| 핵심 | `tcp-udp-handshake` · TCP vs UDP와 3-Way Handshake | Intermediate | `osi-encapsulation` | 시드 |
| 핵심 | `dns-resolution` · DNS 동작 원리 | Intermediate | `osi-encapsulation` | 시드 |
| 핵심 | `http-versions` · HTTP/1.1부터 HTTP/3까지 | Advanced | `tcp-udp-handshake`, `dns-resolution` | 시드 |
| 핵심 | `load-balancing` · 로드 밸런싱과 리버스 프록시 | Advanced | `http-versions`, `tcp-udp-handshake` | 시드 |
| 전송과 라우팅 | `ethernet-ip` · 이더넷·IP 주소·서브넷 | Intermediate | `osi-encapsulation` | 계획 |
| 전송과 라우팅 | `routing-nat` · 라우팅·NAT·방화벽 | Advanced | `ethernet-ip` | 계획 |
| 전송과 라우팅 | `socket-api` · 소켓 API와 연결 수명 | Advanced | `tcp-udp-handshake`, `syscalls-io` | 계획 |
| 전송과 라우팅 | `tcp-congestion` · TCP 혼잡 제어와 재전송 | Advanced | `tcp-udp-handshake` | 계획 |
| 보안과 엣지 | `tls-handshake` · TLS 핸드셰이크와 인증서 | Advanced | `tcp-udp-handshake`, `cryptography` | 계획 |
| 보안과 엣지 | `quic-internals` · QUIC 연결·스트림·마이그레이션 | Expert | `http-versions`, `tcp-congestion` | 계획 |
| 보안과 엣지 | `cdn-edge` · CDN과 엣지 캐싱 | Advanced | `dns-resolution`, `load-balancing` | 계획 |
| 진단 | `network-diagnostics` · 패킷 캡처와 네트워크 진단 | Advanced | `routing-nat`, `tcp-udp-handshake` | 계획 |

## 4. 자료구조 & 알고리즘

학습 흐름: 비용 모델 → 자료구조 → 설계 기법.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `big-o` · 시간·공간 복잡도와 Big-O | Beginner | — | 시드 |
| 핵심 | `arrays-linked-lists` · 배열 vs 연결 리스트 | Beginner | `big-o` | 시드 |
| 핵심 | `hash-tables` · 해시 테이블과 충돌 해결 | Intermediate | `arrays-linked-lists`, `big-o` | 시드 |
| 핵심 | `trees-bst` · 트리와 이진 탐색 트리 | Intermediate | `arrays-linked-lists`, `big-o` | 시드 |
| 핵심 | `graph-search` · 그래프 탐색 DFS/BFS | Intermediate | `arrays-linked-lists`, `trees-bst` | 시드 |
| 정렬과 탐색 | `sorting-algorithms` · 정렬 알고리즘과 안정성 | Intermediate | `big-o`, `arrays-linked-lists` | 계획 |
| 정렬과 탐색 | `binary-search` · 이진 탐색과 경계 조건 | Intermediate | `big-o`, `arrays-linked-lists` | 계획 |
| 자료구조 | `heap-priority-queue` · 힙과 우선순위 큐 | Intermediate | `trees-bst`, `arrays-linked-lists` | 계획 |
| 설계 기법 | `dynamic-programming` · 동적 계획법과 상태 정의 | Advanced | `big-o`, `arrays-linked-lists` | 계획 |
| 설계 기법 | `greedy-algorithms` · 그리디 알고리즘과 증명 | Advanced | `big-o`, `sorting-algorithms` | 계획 |
| 그래프 | `shortest-paths` · 최단 경로와 가중치 조건 | Advanced | `graph-search`, `heap-priority-queue` | 계획 |
| 그래프 | `union-find` · 유니온 파인드와 연결성 | Advanced | `graph-search`, `arrays-linked-lists` | 계획 |
| 분석 | `randomized-algorithms` · 확률적 알고리즘과 기대 복잡도 | Expert | `big-o`, `hash-tables` | 계획 |

## 5. 프로그래밍 패러다임 & 언어론

학습 흐름: 실행 모델 → 메모리/타입 → 런타임.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `compiler-interpreter` · 컴파일러 vs 인터프리터 | Beginner | `binary-representation` | 시드 |
| 핵심 | `stack-heap-gc` · 스택 vs 힙 메모리 할당과 GC | Intermediate | `von-neumann-cpu` | 시드 |
| 핵심 | `oop-principles` · 객체지향 4대 특성과 원칙 | Intermediate | `stack-heap-gc` | 시드 |
| 핵심 | `functional-programming` · 함수형 프로그래밍과 순수 함수 | Intermediate | `type-systems` | 시드 |
| 핵심 | `type-systems` · 정적 타입 vs 동적 타입 | Intermediate | `compiler-interpreter` | 시드 |
| 번역과 타입 | `syntax-parsing` · 어휘 분석·파싱·AST | Advanced | `compiler-interpreter` | 계획 |
| 번역과 타입 | `generics-type-inference` · 제네릭·타입 추론·분산 | Advanced | `type-systems` | 계획 |
| 번역과 타입 | `metaprogramming` · 매크로와 메타프로그래밍 | Expert | `syntax-parsing`, `type-systems` | 계획 |
| 메모리와 실행 | `pointers-ownership` · 포인터·소유권·수명 | Advanced | `stack-heap-gc` | 계획 |
| 메모리와 실행 | `gc-algorithms` · 추적 GC와 세대별 회수 | Advanced | `stack-heap-gc` | 계획 |
| 메모리와 실행 | `async-runtime` · async/await와 런타임 스케줄러 | Advanced | `syscalls-io`, `compiler-interpreter` | 계획 |
| 메모리와 실행 | `concurrency-memory-model` · 언어 메모리 모델과 happens-before | Expert | `synchronization-deadlocks`, `type-systems` | 계획 |
| 메모리와 실행 | `ffi-native-boundaries` · FFI와 네이티브 경계 | Expert | `compiler-interpreter`, `stack-heap-gc` | 계획 |

## 6. 소프트웨어 엔지니어링 & 설계

학습 흐름: 협업 → 설계 → 테스트/품질.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `solid` · SOLID 5대 원칙 | Intermediate | `oop-principles` | 시드 |
| 핵심 | `design-patterns` · 핵심 디자인 패턴 | Intermediate | `solid` | 시드 |
| 핵심 | `clean-code-refactoring` · 클린 코드와 리팩터링 | Intermediate | `solid` | 시드 |
| 핵심 | `testing-pyramid` · 단위·통합·E2E 테스트 피라미드 | Intermediate | `clean-code-refactoring` | 시드 |
| 핵심 | `architecture-decisions` · 아키텍처 의사결정 기록 | Advanced | `testing-pyramid`, `design-patterns` | 시드 |
| 협업과 요구 | `git-version-control` · Git·브랜치·코드 리뷰 | Beginner | `compiler-interpreter` | 계획 |
| 협업과 요구 | `requirements-modeling` · 요구사항·수용 기준·도메인 용어 | Beginner | — | 계획 |
| 설계 | `dependency-injection` · 의존성 주입과 조립 루트 | Advanced | `solid`, `design-patterns` | 계획 |
| 설계 | `domain-driven-design` · 도메인 주도 설계의 경계 | Advanced | `relational-normalization`, `solid` | 계획 |
| 설계 | `clean-architecture` · 계층형·헥사고날 아키텍처 | Advanced | `solid`, `rest-api` | 계획 |
| 품질 | `tdd-workflow` · TDD 사이클과 테스트 더블 | Intermediate | `testing-pyramid` | 계획 |
| 품질 | `property-based-testing` · 속성 기반·계약 테스트 | Advanced | `testing-pyramid`, `type-systems` | 계획 |
| 품질 | `performance-profiling` · 프로파일링과 성능 회귀 분석 | Advanced | `observability`, `big-o` | 계획 |

## 7. 데이터베이스 & 데이터 모델링

학습 흐름: 모델 → 쿼리/트랜잭션 → 분산/분석.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `relational-normalization` · RDBMS 정규화와 역정규화 | Intermediate | `hash-tables` | 시드 |
| 핵심 | `btree-indexes` · B-Tree 인덱스 동작 원리 | Advanced | `trees-bst`, `relational-normalization` | 시드 |
| 핵심 | `transactions-isolation` · 트랜잭션과 ACID·격리 수준 | Advanced | `relational-normalization`, `synchronization-deadlocks` | 시드 |
| 핵심 | `nosql-cap` · NoSQL 유형과 CAP 정리 | Advanced | `osi-encapsulation`, `transactions-isolation` | 시드 |
| 핵심 | `replication-sharding` · DB 복제와 샤딩 | Expert | `btree-indexes`, `transactions-isolation` | 시드 |
| SQL와 변경 | `sql-joins` · SQL 조인·집계·실행 순서 | Intermediate | `relational-normalization` | 계획 |
| SQL와 변경 | `schema-migrations` · 스키마 마이그레이션과 무중단 변경 | Advanced | `relational-normalization`, `cicd-pipelines` | 계획 |
| 쿼리 내부 | `query-planning` · 실행 계획·선택도·통계 | Advanced | `btree-indexes`, `sql-joins` | 계획 |
| 쿼리 내부 | `mvcc-internals` · MVCC와 청소·가시성 | Expert | `transactions-isolation` | 계획 |
| 분석과 흐름 | `olap-warehousing` · OLTP vs OLAP와 웨어하우스 | Advanced | `replication-sharding`, `sql-joins` | 계획 |
| 분석과 흐름 | `stream-processing` · 스트림 처리와 이벤트 시간 | Expert | `message-queues`, `replication-sharding` | 계획 |
| 분석과 흐름 | `data-governance` · 데이터 계보·보존·접근 통제 | Advanced | `relational-normalization`, `web-security` | 계획 |
| AI 검색 | `vector-indexes` · 벡터 인덱스와 ANN 정확도 | Expert | `llm-vector-infra`, `btree-indexes` | 계획 |

## 8. 백엔드 아키텍처 & 분산 시스템

학습 흐름: API → 캐시/메시징 → 일관성/복원력.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `rest-api` · RESTful API 설계 원칙 | Intermediate | `http-versions` | 시드 |
| 핵심 | `caching-strategies` · 캐싱 전략 | Advanced | `rest-api`, `memory-hierarchy` | 시드 |
| 핵심 | `message-queues` · 메시지 큐와 비동기 처리 | Advanced | `tcp-udp-handshake`, `synchronization-deadlocks` | 시드 |
| 핵심 | `monolith-vs-msa` · 모놀리식 vs MSA | Advanced | `rest-api`, `message-queues` | 시드 |
| 핵심 | `saga-transactions` · 분산 트랜잭션과 Saga | Expert | `monolith-vs-msa`, `transactions-isolation`, `message-queues` | 시드 |
| API 경계 | `graphql-grpc` · GraphQL·gRPC와 계약 | Advanced | `rest-api`, `type-systems` | 계획 |
| API 경계 | `rate-limiting` · 속도 제한·쿼터·백프레셔 | Advanced | `rest-api`, `caching-strategies` | 계획 |
| API 경계 | `idempotency-keys` · 멱등성 키와 재시도 계약 | Advanced | `rest-api`, `transactions-isolation` | 계획 |
| 이벤트와 일관성 | `transactional-outbox` · 트랜잭셔널 아웃박스·인박스 | Expert | `transactions-isolation`, `message-queues` | 계획 |
| 이벤트와 일관성 | `event-sourcing` · 이벤트 소싱과 재생 | Expert | `message-queues`, `relational-normalization` | 계획 |
| 이벤트와 일관성 | `cqrs` · CQRS와 읽기 모델 | Expert | `event-sourcing`, `caching-strategies` | 계획 |
| 운영 | `fault-tolerance` · 타임아웃·서킷 브레이커·벌크헤드 | Expert | `monolith-vs-msa`, `observability` | 계획 |
| 운영 | `service-discovery` · 서비스 발견과 트래픽 정책 | Expert | `kubernetes-basics`, `monolith-vs-msa` | 계획 |

## 9. 클라우드 인프라 & DevOps

학습 흐름: 격리 → 배포/오케스트레이션 → 신뢰성.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `vm-vs-containers` · 가상 머신 vs 컨테이너·Docker | Intermediate | `virtual-memory`, `syscalls-io` | 시드 |
| 핵심 | `kubernetes-basics` · Kubernetes 오케스트레이션 기초 | Advanced | `vm-vs-containers` | 시드 |
| 핵심 | `cicd-pipelines` · CI/CD 파이프라인 설계 | Intermediate | `testing-pyramid` | 시드 |
| 핵심 | `iac` · 인프라 코드화(IaC) | Advanced | `vm-vs-containers` | 시드 |
| 핵심 | `observability` · 모니터링·로깅과 가시성 | Advanced | `kubernetes-basics`, `monolith-vs-msa` | 시드 |
| 운영 기반 | `linux-operations` · Linux 운영·패키지·프로세스 진단 | Intermediate | `syscalls-io` | 계획 |
| 운영 기반 | `cloud-networking` · VPC·서브넷·보안 그룹 | Advanced | `routing-nat`, `vm-vs-containers` | 계획 |
| 오케스트레이션 | `k8s-workloads` · Kubernetes 워크로드·스토리지·네트워킹 | Expert | `kubernetes-basics`, `cloud-networking` | 계획 |
| 배포와 보안 | `gitops` · GitOps와 선언적 배포 | Advanced | `cicd-pipelines`, `iac` | 계획 |
| 배포와 보안 | `secrets-management` · 시크릿·키 회전·최소 권한 | Advanced | `web-auth`, `iac` | 계획 |
| 배포와 보안 | `supply-chain-security` · SBOM·서명·빌드 격리 | Expert | `cicd-pipelines`, `web-security` | 계획 |
| 신뢰성 | `autoscaling` · 오토스케일링·용량 계획 | Expert | `kubernetes-basics`, `observability` | 계획 |
| 신뢰성 | `sre-slo` · SLI·SLO·에러 버짓 | Expert | `observability` | 계획 |

## 10. 웹 플랫폼 & 보안/신기술

학습 흐름: 브라우저/앱 → 인증·보안 → AI 서빙.

| 트랙 | 토픽 slug · 제목 | 난이도 | 직접 선수 slug | 등록 |
|---|---|---|---|---|
| 핵심 | `browser-rendering` · 브라우저 렌더링 파이프라인(CRP) | Intermediate | `http-versions` | 시드 |
| 핵심 | `web-auth` · 웹 인증: 쿠키·세션·JWT·OAuth2 | Advanced | `http-versions`, `transactions-isolation` | 시드 |
| 핵심 | `web-security` · 웹 보안: XSS·CSRF·SQL Injection | Advanced | `browser-rendering`, `web-auth` | 시드 |
| 핵심 | `web-performance` · 대규모 트래픽 웹 최적화 | Expert | `browser-rendering`, `caching-strategies`, `load-balancing`, `web-security` | 시드 |
| 핵심 | `llm-vector-infra` · LLM 인프라와 벡터 데이터베이스 기초 | Expert | `hash-tables`, `nosql-cap`, `observability` | 시드 |
| 웹 클라이언트 | `html-css-js` · HTML·CSS·JavaScript 실행 기초 | Beginner | `compiler-interpreter` | 계획 |
| 웹 클라이언트 | `web-accessibility` · 웹 접근성과 시맨틱 UI | Intermediate | `html-css-js` | 계획 |
| 웹 클라이언트 | `react-rendering` · React 렌더링과 상태 | Intermediate | `browser-rendering`, `html-css-js` | 계획 |
| 웹 클라이언트 | `ssr-rsc` · SSR·RSC·하이드레이션 | Advanced | `react-rendering`, `http-versions` | 계획 |
| 앱 플랫폼 | `mobile-app-architecture` · 모바일 앱 수명주기와 오프라인 동기화 | Advanced | `oop-principles`, `rest-api` | 계획 |
| 보안 | `cryptography` · 해시·대칭키·공개키·서명 | Advanced | `binary-arithmetic`, `big-o` | 계획 |
| 보안 | `oauth-oidc-details` · OAuth 2.0·OIDC 흐름과 토큰 | Expert | `web-auth`, `cryptography` | 계획 |
| 보안 | `owasp-hardening` · OWASP 위험과 방어 심화 | Expert | `web-security`, `os-isolation-security` | 계획 |
| AI 플랫폼 | `model-serving` · 모델 서빙·배치·추론 캐시 | Expert | `llm-vector-infra`, `kubernetes-basics` | 계획 |
| AI 플랫폼 | `rag-evaluation` · RAG 검색 품질·평가·관측 | Expert | `llm-vector-infra`, `model-serving` | 계획 |
| AI 플랫폼 | `ai-infrastructure-security` · 프롬프트 주입·데이터 경계·모델 보안 | Expert | `model-serving`, `web-security` | 계획 |

## 그래프와 콘텐츠 운영 규칙

1. `topics.slug`는 제목 변경과 관계없이 유지한다. 명칭 변경은 `title`만 바꾼다. 도메인마다 `display_order`를 매기고, 실제 학습 순서는 DAG 위상 정렬과 사용자 완료 상태로 결정한다.
2. 새 선수 간선은 자기 자신과 순환을 허용하지 않는다. 마이그레이션의 `curriculum_internal.enforce_topic_dag()` 트리거가 DB 차원에서 검증한다. 기존 학습자에게 새 선수를 추가할 때는 완료 상태 재평가·콘텐츠 버전 관리 정책을 먼저 결정한다.
3. 선수 관계는 “알아야 이해 가능한” 필수 관계만 저장한다. 관련 있지만 필수는 아닌 토픽은 향후 별도 `topic_relations`(related/contrast/applies) 테이블로 분리한다. 과도한 선수를 넣어 진입 경로를 막지 않는다.
4. 토픽마다 아티클 한 행에 네 레벨을 보관한다. 각 레벨은 **핵심 질문 → 개념/예제 → 흔한 오해 → 확인 문제**의 편집 체크리스트를 따른다. 출판 전 네 레벨 모두 비어 있지 않아야 한다.
5. 평가 문항은 `quizzes.level`로 레벨을 연결한다. 정답과 해설은 공개 Data API 컬럼 권한에서 제외하고 서버에서 채점한다.
6. 초기 콘텐츠는 `processes-threads`의 골든 샘플을 품질 기준으로 삼는다. 이후 계획 토픽은 선수가 등록된 배치부터 점진적으로 시드한다.

## 변경 관리와 범위

이 지도의 131개 토픽은 지식 분류의 출발 버전이다. 분야별 세부 분야(예: 게임 엔진, 데이터 과학, 임베디드 실시간 시스템, 네트워크 프로토콜 심화)는 동일한 `domains → topics → topic_prerequisites` 모델에 slug와 간선을 추가해 확장한다. “모든 IT 지식”을 유한한 목록으로 고정할 수 없으므로, 운영 중 누락을 분기별로 검토하고 핵심/선택 선수 관계를 교정한다.
