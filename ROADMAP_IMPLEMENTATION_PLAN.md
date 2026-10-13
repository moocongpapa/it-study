# All-in-One IT 지식 마스터리 플랫폼 — 단계적 구현 계획

## 목적과 고정 계약

먼저 10개 도메인과 50개 핵심 토픽, 78개 선수 간선, 4레벨 아티클의 저장 계약을 고정한다. 이후 화면과 학습 추적을 붙인다. 전체 커리큘럼 131개 토픽의 추가 배치는 [`IT_KNOWLEDGE_TAXONOMY.md`](IT_KNOWLEDGE_TAXONOMY.md)의 계획 행을 따른다. 실제 DDL은 [`supabase/migrations/20261013000000_init_schema.sql`](supabase/migrations/20261013000000_init_schema.sql), 실제 초기 입력은 [`supabase/seed.sql`](supabase/seed.sql)이 기준이다.

| 단계 | 전달물 | 완료 판정 |
|---|---|---|
| Phase 1 | DDL, 시드, DAG/RLS 검증, 타입 생성 | 10 도메인·50 토픽·78 간선·골든 아티클 1·퀴즈 4, 시드 2회 실행 후 동일 건수 |
| Phase 2 | 지식 그래프·도메인 네비게이션 | 방향·선수·잠금이 정확하고 키보드/목록 대안 제공 |
| Phase 3 | 4레벨 MDX 리더·퀴즈 | 레벨 전환, 코드 하이라이트, 출판/채점 권한이 동작 |
| Phase 4 | 진도 대시보드·복습 큐 | 본인 정보만 표시·갱신, 기한 도래 복습 재계산 |

## Phase 1 — 스키마와 Taxonomy Seed

### 구현 순서

1. 별도 개발용 Supabase 프로젝트 또는 일회용 로컬 DB에 마이그레이션을 적용한다. `auth.users`가 있는 Supabase 환경을 전제로 한다. 스키마만 필요한 일반 PostgreSQL 테스트에서는 `auth`/`anon`/`authenticated`/`service_role` 테스트 역할을 마련한다.
2. `seed.sql`을 실행한다. 스크립트는 **도메인 → 토픽 → 간선 → 아티클 → 퀴즈** 순서로 작성되어 있으며, 각 토픽/간선은 slug 조인과 유니크 제약으로 식별된다.
3. 검증용 Taxonomy Seed Script를 작성한다. 이 도구는 SQL을 대신 생성하는 필수 런타임이 아니라 CI 검사기다. 도메인별 최소 5개, slug 고유성, 선수 slug 존재, 위상 정렬 성공, 난이도 값, 4레벨 본문 존재, 예상 건수를 점검한다. 계획 토픽은 별도 배치 파일로 추가한다.
4. Supabase에서 타입을 생성해 TypeScript의 `Database` 타입으로 사용한다. 타입 파일은 DDL 적용 후 재생성한다.
5. 공개 카탈로그, 초안, 퀴즈 정답, 본인/타인 진행 정보의 권한을 역할별로 테스트한다. `service_role` 키는 서버 전용 환경 변수에만 둔다.

### 최소 SQL 스모크 검사

```sql
select 'domains' as object, count(*) from public.domains
union all select 'topics', count(*) from public.topics
union all select 'prerequisites', count(*) from public.topic_prerequisites
union all select 'published_articles', count(*) from public.articles where is_published
union all select 'quizzes', count(*) from public.quizzes;
-- 기대값: domains=10, topics=50, prerequisites=78,
-- published_articles=1, quizzes=4 (새 프로젝트 기준).
```

같은 `seed.sql`을 두 번 실행한 뒤 건수가 같아야 한다. `logic-gates → von-neumann-cpu → memory-hierarchy` 경로가 있으므로 `memory-hierarchy → logic-gates` 삽입은 `23514`로 실패해야 한다. 본문이 빈 `articles` 행을 `is_published=true`로 만드는 시도도 `CHECK` 제약으로 실패해야 한다. 일반 클라이언트가 퀴즈 `answer_index`를 조회하거나 사용자 진도 타인 행을 조회·수정하는 시도는 거부되어야 한다.

**출구 기준:** DB 적용과 재실행 성공, DAG·FK·RLS 검증 결과 기록, 타입 정의 생성. 로컬 도구가 없어 SQL을 실행하지 못한 경우에는 Phase 1을 완료로 표시하지 않는다.

## Phase 2 — 그래프 UI와 도메인 탐색

### 구현 순서

1. `/api/graph`가 `topics`와 `topic_prerequisites`를 읽어 React Flow용 `{nodes, edges}`를 반환한다. 상태는 로그인 사용자에 한해 `user_node_status`로 합친다.
2. `source=from_topic_id`, `target=to_topic_id`로 간선을 만든다. 서버에서 위상 정렬 후 레이어 좌표를 결정적으로 배치한다. 동일 데이터가 새로고침마다 흔들리지 않게 slug/순서 기준을 고정한다.
3. 도메인 페이지는 필터·검색·난이도 범례·예상 학습 시간을 제공한다. 그래프의 보조 목록은 화면 읽기 도구와 키보드 탐색으로 모든 토픽에 접근할 수 있어야 한다.
4. 잠금 상태는 `available / in_progress / completed / locked`로 표현한다. 잠긴 노드에는 완료되지 않은 직접 선수를 텍스트로 제시한다. 모든 노드는 읽을 수 있지만 완료 경로는 선후수 규칙을 따른다.
5. 도메인 단위 로딩, 간선 강조, 줌 상태 보존을 넣는다. 수백 노드부터 성능을 재고 필요하면 도메인/뷰포트 단위 가상화로 전환한다.

