---
name: team-pipeline
description: Planner → Builder → Evaluator 3단계 멀티 에이전트 하네스 파이프라인으로 새 기능이나 학습 콘텐츠를 기획·구현·검증하는 표준 런북.
---

# Planner → Builder → Evaluator 3단계 파이프라인

복잡한 기능 추가, 인터랙티브 학습 위젯 제작, 대규모 콘텐츠/커리큘럼 개편 시 `invoke_subagent`로 3단계 서브에이전트를 순차 실행한다.

## 1단계: 기획 (`harness-planner`)
- `invoke_subagent`로 `harness-planner`를 호출해 요구사항을 분석하고 5개 항목 명세(목표·수정 파일·데이터 흐름·UI 제약·검증 기준)를 생성한다.

## 2단계: 구현 (`harness-builder`)
- `harness-planner`가 산출한 5개 항목 명세를 프롬프트에 담아 `harness-builder`를 호출한다.
- 카탈로그(`demo-catalog.json`), 추천 트랙(`curated-tracks.ts`), 화이트 톤 플랫 스타일, 접근성 속성을 한 번에 맞춰 구현한다.

## 3단계: 검증 및 자동 교정 (`harness-evaluator`)
- `harness-evaluator`를 호출해 `npm run harness:check` 및 `npm run harness`를 실행하고, 실패 항목(타입·린트·콘텐츠·빌드·Playwright 가로 스크롤·axe 접근성)이 있으면 즉시 수정해 재검증한다.

## 4단계: 릴리스 (`release-harness` 스킬)
- `.agents/harness-last.json` 통과 스탬프가 찍히면 `main` 브랜치에 커밋·푸시하고 `npm run harness:deploy`로 Vercel 배포(READY)를 확인한다.
