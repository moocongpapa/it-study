# IT Atlas

Supabase의 지식 분류와 선수 학습 관계를 바탕으로 배우는 Next.js 학습 앱입니다. 분야별 주제 목록, 4단계 아티클, 인출 퀴즈, AI 튜터, 복습 대시보드를 제공합니다.

## 설치와 실행

```bash
npm ci
npm run dev
```

`package-lock.json`으로 동일한 버전을 설치합니다. 기본 주소는 `http://localhost:3000/roadmap`입니다. DB 환경 변수가 없으면 18개 분야, 130개 토픽, 197개 선수 관계와 130개 그림 수업과 8개 체험용 퀴즈를 로컬 미리보기로 실행합니다. 미리보기의 완료·퀴즈·복습 상태는 해당 브라우저의 `localStorage`에 저장됩니다.

## 학습 화면

분야별 주제를 읽기 쉬운 목록으로 표시합니다. 각 항목에는 제목, 한 줄 설명, 난이도와 예상 시간만 표시하고, 누르면 학습 글이 열립니다. 검색은 상단에, 학습 과정과 난이도는 접을 수 있는 필터에 배치했습니다. 모바일에서는 메뉴 버튼으로 분야를 바꿉니다. 그래프와 통계 카드는 학습 목록에서 제거했으며, 개인 진도와 복습 큐는 `/dashboard`에서 확인합니다.

학습 리더는 작은 도구 모음과 4개 단계 탭만 고정하고 나머지는 한 영역에서 스크롤합니다. 읽기 안내·선수 개념·실험 위젯은 펼쳐 볼 수 있고, 퀴즈 바로 이동과 이전·다음 단계 이동을 지원합니다. 단계 변경 시 글 맨 위로 돌아갑니다. 모바일 입력창은 16px, 주요 읽기 조작은 44px 터치 높이를 사용합니다. 화면별 측정과 검토 내용은 `UI_UX_REVIEW.md`에 기록했습니다.

## Supabase 연결

1. Supabase 프로젝트에 `supabase/migrations/`의 마이그레이션을 파일명 순서로 적용한 뒤 `supabase/seed.sql`, `supabase/quiz_seed.sql`, `supabase/expansion_seed.sql`을 순서대로 실행합니다. `quiz_seed.sql`은 프로세스·스레드에 객관식 및 단답형 8개를 추가합니다. 기존 시드의 4개 객관식과 합쳐 총 12개입니다.
2. `.env.example`을 `.env.local`로 복사하고 프로젝트 URL과 **publishable key**를 입력합니다. 기존 anon 키를 쓰는 프로젝트라면 `NEXT_PUBLIC_SUPABASE_ANON_KEY`도 지원합니다. 서비스 역할 키는 프론트엔드에 넣지 않습니다. Vercel에도 동일한 공개 환경 변수를 등록한 뒤 새로 빌드해야 합니다.
3. Supabase Auth의 URL Configuration에서 앱 주소를 Site URL로, `http://localhost:3000/auth/callback`을 Redirect URL로 추가합니다. 다른 포트로 실행하면 그 포트의 콜백도 추가합니다. Email OTP 로그인을 활성화합니다.
4. AI 튜터를 쓰려면 `.env.local`에 `AI_GATEWAY_API_KEY`를 추가합니다. Vercel 환경에서는 OIDC 인증을 사용할 수도 있습니다. 기본 모델은 `AI_TUTOR_MODEL=openai/gpt-5.4-mini`이며 Vercel AI Gateway 모델 ID로 바꿀 수 있습니다.
5. 개발 서버를 재시작합니다. 로그인한 사용자의 진도는 `user_node_progress`, 퀴즈 통과는 `user_quiz_passes`, 학습 일수는 `user_learning_days`에 저장됩니다. 정답 컬럼은 Data API에서 직접 읽을 수 없고, 채점 RPC가 사용자 ID와 선수 조건을 확인합니다.

기본 SQL 시드에는 프로세스와 스레드 글이, `content/starter-content.json`에는 트랜지스터와 논리회로 글이 있습니다. 기존 48개와 추가 80개 토픽의 4단계 원고와 레벨별 퀴즈는 `content/topics/*.md`와 빌드 결과 `content/library.json`으로 관리합니다. 전체 라이브러리를 적용하면 공개 글 130개·퀴즈 528개가 됩니다. 체험 모드는 130개 그림 수업과 두 편의 샘플 퀴즈를 표시하고, 운영 학습은 Supabase의 공개 글을 읽습니다.

```bash
npm run content:build-expansion
npm run content:build
npm run content:verify -- --links
npm run content:seed-starter -- --apply
npm run content:seed-library -- --apply --project-ref ofylxwqyahqghvhphdos
npm run content:verify-live -- --base-url https://it-study-two.vercel.app
```