**검증:** 50개 토픽과 78개 간선이 정확히 1회씩 보인다. `memory-hierarchy`에서 `von-neumann-cpu`로 거꾸로 향하는 간선은 없어야 한다. 작은 화면, 키보드, 스크린리더에서 토픽 목록을 이용할 수 있다.

## Phase 3 — 4단계 MDX 리더와 평가

### 구현 순서

1. `/topics/[topicSlug]`에서 동일한 아티클의 Level 1~4 탭을 구현한다. 현재 레벨은 URL 검색 파라미터에 저장해 링크 공유와 뒤로가기를 지원한다.
2. MDX는 출판된 행만 서버에서 렌더링한다. 제목/목록/표/코드/안전한 다이어그램 컴포넌트를 허용 목록으로 제한하고, 임의 실행 코드와 위험 HTML을 차단한다.
3. 코드 블록은 언어 라벨, 복사 버튼, 줄바꿈, 고대비 하이라이트를 제공한다. 수식·다이어그램은 필요한 토픽부터 컴포넌트로 추가한다.
4. 각 레벨의 퀴즈 문제/선택지는 공개 API로 제공하되 정답/해설은 공개하지 않는다. 인증 사용자의 답안은 서버 채점 라우트가 처리한다.
5. 콘텐츠 편집 템플릿을 4단계 공통 구조로 만든다. 골든 샘플 `processes-threads`를 기준으로 설명·실전 재현·설계 기준을 검수한다.

```json
{
  "topicSlug": "processes-threads",
  "level": 3,
  "article": { "format": "mdx", "body": "# Level 3 — 동시성 버그와 디버깅\n..." },
  "quiz": {
    "id": "<quiz UUID>",
    "question": "C에서 여러 스레드가 counter++를 동기화 없이 수행할 때 가장 정확한 설명은?",
    "choices": ["항상 정확하다", "값만 간혹 누락된다", "데이터 레이스로 정의되지 않은 동작이다"]
  }
}
```

**검증:** 출판 전 아티클은 익명/일반 사용자에게 404, 골든 샘플 네 레벨은 정상 표시, 퀴즈 GET 응답에는 `answer_index`·`explanation`이 없다. 코드 예제는 실제 실행 환경에서 컴파일·실행 또는 명확한 의사 코드로 분류한다.

## Phase 4 — 진도 대시보드와 간격 복습

### 구현 순서

1. 로그인 후 `user_progress` 뷰에서 전체/완료/시작 토픽 수를 읽고, `user_node_status`에서 다음 학습 가능한 노드를 추천한다. 이미 완료한 토픽도 복습 대상으로 접근할 수 있다.
2. 레벨 이동 시 `current_level`, 네 레벨을 마친 뒤 `is_completed=true`와 `completed_at`을 기록한다. `self_assessment`는 1~5로 받는다. 업데이트는 서버에서 현재 사용자와 선수 완료를 확인한다.
3. 복습 큐는 `next_review_at <= now()`인 본인 완료 토픽을 `(next_review_at, topic_id)` 순으로 페이지 조회한다. 인덱스 `(user_id, next_review_at) WHERE next_review_at IS NOT NULL`을 사용한다.
4. 첫 완료 후 다음 복습을 1일 뒤로 잡는다. 복습 품질 1~2는 간격을 1일로 재설정하고, 3~5는 이전 간격을 1일 → 3일 → `round(interval × ease_factor)`로 늘린다. `ease_factor`는 품질에 따라 1.30~9.99 범위에서 조정한다. 업데이트는 한 트랜잭션으로 수행하고 기준 시각은 DB의 `now()`를 사용한다.
5. 지표를 통해 레벨별 이탈, 완료 전환, 복습 기한 초과, 노드 잠금 오류를 본다. 일정 산정이 크게 바뀌면 별도 마이그레이션과 버전 필드/복습 이벤트 이력을 추가한다.

**검증:** A 사용자의 진도가 B 사용자에게 노출되지 않는다. 완료 기록 이후 후속 노드가 열리고, 낮은 자가평가는 다음 복습일을 앞당긴다. 같은 복습 요청이 중복 제출되어 일정을 두 번 늘리지 않도록 요청 ID나 서버의 마지막 검토 시각을 활용한다.

## 콘텐츠 확장 순서와 변경 원칙

1. 하드웨어·언어·알고리즘의 기초를 먼저 채우고, 해당 선수를 가진 OS/네트워크/DB로 확장한다.
2. 다음에는 API·분산 시스템·클라우드·보안/AI를 채운다. 각 토픽은 Level 1만 공개하는 방식 대신 네 레벨을 모두 검수한 후 출판한다.
3. 제목이나 요약 수정은 slug를 바꾸지 않는다. 선수 간선 변경은 기존 사용자 잠금 상태에 영향을 주므로 릴리스 노트와 재계산 검증을 함께 한다.
4. 콘텐츠 이력·번역·퀴즈 시도 분석이 필요해질 때 별도 테이블을 추가한다. 기본 여섯 테이블과 두 읽기 뷰를 임의 필드로 과적하지 않는다.
