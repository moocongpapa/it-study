<!-- level:1 -->
# CI/CD — 변경을 검사하고 배포하는 반복 절차

> **한 문장으로:** 코드 변경을 일정한 검사·빌드·배포 단계로 연결해 같은 절차를 반복할 수 있게 합니다.

## 왜 필요한가요?

개발자마다 다른 방법으로 검사하고 배포하면 누락과 환경 차이가 생깁니다. 작은 변경도 같은 기준을 통과하고 어떤 버전이 배포됐는지 추적할 수 있어야 합니다.

## 일상에서 떠올려 보기

공장에서 제품을 만들고 검사한 뒤 출고하는 흐름을 생각해 보세요. 자동 검사를 통과해 출고 가능한 상태로 준비하는 것과, 조건을 통과하면 자동으로 매장까지 보내는 것은 다른 단계입니다.

## 순서대로 따라가기

1. 코드 변경을 공유 저장소에 합치고 정해진 검사를 실행합니다.
2. 같은 입력과 도구로 배포할 산출물을 만듭니다.
3. 승인 또는 자동 정책에 따라 배포하고 결과를 관찰하며 문제가 있으면 복구합니다.

```mermaid
flowchart LR
 A["코드 변경"] --> B["검사"] --> C["빌드"] --> D["배포 준비·승인"] --> E["운영 반영·관찰"]
```

## 작은 예로 확인하기

Continuous Delivery는 변경을 배포할 수 있는 상태로 유지하는 의미로 사용합니다. Continuous Deployment는 조건을 통과한 변경을 운영에 자동 반영합니다. 둘 다 CD라고 부르므로 실제 팀의 승인·반영 절차를 명시해야 합니다.

## 처음 만나는 용어

| 용어 | 쉬운 뜻 |
|---|---|
| CI | 변경을 자주 합치고 자동 검사로 연결 문제를 확인하는 방식입니다. |
| 빌드 | 소스와 의존성으로 실행·배포할 산출물을 만드는 과정입니다. |
| 파이프라인 | 검사부터 배포까지 연결한 처리 단계입니다. |
| CD | 배포 준비 또는 자동 운영 반영을 뜻할 수 있어 범위를 밝혀야 하는 약어입니다. |

**비유의 한계:** 자동화가 잘못된 검사를 올바르게 만들어 주지는 않습니다. 코드와 의존성이 실행되는 단계의 권한, 비밀값 노출, 실제 배포 후 관측을 함께 관리해야 합니다.

## 스스로 확인

검사 후 사람이 최종 승인하는 흐름과 자동 운영 반영 흐름은 무엇이 다를까요?

**답과 이유:** 배포 가능 상태를 유지하는 Delivery와 조건 통과 후 자동 배포하는 Deployment의 구분입니다. 자동화 범위와 승인 지점을 명시해야 합니다.
<!-- level:2 -->
# 재현 가능한 빌드와 최소 권한

<!-- beginner-guide:start -->
## 읽기 전 길잡이

검사 예제에서 언제 실행하는지, 어떤 권한으로 실행하는지, 무엇을 검사하는지 차례로 보세요. 실제 운영 배포 전체를 포함한 예제는 아닙니다.

## 이 단계에서 만날 말

| 용어 | 쉬운 뜻 |
|---|---|
| artifact | 빌드가 만든 배포·검사용 결과물입니다. |
| lockfile | 설치할 의존성의 구체 버전을 기록한 파일입니다. |
| 환경 변수 | 코드와 구분해 실행 설정을 전달하는 값입니다. |
| secret | 키·토큰처럼 보호해야 하는 설정값입니다. |
| 최소 권한 | 각 단계에 필요한 만큼만 접근 권한을 주는 원칙입니다. |
| rollback | 문제 발생 시 이전 배포 상태 등으로 복구하는 절차입니다. |

<!-- beginner-guide:end -->

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
<!-- level:3 -->
# 가상 장애 — 빌드는 성공했지만 운영은 체험 데이터