저장 CLI는 `.env.local`의 프로젝트 URL과 service role 키를 사용합니다. `--project-ref`와 URL이 일치해야 저장하며 기본 실행은 검증만 합니다. 원자적 RPC가 기존 글이나 퀴즈가 있는 토픽을 보존하므로 재실행이 안전합니다. 관리자 SQL 방식은 `npm run content:seed-library -- --export-sql /tmp/it-study-content-sql`로 도메인별 한 문장 SQL을 만들 수 있습니다. SQL에는 키가 없으며 slug로 실제 topic UUID를 조회합니다. 작성 범위·검토 기준은 `CONTENT_COMPLETION_PLAN.md`, 구조·예제·링크 검증은 `content/verification-report.json`, 공개 사이트 본문·퀴즈의 원고 일치 검사 결과는 `content/live-verification-report.json`에 기록합니다. 운영 검사기는 GET 요청만 사용합니다.

## 데이터·AI·업무 지식 확장

기존 컴퓨터·개발 10개 분야에 다음 8개 분야를 추가했습니다. 각 분야에 10개 토픽, 각 토픽에 네 단계 글과 퀴즈 4개를 제공합니다.

| 분야 | 다루는 내용 |
|---|---|
| 데이터 분석 & 데이터 업무 | 통계·확률·실험·SQL·데이터 품질·파이프라인·거버넌스 |
| AI & 머신러닝 기초 | 문제 정의·데이터 분리·특성·회귀·분류·군집·실험 |
| 딥러닝 & AI 모델 원리 | 텐서·미분·역전파·학습 루프·CNN·Transformer·전이학습·확산·강화학습 |
| 생성형 AI & LLM 활용 | 토큰·프롬프트·구조화 출력·임베딩·RAG·LoRA·환각·평가·멀티모달 |
| AI 앱·에이전트 & 업무 자동화 | API·문서 수집·검색·도구 호출·MCP·메모리·승인·추적·개발 보조 |
| AI 운영·보안 & 책임 있는 AI | MLOps·버전·서빙·GPU·비용·드리프트·프롬프트 주입·개인정보·위험 |
| IT·AI 프로젝트 관리 | 목표·역할·요구사항·추정·일정·스크럼·칸반·위험·출시·AI 시범 |
| 제품·UX & IT 업무 전략 | 문제 발견·사용자 조사·우선순위·MVP·지표·접근성·문서·TCO·구축/구매·OKR |

새 원고의 편집 원본은 `content/expansion/*.json`입니다. `content:build-expansion`이 주제 카탈로그·선수 관계·80개 Markdown·확장 시드·manifest를 만듭니다. 그다음 `content:build`로 기존 48개와 합친 128개 라이브러리를 만듭니다. 기본 샘플 두 편을 더해 운영 글은 130개입니다. 기존 50개용 `content:rewrite-readable`은 추가 80개를 수정하지 않습니다.

새 DB에는 기본 마이그레이션·시드 다음 **`supabase/expansion_seed.sql`을 먼저 적용**하고 starter/library를 저장합니다. 확장 시드는 기존 행을 덮어쓰지 않으며, 글·퀴즈 RPC도 기존 콘텐츠를 보존합니다. 기존 운영 DB에는 확장 시드와 새 글만 추가하면 됩니다. 선수 DAG는 197개 간선이고, 기존 50개 토픽의 선수 조건은 바꾸지 않았습니다.

필터의 ‘학습 과정’에서 AI 입문·AI 앱·AI 운영·프로젝트 관리·제품 전략을 선택할 수 있습니다. 과정은 여러 분야의 추천 모음이며, 완료 기록의 선수 조건은 전체 DAG를 따릅니다. 원고는 어디서든 열어 읽을 수 있습니다. 범위와 검토 기준은 `CONTENT_EXPANSION_PLAN.md`, 검증 결과는 `content/verification-report.json` 및 `content/live-verification-report.json`에 기록합니다.

## 그림으로 배우는 과외식 수업

전체 130개 주제를 중고등학생도 따라오는 **그림 수업 → 원리 실험 → 문제 탐정 → 선택 연습**으로 구성했습니다. 처음에는 질문과 조작하는 그림을 보고, 생활 비유·용어 카드·생각 확인으로 이어갑니다. 고정 영역은 도구 모음과 단계 탭뿐이며, 수업 안내와 퀴즈 이동을 한 줄에 배치했습니다.

14가지 시각 형식은 비트·논리 게이트, 단계 모션, 비교 도형, 분류 카드, 대기열, 복잡도 그래프, 평균·중앙값, 분류 임계값, 벡터, 뉴런 학습, Attention 지도, 칸반, 일정 그래프입니다. 한 주제에는 그 개념에 맞는 형식을 배정합니다. 모션은 재생·일시정지·장면 이동을 지원하고 기본으로 자동 재생하지 않습니다. 움직임 줄이기가 켜져 있으면 수동 장면 전환을 안내합니다. SVG 도형은 확대해도 선명하며 수식은 교육용 모형의 범위를 표시합니다.

