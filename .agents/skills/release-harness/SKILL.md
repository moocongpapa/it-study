---
name: release-harness
description: 이 프로젝트의 변경을 검증하고 main에 커밋·푸시한 뒤 Vercel 배포까지 확인하는 표준 절차. 코드·콘텐츠를 수정했거나 사용자가 "커밋/푸시/배포"를 요청하면 사용.
---

# 릴리스 하네스

변경 → 검증 → 커밋·푸시(main) → 배포 확인 순서를 항상 지킨다.

## 절차
1. `git pull --rebase origin main` — 다른 곳에서 올라온 커밋과 충돌을 먼저 정리한다.
2. `npm run harness` — 변경된 영역에 맞는 검증을 자동 실행한다 (`harness:check`, `typecheck`, `lint`는 항상 실행).
   - 전체 검증을 강제로 모두 돌리려면 `npm run harness:full`.
   - 실패하면 오류를 고치고 다시 실행한다. 통과 기록(`.agents/harness-last.json`)은 현재 작업 트리 해시에 묶여 있어, 통과 후 파일을 바꾸면 다시 돌려야 한다.
3. `git add -A && git commit -m "<type>: <요약>"` — 비밀값(`.env*`)이 포함되지 않았는지 `git status`로 확인한다.
4. `git push origin main` — `PreToolUse` 훅(`push-gate.mjs`)이 현재 작업 트리 해시와 일치하는 하네스 통과 기록이 없으면 푸시를 자동 차단한다.
5. `npm run harness:deploy` — 이 커밋이 Vercel 프로덕션에서 READY가 될 때까지 확인한다. 커스텀 도메인이 있으면 `HARNESS_PROD_URL=https://... npm run harness:deploy`.
6. 사용자에게 한국어로 보고: 무엇을 바꿨는지, 통과한 검증, 배포 결과(커밋 해시 7자리).

## 영역별 검증 매핑
| 단계 | 명령 | 실행 조건 |
|---|---|---|
| 정적 불변식 검사 | `npm run harness:check` | 항상 (카탈로그·트랙 슬러그 동기화, 화이트 톤 규칙) |
| 타입·린트 | `typecheck`, `lint` | 항상 |
| 스키마 검증 | `db:verify` | `supabase/` 변경 시 |
| 진도/완료 검증 | `completion:verify` | `src/lib`, `src/app/api` 변경 시 |
| 아티클 로딩 검증 | `loading:verify` | `src/components/reader`, `content/` 변경 시 |
| 실습 워크북 검증 | `practice:verify` | `src/**/practice*` 변경 시 |
| 콘텐츠 품질 검증 | `content:verify` | `content/`, `scripts/content*` 변경 시 (Python·JS·SQL 코드 실행, Mermaid 파싱) |
| 클래스룸 검증 | `content:verify-classroom` | `content/classroom` 변경 시 |
| 프로덕션 빌드 + UI/접근성 | `build` + `harness:ui` | `src/`, `tests/` 변경 시 (Playwright 데스크톱·모바일 오류·가로 스크롤·axe WCAG 2.1 AA 검사) |

## 금지
- 하네스를 통과시키려고 검증 스크립트나 린트 규칙을 약화하지 않는다. 원인을 고친다.
- `--no-verify`, 강제 푸시(`--force`)는 사용자가 명시적으로 요청할 때만.