<!-- beginner-guide:start -->
## 읽기 전 길잡이

내 컴퓨터에서는 되는데 배포에서 실패하면 도구 버전·의존성·환경 설정을 비교합니다. 검증한 산출물과 실제 배포한 산출물이 같은지도 확인하세요.

<!-- beginner-guide:end -->

이 앱에서 발생했던 유형처럼 환경변수 이름 불일치나 정적 빌드의 fallback이 실제 데이터를 숨길 수 있다. commit SHA·deployment ID·환경 이름과 API→DB 응답을 연결해 확인한다. 테스트 통과를 운영 연결 검증으로 대체하지 않는다.

**수정:** 환경별 필수 변수 검증과 연결 검사, 사용자 흐름의 합성 테스트를 둔다. Next.js 공개 변수는 빌드에 반영되는 계약을 확인한다. DB 변경은 expand→앱 이행→contract 순서로 구버전과 호환되게 진행할 수 있다.

**재검증:** 배포 READY, 실제 운영 alias, 데이터·API·브라우저 결과를 확인한다. rollback이 DB 스키마까지 되돌리는지 가정하지 말고 데이터 호환성을 점검한다.
<!-- level:4 -->
# 출시 전략과 복구

<!-- beginner-guide:start -->
## 읽기 전 길잡이

자동 반영 속도와 검증·복구 비용을 비교합니다. 운영 영향이 큰 변경의 승인 위치, 단계적 노출, 배포 후 실패 판단 기준을 정하세요.

<!-- beginner-guide:end -->

| 전략 | 이득 | 비용 |
|---|---|---|
| rolling | 자원 재사용·점진 교체 | 구·신 버전 공존 |
| blue/green | 빠른 트래픽 전환 | 이중 자원·상태 호환 |
| canary | 작은 노출로 지표 검증 | 라우팅·표본·판정 복잡성 |

배포 성공 조건에는 오류율·꼬리 지연·업무 지표·데이터 무결성이 포함된다. schema contract나 외부 효과는 단순 앱 rollback으로 취소되지 않을 수 있다. 복구 가능한 단계와 forward fix를 계획하고 commit·artifact·설정을 추적한다.

참고: [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions), [GitHub OIDC](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect).
<!-- quizzes -->
[{"level":1,"question":"continuous delivery와 deployment를 구분한 설명은?","choices":["delivery는 배포 가능 상태, deployment는 조건 통과 후 자동 운영 반영","둘 다 테스트 없음","CI는 운영 인증만","deployment는 항상 수동"],"answer_index":0,"explanation":"자동화의 범위와 승인 경계가 다릅니다. 둘 다 재현 가능한 검증·배포 준비와 운영 확인이 중요합니다."},{"level":2,"question":"신뢰하지 않는 PR 코드 실행에서 중요한 보안 원칙은?","choices":["production secret을 모두 제공","최소 권한과 secret 노출 경계 제한","토큰을 로그에 기록","lockfile 무시"],"answer_index":1,"explanation":"PR 코드는 secret을 읽거나 유출할 수 있습니다. 신뢰·권한·OIDC 조건과 의존성 고정을 관리해야 합니다."},{"level":3,"question":"빌드 성공 후 실제 데이터 연결을 검증할 방법은?","choices":["컴파일 메시지만 재확인","배포 이름만 확인","운영 alias에서 브라우저→API→DB 흐름 확인","개발 화면만 확인"],"answer_index":2,"explanation":"운영 환경과 실제 데이터 흐름은 별도입니다. commit과 deployment를 특정하고 사용자 결과까지 확인해야 합니다."},{"level":4,"question":"앱 rollback의 중요한 한계는?","choices":["항상 DB까지 완전 역복구","외부 결제도 자동 취소","schema 호환 필요 없음","스키마·데이터·외부 효과를 자동 되돌리지 못할 수 있음"],"answer_index":3,"explanation":"출시에는 되돌리기 어려운 상태 변경이 있습니다. 호환 단계와 forward fix·복구 절차를 계획해야 합니다."}]
