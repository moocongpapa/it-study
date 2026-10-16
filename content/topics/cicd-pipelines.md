<!-- level:1 -->
# CI/CD 파이프라인 설계

> **오늘의 질문** · 숙제를 고칠 때마다 검사하고 배포까지 이어갈 수 있을까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"cicd-pipelines","view":"explore"}
```

## 익숙한 장면과 연결해요

공장에서 제품을 만들고 검사한 뒤 출고하는 흐름을 생각해 보세요. 자동 검사를 통과해 출고 가능한 상태로 준비하는 것과, 조건을 통과하면 자동으로 매장까지 보내는 것은 다른 단계입니다.

## 선생님과 한 번 정리해요

개발자마다 다른 방법으로 검사하고 배포하면 누락과 환경 차이가 생깁니다. 작은 변경도 같은 기준을 통과하고 어떤 버전이 배포됐는지 추적할 수 있어야 합니다.

**한 줄로 말하면:** 코드 변경을 일정한 검사·빌드·배포 단계로 연결해 같은 절차를 반복할 수 있게 합니다.

```learning
{"slug":"cicd-pipelines","view":"words"}
```

**비유의 한계도 알아둘까요?** 자동화가 잘못된 검사를 올바르게 만들어 주지는 않습니다. 코드와 의존성이 실행되는 단계의 권한, 비밀값 노출, 실제 배포 후 관측을 함께 관리해야 합니다.

```learning
{"slug":"cicd-pipelines","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **변경 검사 → 산출물 만들기 → 배포·관찰** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"cicd-pipelines","view":"trace"}
```

## 여기서 연결해 봐요

코드 변경을 일정한 검사·빌드·배포 단계로 연결해 같은 절차를 반복할 수 있게 합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

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
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"cicd-pipelines","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
이 앱에서 발생했던 유형처럼 환경변수 이름 불일치나 정적 빌드의 fallback이 실제 데이터를 숨길 수 있다. commit SHA·deployment ID·환경 이름과 API→DB 응답을 연결해 확인한다. 테스트 통과를 운영 연결 검증으로 대체하지 않는다.

**수정:** 환경별 필수 변수 검증과 연결 검사, 사용자 흐름의 합성 테스트를 둔다. Next.js 공개 변수는 빌드에 반영되는 계약을 확인한다. DB 변경은 expand→앱 이행→contract 순서로 구버전과 호환되게 진행할 수 있다.

**재검증:** 배포 READY, 실제 운영 alias, 데이터·API·브라우저 결과를 확인한다. rollback이 DB 스키마까지 되돌리는지 가정하지 말고 데이터 호환성을 점검한다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"cicd-pipelines","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

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