**운영 채점 퀴즈와 그림 연습은 별도입니다.** 그림에서의 선택은 점수나 진도를 바꾸지 않습니다. 기존 채점·선수 조건·학습 기록을 유지합니다. 길어진 코드·장애 사례·설계 비교와 출처는 해당 단계의 ‘자세히 보기’에 보존했습니다. AI 튜터도 쉬운 비유·작은 예·확인 질문 순서의 친절한 과외 선생님 말투를 사용합니다.

편집은 `content/classroom/lesson-specs.json`(질문·형식·짧은 라벨·분류 사례), 기존 `content/readability-guides/`와 `content/expansion/`(비유·용어), `content/classroom/reference-library.json`(심화 원문)에서 합니다. `content:build-classroom`은 동일한 입력에서 같은 본문을 생성합니다. 기존 입문 재작성·확장 빌더를 실행한 경우에도 마지막에 classroom 빌더와 content 빌더를 실행합니다.

```bash
npm run content:build-classroom
npm run content:build
npm run content:verify-classroom
npm run content:verify
```

`learning` Markdown 블록은 `{ "slug": "topic-slug", "view": "explore" }` 같은 참조만 포함합니다. 지원하는 view는 explore/trace/words/recall/debug/decide이며 임의 HTML·JS를 실행하지 않습니다. 시각 자료와 130개 수업 데이터는 별도 청크로 지연 로드합니다. 운영 DB 조회 오류·비공개 글에서 전체 로컬 수업으로 우회하지 않으며, 전체 미리보기는 Supabase 미설정 체험 모드에서만 사용합니다.

DB 본문 수정은 실제 운영 본문의 slug·MD5 스냅샷을 받은 뒤 `content:export-revisions`로 생성합니다. 예상 해시나 이미 적용된 해시가 맞을 때만 도메인 단위로 갱신하며 동시 변경 시 중단합니다. 렌더러를 먼저 배포한 뒤 SQL을 적용합니다. 새 DB도 기본 시드·starter·library 적용 후 실제 본문 스냅샷으로 같은 절차를 사용해 두 골든 샘플까지 현재 원고로 맞춥니다. 원고와 DB 비교는 `content:verify-live`로 수행합니다.

범위는 `LEARNING_EXPERIENCE_PLAN.md`, 구조·수식·780개 SSR 렌더 검사는 `content/classroom/verification-report.json`, SQL 재실행·동시 편집 보호는 `content/classroom/revision-verification-report.json`에 기록합니다.

## 기존 비전공자용 원고 편집 자료

기존 기초 원고 50개는 한 문장 요약, 필요한 이유, 일상 비유, 단계별 흐름, 작은 예, 용어 풀이, 답이 있는 확인 질문으로 구성합니다. 2~4단계에는 예제와 장애·설계 비교를 읽기 위한 길잡이가 있습니다. 편집 자료는 `content/readability-guides/*.json`, 기존 샘플 두 편의 수정 원고는 `content/foundations/*.md`, 원래 기초 50개 수정 자료를 보존합니다. 현재 `content/readable-library.json`은 과외식 수업 전체 130개 본문입니다.

기존 입문 재작성 명령은 `npm run content:rewrite-readable`이며, 현재 수업 화면을 유지하려면 그 뒤 `npm run content:build-classroom`과 `npm run content:build`를 실행합니다. 기존 본문을 편집할 때는 운영 DB에서 slug와 본문 해시를 JSON으로 저장하고 `npm run content:export-revisions -- --baseline-file <snapshot.json> --out-dir <sql-directory>`를 실행합니다. 생성 SQL은 해당 DB의 관리자 권한으로 실행합니다. 예상한 본문 해시 또는 이미 수정된 해시와 일치할 때만 변경하며, 동시 편집이 발견되면 도메인 묶음 전체를 중단합니다.

계획은 `CONTENT_READABILITY_PLAN.md`, 50개 입문 도표·용어·본문 수정 SQL 검증은 `content/readability-verification-report.json`, 실제 운영 본문의 일치 검사는 `content/live-verification-report.json`에 기록합니다.

## 콘텐츠 배치 생성

`.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`를 설정합니다. 서비스 역할 키는 로컬 CLI 환경에서만 사용하고 브라우저 번들에 넣지 않습니다. OpenAI 생성기는 Responses API Structured Outputs로 4단계 글과 레벨별 퀴즈 4개를 생성하고 Zod로 검증합니다. 다른 제공자를 붙일 때는 `scripts/providers/content-generator.ts` 인터페이스를 구현하면 됩니다.

