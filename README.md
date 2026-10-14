# IT Atlas

Supabase의 지식 분류와 선수 학습 DAG를 보여 주는 Next.js 학습 앱입니다. 로드맵, 4단계 아티클, 인출 퀴즈, AI 튜터, 복습 대시보드를 제공합니다.

## 설치와 실행

```bash
npm install @xyflow/react dagre react-markdown remark-gfm rehype-highlight @supabase/ssr @supabase/supabase-js lucide-react @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-progress @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install ai
npm install mermaid dompurify zod p-limit commander chalk openai dotenv @supabase/supabase-js
npm install -D tsx
npm install -D @types/dagre tailwindcss @tailwindcss/postcss @tailwindcss/typography typescript eslint eslint-config-next
npm run dev
```

저장소의 `package-lock.json`으로 동일한 버전을 설치하려면 `npm ci`를 사용하세요. 기본 주소는 `http://localhost:3000/roadmap`입니다. DB 환경 변수가 없으면 10개 도메인, 50개 토픽, 78개 선수 관계와 프로세스·스레드 아티클 및 8개 체험용 퀴즈를 로컬 미리보기로 실행합니다. 미리보기의 완료·퀴즈·복습 상태는 해당 브라우저의 `localStorage`에 저장됩니다.

## Supabase 연결

1. Supabase 프로젝트에 `supabase/migrations/`의 마이그레이션을 파일명 순서로 적용한 뒤 `supabase/seed.sql`, `supabase/quiz_seed.sql`을 순서대로 실행합니다. Supabase CLI가 설정된 경우 `supabase db reset`으로 로컬 DB를 다시 만들 수 있습니다. `quiz_seed.sql`은 프로세스·스레드에 객관식 및 단답형 8개를 추가합니다. 기존 시드의 4개 객관식과 합쳐 총 12개입니다.
2. `.env.example`을 `.env.local`로 복사하고 프로젝트 URL과 **publishable key**를 입력합니다. 기존 anon 키를 쓰는 프로젝트라면 `NEXT_PUBLIC_SUPABASE_ANON_KEY`도 지원합니다. 서비스 역할 키는 프론트엔드에 넣지 않습니다. Vercel에도 동일한 공개 환경 변수를 등록한 뒤 새로 빌드해야 합니다.
3. Supabase Auth의 URL Configuration에서 앱 주소를 Site URL로, `http://localhost:3000/auth/callback`을 Redirect URL로 추가합니다. 다른 포트로 실행하면 그 포트의 콜백도 추가합니다. Email OTP 로그인을 활성화합니다.
4. AI 튜터를 쓰려면 `.env.local`에 `AI_GATEWAY_API_KEY`를 추가합니다. Vercel 환경에서는 OIDC 인증을 사용할 수도 있습니다. 기본 모델은 `AI_TUTOR_MODEL=openai/gpt-5.4-mini`이며 Vercel AI Gateway 모델 ID로 바꿀 수 있습니다.
5. 개발 서버를 재시작합니다. 로그인한 사용자의 진도는 `user_node_progress`, 퀴즈 통과는 `user_quiz_passes`, 학습 일수는 `user_learning_days`에 저장됩니다. 정답 컬럼은 Data API에서 직접 읽을 수 없고, 채점 RPC가 사용자 ID와 선수 조건을 확인합니다.

기본 SQL 시드에는 프로세스와 스레드 글이, `content/starter-content.json`에는 트랜지스터와 논리회로 글이 있습니다. 나머지 48개 토픽의 4단계 원고와 레벨별 퀴즈는 `content/topics/*.md`와 빌드 결과 `content/library.json`으로 관리합니다. 전체 라이브러리를 적용하면 공개 글 50개·퀴즈 208개가 됩니다. 체험 모드는 샘플 두 편을 표시하고, 운영 학습은 Supabase의 공개 글을 읽습니다.

```bash
npm run content:build
npm run content:verify -- --links
npm run content:seed-starter -- --apply
npm run content:seed-library -- --apply --project-ref ofylxwqyahqghvhphdos
npm run content:verify-live -- --base-url https://it-study-two.vercel.app
```

저장 CLI는 `.env.local`의 프로젝트 URL과 service role 키를 사용합니다. `--project-ref`와 URL이 일치해야 저장하며 기본 실행은 검증만 합니다. 원자적 RPC가 기존 글이나 퀴즈가 있는 토픽을 보존하므로 재실행이 안전합니다. 관리자 SQL 방식은 `npm run content:seed-library -- --export-sql /tmp/it-study-content-sql`로 도메인별 한 문장 SQL을 만들 수 있습니다. SQL에는 키가 없으며 slug로 실제 topic UUID를 조회합니다. 작성 범위·검토 기준은 `CONTENT_COMPLETION_PLAN.md`, 구조·예제·링크 검증은 `content/verification-report.json`, 공개 사이트 본문·퀴즈의 원고 일치 검사 결과는 `content/live-verification-report.json`에 기록합니다. 운영 검사기는 GET 요청만 사용합니다.

## 비전공자용 원고 편집

운영 원고 50개는 한 문장 요약, 필요한 이유, 일상 비유, 단계별 흐름, 작은 예, 용어 풀이, 답이 있는 확인 질문으로 구성합니다. 2~4단계에는 예제와 장애·설계 비교를 읽기 위한 길잡이가 있습니다. 편집 자료는 `content/readability-guides/*.json`, 기존 샘플 두 편의 수정 원고는 `content/foundations/*.md`, 전체 수정 본문은 `content/readable-library.json`으로 관리합니다.

원고 재작성은 `npm run content:rewrite-readable` 다음에 `npm run content:build`를 실행합니다. 기존 본문을 편집할 때는 운영 DB에서 slug와 본문 해시를 JSON으로 저장하고 `npm run content:export-revisions -- --baseline-file <snapshot.json> --out-dir <sql-directory>`를 실행합니다. 생성 SQL은 해당 DB의 관리자 권한으로 실행합니다. 예상한 본문 해시 또는 이미 수정된 해시와 일치할 때만 변경하며, 동시 편집이 발견되면 도메인 묶음 전체를 중단합니다.

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

## 데이터 흐름

- 서버의 `getCatalog()`가 도메인, 토픽, 선수 관계와 사용자 진도를 병렬 조회합니다. 환경 변수가 없으면 `src/lib/demo-catalog.json`을 읽습니다.
- `/roadmap/[slug]`는 해당 도메인의 토픽을 선별하고, `RoadmapCanvas`가 선수 관계를 `dagre`로 배치합니다. 잠금과 완료 상태는 전체 DAG의 선수 토픽을 기준으로 계산합니다.
- 노드 클릭 시 `ArticleReaderSheet`가 `/api/articles/[slug]`에서 공개 아티클을 가져옵니다. `QuizSession`은 `/api/quizzes/[topicId]`로 문제만 읽고 서버 액션 `submitQuizAnswer`가 채점 RPC를 호출합니다. 네 레벨의 모든 퀴즈를 통과하면 완료와 다음 노드 해제가 저장됩니다.
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
