<!-- level:1 -->
# CI/CD 파이프라인 설계

> **먼저 한 문장:** 코드 변경을 일정한 검사·빌드·배포 단계로 연결해 같은 절차를 반복할 수 있게 합니다.

개발자마다 다른 방법으로 검사하고 배포하면 누락과 환경 차이가 생깁니다. 작은 변경도 같은 기준을 통과하고 어떤 버전이 배포됐는지 추적할 수 있어야 합니다.

## 먼저 알아둘 말

```learning
{"slug":"cicd-pipelines","view":"words"}
```

## 작은 예로 이해하기

Continuous Delivery는 변경을 배포할 수 있는 상태로 유지하는 의미로 사용합니다. Continuous Deployment는 조건을 통과한 변경을 운영에 자동 반영합니다. 둘 다 CD라고 부르므로 실제 팀의 승인·반영 절차를 명시해야 합니다.

## 익숙한 장면과 연결하기

공장에서 제품을 만들고 검사한 뒤 출고하는 흐름을 생각해 보세요. 자동 검사를 통과해 출고 가능한 상태로 준비하는 것과, 조건을 통과하면 자동으로 매장까지 보내는 것은 다른 단계입니다.

**비유의 한계 — 이 점은 달라요:** 자동화가 잘못된 검사를 올바르게 만들어 주지는 않습니다. 코드와 의존성이 실행되는 단계의 권한, 비밀값 노출, 실제 배포 후 관측을 함께 관리해야 합니다.

## 직접 확인하기

변경 검사 → 산출물 만들기 → 배포·관찰 순서로 읽어 보세요. 뒤의 과정에서 필요한 것이 앞에서 어떻게 준비되는지 찾습니다. 숫자는 읽는 순서이며 모든 상황이 정확히 세 단계라는 뜻은 아닙니다.

```learning
{"slug":"cicd-pipelines","view":"explore"}
```

```learning
{"slug":"cicd-pipelines","view":"recall"}
```
<!-- level:2 -->
# CI/CD 파이프라인 설계 · 작동 원리

검사 예제에서 언제 실행하는지, 어떤 권한으로 실행하는지, 무엇을 검사하는지 차례로 보세요. 실제 운영 배포 전체를 포함한 예제는 아닙니다.

## 전체 흐름부터 보기

```learning
{"slug":"cicd-pipelines","view":"trace"}
```

## 예제와 내부 동작

아래 자료를 읽을 때 **입력 → 바뀌는 값이나 상태 → 결과**를 찾아보세요. 모르는 말은 밑줄 표시를 눌러 뜻을 확인할 수 있어요.

<!-- classroom-reference:start -->
GitHub Actions의 검사 예제다. 운영에는 action을 검증한 commit SHA로 고정하고 업데이트 정책을 둔다.

```yaml
name: verify
on: [push, pull_request]
permissions:
  contents: read
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
```

`npm ci`는 lockfile과 의존성을 일치시킨다. 캐시 키는 lockfile·플랫폼·런타임 조건을 반영한다. PR의 신뢰하지 않는 코드를 실행할 때 production secret을 노출하지 않는다. OIDC는 장기 키 대신 짧은 인증을 쓸 수 있지만 trust 조건·권한 범위는 제한해야 한다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# CI/CD 파이프라인 설계 · 문제 해결

내 컴퓨터에서는 되는데 배포에서 실패하면 도구 버전·의존성·환경 설정을 비교합니다. 검증한 산출물과 실제 배포한 산출물이 같은지도 확인하세요.

## 구체적인 사례와 확인 방법

같은 증상에도 원인이 여럿일 수 있어요. 먼저 발생 조건을 기록하고 증상을 재현할 수 있는지 확인하세요. **관찰한 증상 → 확인할 자료 → 수정 → 수정 후 확인(같은 조건으로 재검증)**을 연결해서 읽습니다.