```bash
npm run content:generate -- --domain operating-systems  # 대상 목록만 조회, API 비용 없음
npm run content:generate -- --topic virtual-memory --provider mock --generate-only
npm run content:generate -- --limit 5 --generate-only  # 실제 모델 결과 검증, DB 저장 없음
npm run content:generate -- --limit 5 --concurrency 2 --apply  # 초안으로 저장
npm run content:generate -- --limit 5 --apply --publish  # 즉시 공개
```

`--dry-run`은 `--generate-only`와 같으며 모델 API 호출 비용이 발생합니다. CLI는 아티클 또는 퀴즈가 한 건이라도 있는 토픽을 건너뜁니다. 저장 RPC는 토픽별 잠금 안에서 아티클과 퀴즈를 한 트랜잭션으로 삽입하고, 다른 작업이 먼저 저장했다면 `skipped_existing`을 반환합니다. 기존 콘텐츠를 수정·삭제하지 않습니다. `20261014000000_content_batch_guarded_write.sql` 마이그레이션 적용이 필수입니다. LLM 생성 결과는 정확성 검수를 거쳐 공개하는 것을 권장합니다.

## Mermaid 다이어그램

아티클의 `mermaid` 코드 펜스는 리더에서 브라우저 마운트 후 SVG로 렌더링합니다. 루트 `dark`/`light` 클래스와 시스템 색상 설정에 맞춰 테마가 바뀝니다. 원본 코드 복사, SVG 복사, 확대 모달을 제공하고, 문법 오류가 있으면 원본 코드와 오류 메시지를 표시합니다. Mermaid의 `loose` 모드 출력은 DOMPurify로 정화한 후 화면에 삽입합니다.

Mermaid 12에서는 루트 `htmlLabels: false`를 사용해 라벨을 SVG 텍스트로 생성합니다. 도표별 `flowchart.htmlLabels`는 사용하지 않습니다. `useMaxWidth: false`로 SVG 고유 크기를 유지하고 본문에서는 CSS로 축소하므로 확대 모달의 글자와 배율도 유지됩니다.

확대 모달은 처음 열거나 창 크기가 바뀌면 도표를 화면에 맞춥니다. 확대·축소와 화면 맞춤 버튼을 제공하며 확대 후에는 도표 영역 안에서 스크롤합니다.

## 데이터 흐름

- 서버의 `getCatalog()`가 도메인, 토픽, 선수 관계와 사용자 진도를 병렬 조회합니다. 환경 변수가 없으면 `src/lib/demo-catalog.json`을 읽습니다.
- `/roadmap`과 `/roadmap/[slug]`의 `TopicList`가 분야별 주제 목록을 렌더링하고 검색·과정·난이도 필터를 적용합니다. `buildTopicLearningStates()`가 전체 DAG를 기준으로 리더의 선수 조건과 완료 상태를 계산합니다. 그래프 렌더러 의존성은 사용하지 않습니다.
- 주제 클릭 시 `ArticleReaderSheet`가 `/api/articles/[slug]`에서 공개 아티클을 가져옵니다. `?topic=slug` 직접 링크도 지원합니다. `QuizSession`은 `/api/quizzes/[topicId]`로 문제만 읽고 서버 액션 `submitQuizAnswer`가 채점 RPC를 호출합니다. 네 레벨의 모든 퀴즈를 통과하면 완료와 다음 주제의 학습 조건 충족이 저장됩니다.
- 드래그한 아티클 문장으로 `AiTutorDrawer`를 열 수 있습니다. `/api/chat/tutor`는 로그인과 토픽을 확인하고, 해당 레벨 본문을 서버에서 찾아 스트리밍합니다. 튜터는 정답을 즉시 제공하지 않고 유도 질문을 합니다.
- `/dashboard`는 도메인별 완료율, 오늘의 복습 큐, 최근 완료 토픽과 서울 날짜 기준 연속 학습일을 보여 줍니다. 성공한 복습은 1→3→7→14→30일 주기로, 어려웠던 복습은 1일 주기로 돌아갑니다.
- 퀴즈가 아직 없는 토픽은 기존 이해도 체크로 완료할 수 있습니다. 새 토픽의 네 레벨 퀴즈를 모두 채우면 퀴즈 통과가 완료 조건이 됩니다.

## 확인

```bash
npm run typecheck
npm run lint
npm run build
npm run db:verify
```

`npm run db:verify`는 메모리 내 PostgreSQL에서 마이그레이션과 시드를 두 번 실행하고, 퀴즈 채점, 완료 우회 방지, 다른 사용자 데이터의 RLS 격리를 확인합니다. `npm run build`는 Webpack을 사용합니다.
