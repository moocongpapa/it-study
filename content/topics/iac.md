<!-- level:1 -->
# 인프라 코드화(IaC)

> **오늘의 질문** · 컴퓨터 환경도 조립 설명서처럼 남길 수 있을까?

먼저 그림을 눌러 바꿔 볼까요? 답이 달라지는 모습을 천천히 관찰해 보세요.

```learning
{"slug":"iac","view":"explore"}
```

## 익숙한 장면과 연결해요

가게 설비의 배치와 수량을 도면으로 기록한다고 생각해 보세요. 현재 설비와 도면을 비교하고 바꿀 내용을 먼저 확인합니다. 도면에서 물건을 지웠다고 실제 물건도 지워도 되는지는 따로 검토해야 합니다.

## 선생님과 한 번 정리해요

콘솔에서 서버와 네트워크를 수동으로 고치면 누가 무엇을 바꿨는지 놓치기 쉽습니다. 반복 생성과 검토를 위해 환경 설정도 버전으로 남길 수 있어야 합니다.

**한 줄로 말하면:** 필요한 인프라의 상태를 코드로 정의하고 실제 변경 계획을 확인하며 관리합니다.

```learning
{"slug":"iac","view":"words"}
```

**비유의 한계도 알아둘까요?** 설정이 코드로 남았다고 비밀값 보호나 안전한 삭제가 자동으로 보장되지는 않습니다. 상태 파일에도 민감 정보가 있을 수 있고 실제 변경 계획을 검토해야 합니다.

```learning
{"slug":"iac","view":"recall"}
```
<!-- level:2 -->
# 한 장면씩 원리를 따라가요

이번에는 **필요한 환경 → 변경 계획 → 적용·확인** 순서로 살펴볼게요. 먼저 다음에 무슨 일이 생길지 생각하고, 그림을 한 칸씩 넘겨 보세요.

```learning
{"slug":"iac","view":"trace"}
```

## 여기서 연결해 봐요

필요한 인프라의 상태를 코드로 정의하고 실제 변경 계획을 확인하며 관리합니다.

왜 이런 순서가 필요한지 말로 설명할 수 있으면 좋아요. 코드와 자세한 설명은 아래에 준비했어요. 낯선 기호는 입력·바뀌는 값·결과로 나눠 읽어 봐요.

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
# 오늘은 문제를 찾는 탐정이에요

정답을 급하게 고치기 전에 **무엇을 봤는지**와 **왜 그랬을 것 같은지**를 나눠 볼까요? 아래는 학습용 가상·재현 사례예요. 카드를 차례로 눌러 단서를 확인해 보세요.

```learning
{"slug":"iac","view":"debug"}
```

## 해결 뒤에도 한 번 더

고친 다음 원래 입력으로 다시 확인하는 일을 **재검증**이라고 해요. 한 번 성공한 것만 보고 끝내지 않고, 비슷한 실패 조건에서도 괜찮은지 확인해요.

<!-- classroom-reference:start -->
가상 팀이 동일 상태를 잠금 없이 로컬에서 관리해 서로 다른 변경을 덮거나 실제 자원과 연결이 어긋난다. state backend·lock·workspace·실행 이력을 확인한다. 상태를 임의 편집·삭제하기 전에 원본과 복구 경로를 확보해야 한다.

**수정:** 중앙 backend와 지원되는 잠금, 일관된 실행 파이프라인을 사용한다. 기존 수동 자원을 import할 때 코드와 실제 속성을 맞추고 plan에서 불필요한 교체가 없는지 검토한다. force-unlock은 다른 실행이 정말 끝났는지 확인해야 한다.

**재검증:** 비운영 환경의 동시 변경·실패 apply·drift를 재현한다. 관리 자원과 state 매핑, 계획 diff, 복구 가능성을 확인한다. 단순 성공 exit code가 모든 자원의 정상 상태를 증명하지 않는다.
<!-- classroom-reference:end -->
<!-- level:4 -->
# 이번에는 네가 설계자예요

아래 방법 중 하나를 골라 볼까요? 선택한 방법에서 **얻는 것**과 **감수할 것**을 함께 확인해 보세요. 같은 기술도 상황과 제약이 바뀌면 다른 선택을 할 수 있어요.

```learning
{"slug":"iac","view":"decide"}
```

## 이유까지 말하면 더 좋아요

“나는 이 방법을 골랐어. 중요한 조건은 이것이고, 대신 이런 부담은 감수할게.”처럼 설명해 보세요. 그러고 나서 조건을 하나 바꾸면 같은 선택을 할지도 생각해 봐요.

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
