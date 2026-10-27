<!-- level:1 -->
# 인프라 코드화(IaC)

> **먼저 한 문장:** 필요한 인프라의 상태를 코드로 정의하고 실제 변경 계획을 확인하며 관리합니다.

콘솔에서 서버와 네트워크를 수동으로 고치면 누가 무엇을 바꿨는지 놓치기 쉽습니다. 반복 생성과 검토를 위해 환경 설정도 버전으로 남길 수 있어야 합니다.

## 먼저 알아둘 말

```learning
{"slug":"iac","view":"words"}
```

## 작은 예로 이해하기

코드에서 데이터베이스 자원을 제거하면 도구가 실제 삭제를 계획할 수 있습니다. 글 한 줄을 지우는 일처럼 가볍게 볼 수 없습니다. 자료 보관, 교체·복구 절차, 계획된 변경을 먼저 확인해야 합니다.

## 익숙한 장면과 연결하기

가게 설비의 배치와 수량을 도면으로 기록한다고 생각해 보세요. 현재 설비와 도면을 비교하고 바꿀 내용을 먼저 확인합니다. 도면에서 물건을 지웠다고 실제 물건도 지워도 되는지는 따로 검토해야 합니다.

**비유의 한계 — 이 점은 달라요:** 설정이 코드로 남았다고 비밀값 보호나 안전한 삭제가 자동으로 보장되지는 않습니다. 상태 파일에도 민감 정보가 있을 수 있고 실제 변경 계획을 검토해야 합니다.

## 직접 확인하기

필요한 환경 → 변경 계획 → 적용·확인 순서로 읽어 보세요. 뒤의 과정에서 필요한 것이 앞에서 어떻게 준비되는지 찾습니다. 숫자는 읽는 순서이며 모든 상황이 정확히 세 단계라는 뜻은 아닙니다.

```learning
{"slug":"iac","view":"explore"}
```

```learning
{"slug":"iac","view":"recall"}
```
<!-- level:2 -->
# 인프라 코드화(IaC) · 작동 원리

아래 Terraform 예제는 클라우드 서버 대신 로컬 파일을 다룹니다. 선언한 내용, 계획된 변경, 적용 뒤 파일을 비교하면 원리를 작은 범위에서 볼 수 있습니다.

## 전체 흐름부터 보기

```learning
{"slug":"iac","view":"trace"}
```

## 예제와 내부 동작

아래 자료를 읽을 때 **입력 → 바뀌는 값이나 상태 → 결과**를 찾아보세요. 모르는 말은 밑줄 표시를 눌러 뜻을 확인할 수 있어요.

<!-- classroom-reference:start -->
Terraform 예제는 로컬 파일 자원만 사용한다. 실행에 Terraform과 local provider 다운로드가 필요하며 클라우드 자원을 만들지 않는다.

```hcl
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.5" }
  }
}
resource "local_file" "lab" {
  filename = "${path.module}/lab-output.txt"
  content  = "managed by IaC\n"
}
```

`terraform init`, `terraform plan`으로 의존성과 변경을 확인한다. apply 전 삭제·교체 표시와 대상 workspace/backend를 확인한다. remote state는 잠금·권한·암호화·버전 관리가 필요하다. sensitive 표시가 상태 파일에서 비밀을 없애 준다는 보장은 아니다. provider lockfile과 버전을 관리한다.
<!-- classroom-reference:end -->
<!-- level:3 -->
# 인프라 코드화(IaC) · 문제 해결

같은 코드인데 환경이 다르면 수동 변경과 관리 상태를 비교합니다. 여러 사람이 동시에 적용했는지, 기록과 실제 자원 대응이 맞는지도 확인하세요.

## 구체적인 사례와 확인 방법

같은 증상에도 원인이 여럿일 수 있어요. 먼저 발생 조건을 기록하고 증상을 재현할 수 있는지 확인하세요. **관찰한 증상 → 확인할 자료 → 수정 → 수정 후 확인(같은 조건으로 재검증)**을 연결해서 읽습니다.

<!-- classroom-reference:start -->
가상 팀이 동일 상태를 잠금 없이 로컬에서 관리해 서로 다른 변경을 덮거나 실제 자원과 연결이 어긋난다. state backend·lock·workspace·실행 이력을 확인한다. 상태를 임의 편집·삭제하기 전에 원본과 복구 경로를 확보해야 한다.