<!-- classroom-reference:start -->
이 앱에서 발생했던 유형처럼 환경변수 이름 불일치나 정적 빌드의 fallback이 실제 데이터를 숨길 수 있다. commit SHA·deployment ID·환경 이름과 API→DB 응답을 연결해 확인한다. 테스트 통과를 운영 연결 검증으로 대체하지 않는다.

**수정:** 환경별 필수 변수 검증과 연결 검사, 사용자 흐름의 합성 테스트를 둔다. Next.js 공개 변수는 빌드에 반영되는 계약을 확인한다. DB 변경은 expand→앱 이행→contract 순서로 구버전과 호환되게 진행할 수 있다.

**재검증:** 배포 READY, 실제 운영 alias, 데이터·API·브라우저 결과를 확인한다. rollback이 DB 스키마까지 되돌리는지 가정하지 말고 데이터 호환성을 점검한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# CI/CD 파이프라인 설계 · 실무 선택

자동 반영 속도와 검증·복구 비용을 비교합니다. 운영 영향이 큰 변경의 승인 위치, 단계적 노출, 배포 후 실패 판단 기준을 정하세요.

## 선택지를 비교해 보기

방법을 하나 고르면 이득과 부담을 함께 볼 수 있어요. 어떤 조건을 중요하게 보는지에 따라 선택이 달라집니다.

```learning
{"slug":"cicd-pipelines","view":"decide"}
```

## 판단 근거와 상세 비교

“이 조건에서는 이 방법을 쓰고, 대신 이 부담을 감수한다”라고 설명할 수 있는지 확인해 보세요.

<!-- classroom-reference:start -->
| 전략 | 이득 | 비용 |
|---|---|---|
| rolling | 자원 재사용·점진 교체 | 구·신 버전 공존 |
| blue/green | 빠른 트래픽 전환 | 이중 자원·상태 호환 |
| canary | 작은 노출로 지표 검증 | 라우팅·표본·판정 복잡성 |

배포 성공 조건에는 오류율·꼬리 지연·업무 지표·데이터 무결성이 포함된다. schema contract나 외부 효과는 단순 앱 rollback으로 취소되지 않을 수 있다. 복구 가능한 단계와 forward fix를 계획하고 commit·artifact·설정을 추적한다.

참고: [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions), [GitHub OIDC](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"continuous delivery와 deployment를 구분한 설명은?","choices":["delivery는 배포 가능 상태, deployment는 조건 통과 후 자동 운영 반영","둘 다 테스트 없음","CI는 운영 인증만","deployment는 항상 수동"],"answer_index":0,"explanation":"자동화의 범위와 승인 경계가 다릅니다. 둘 다 재현 가능한 검증·배포 준비와 운영 확인이 중요합니다."},{"level":2,"question":"신뢰하지 않는 PR 코드 실행에서 중요한 보안 원칙은?","choices":["production secret을 모두 제공","최소 권한과 secret 노출 경계 제한","토큰을 로그에 기록","lockfile 무시"],"answer_index":1,"explanation":"PR 코드는 secret을 읽거나 유출할 수 있습니다. 신뢰·권한·OIDC 조건과 의존성 고정을 관리해야 합니다."},{"level":3,"question":"빌드 성공 후 실제 데이터 연결을 검증할 방법은?","choices":["컴파일 메시지만 재확인","배포 이름만 확인","운영 alias에서 브라우저→API→DB 흐름 확인","개발 화면만 확인"],"answer_index":2,"explanation":"운영 환경과 실제 데이터 흐름은 별도입니다. commit과 deployment를 특정하고 사용자 결과까지 확인해야 합니다."},{"level":4,"question":"앱 rollback의 중요한 한계는?","choices":["항상 DB까지 완전 역복구","외부 결제도 자동 취소","schema 호환 필요 없음","스키마·데이터·외부 효과를 자동 되돌리지 못할 수 있음"],"answer_index":3,"explanation":"출시에는 되돌리기 어려운 상태 변경이 있습니다. 호환 단계와 forward fix·복구 절차를 계획해야 합니다."}]