**수정:** 중앙 backend와 지원되는 잠금, 일관된 실행 파이프라인을 사용한다. 기존 수동 자원을 import할 때 코드와 실제 속성을 맞추고 plan에서 불필요한 교체가 없는지 검토한다. force-unlock은 다른 실행이 정말 끝났는지 확인해야 한다.

**재검증:** 비운영 환경의 동시 변경·실패 apply·drift를 재현한다. 관리 자원과 state 매핑, 계획 diff, 복구 가능성을 확인한다. 단순 성공 exit code가 모든 자원의 정상 상태를 증명하지 않는다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 인프라 코드화(IaC) · 실무 선택

재현 가능한 환경과 검토 가능한 변경이라는 이득을 얻는 대신 상태 관리·접근 통제·삭제 보호를 운영해야 합니다. 팀의 변경 절차와 복구 요구를 함께 비교하세요.

## 선택지를 비교해 보기

방법을 하나 고르면 이득과 부담을 함께 볼 수 있어요. 어떤 조건을 중요하게 보는지에 따라 선택이 달라집니다.

```learning
{"slug":"iac","view":"decide"}
```

## 판단 근거와 상세 비교

“이 조건에서는 이 방법을 쓰고, 대신 이 부담을 감수한다”라고 설명할 수 있는지 확인해 보세요.

<!-- classroom-reference:start -->
| 선택 | 장점 | 비용 |
|---|---|---|
| 수동 운영 | 작은 일회성 작업에 간단 | drift·재현·감사 어려움 |
| IaC 중앙 pipeline | 리뷰·일관 실행·추적 | state·권한·승인 관리 |
| GitOps reconciliation | 지속적으로 원하는 상태 조정 | 수동 변경 충돌·controller 운영 |

대형 인프라를 하나의 상태에 넣으면 blast radius와 검토 비용이 커질 수 있다. 환경·소유권·변경 주기에 맞게 모듈과 state 경계를 정한다. 분리는 cross-state 의존·순서 비용도 만든다. 예산·정책 검사, 최소 권한, 삭제 보호와 backup을 적용한다.

**판단 연습:** 네트워크 기반과 자주 바뀌는 앱 배포를 같은 state로 관리할까? 변경 주기·실패 영향·권한을 기준으로 결정하자.

참고: [Terraform State](https://developer.hashicorp.com/terraform/language/state), [Terraform Plan](https://developer.hashicorp.com/terraform/cli/commands/plan).
<!-- classroom-reference:end -->
<!-- quizzes -->
[{"level":1,"question":"IaC 코드에서 자원을 제거할 때 중요한 사실은?","choices":["문서만 사라짐","실제 삭제·교체가 계획될 수 있음","항상 무료","상태는 무관"],"answer_index":1,"explanation":"구성 차이가 실제 인프라 변경으로 이어질 수 있습니다. plan과 대상 환경·복구를 확인해야 합니다."},{"level":2,"question":"Terraform sensitive 표시의 한계는?","choices":["비밀을 항상 state에서 제거","모든 권한 자동 제한","출력 숨김과 실제 상태의 비밀 저장은 구분","암호화 키를 생성하지 않음"],"answer_index":2,"explanation":"민감 출력 표시만으로 state 보안이 해결되지 않습니다. 접근권한·암호화·보관·secret 관리가 필요합니다."},{"level":3,"question":"동시 apply의 충돌을 줄이는 운영 설계는?","choices":["지원되는 중앙 state 잠금과 일관 실행 경로","각자 state 복사 후 적용","실패 때 state 삭제","항상 force-unlock"],"answer_index":0,"explanation":"상태 매핑과 동시 변경을 통제해야 합니다. 잠금 해제는 실제 실행 상태를 확인해 신중히 수행합니다."},{"level":4,"question":"state 경계를 나눌 기준은?","choices":["무조건 파일 개수 최대화","전체 회사 하나로 고정","인프라 이름만","소유권·변경 주기·실패 영향·의존성 비용"],"answer_index":3,"explanation":"경계는 영향 범위와 검토를 제한하지만 의존·실행 순서를 복잡하게 합니다. 실제 운영 요구로 균형을 잡습니다."}]
