<!-- level:1 -->
# IaC — 인프라의 원하는 상태를 코드로 관리

매번 화면에서 서버를 만드는 대신 설계서에 원하는 서버·네트워크·권한을 기록하면 검토와 재현이 쉬워진다. Infrastructure as Code는 인프라 구성을 코드와 변경 절차로 관리한다. 선언형 도구는 원하는 상태와 현재 상태의 차이를 계산하지만 모든 변경이 안전하게 되돌아가는 것은 아니다.

```mermaid
flowchart LR
  C["구성 코드"] --> P["Plan: 현재와 차이"] --> R["검토"] --> A["Apply"] --> S["실제 자원과 상태"]
```

상태 파일은 도구가 어떤 실제 자원을 관리하는지 연결한다. 화면에서 수동 변경하면 drift가 생길 수 있다. IaC를 Git에 넣어도 비밀번호와 private key를 같이 커밋하면 안 된다.

**비유의 한계:** 코드 삭제가 단순히 문서 삭제가 아닐 수 있다. apply가 실제 자원 삭제·교체·비용 변경을 일으키므로 계획 결과를 읽어야 한다.
<!-- level:2 -->
# 계획·상태·변경을 연결하기

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
<!-- level:3 -->
# 가상 장애 — 두 사람이 동시에 apply한다

가상 팀이 동일 상태를 잠금 없이 로컬에서 관리해 서로 다른 변경을 덮거나 실제 자원과 연결이 어긋난다. state backend·lock·workspace·실행 이력을 확인한다. 상태를 임의 편집·삭제하기 전에 원본과 복구 경로를 확보해야 한다.

**수정:** 중앙 backend와 지원되는 잠금, 일관된 실행 파이프라인을 사용한다. 기존 수동 자원을 import할 때 코드와 실제 속성을 맞추고 plan에서 불필요한 교체가 없는지 검토한다. force-unlock은 다른 실행이 정말 끝났는지 확인해야 한다.

**재검증:** 비운영 환경의 동시 변경·실패 apply·drift를 재현한다. 관리 자원과 state 매핑, 계획 diff, 복구 가능성을 확인한다. 단순 성공 exit code가 모든 자원의 정상 상태를 증명하지 않는다.
<!-- level:4 -->
# 자동화의 영향 범위 제한하기

| 선택 | 장점 | 비용 |
|---|---|---|
| 수동 운영 | 작은 일회성 작업에 간단 | drift·재현·감사 어려움 |
| IaC 중앙 pipeline | 리뷰·일관 실행·추적 | state·권한·승인 관리 |
| GitOps reconciliation | 지속적으로 원하는 상태 조정 | 수동 변경 충돌·controller 운영 |

대형 인프라를 하나의 상태에 넣으면 blast radius와 검토 비용이 커질 수 있다. 환경·소유권·변경 주기에 맞게 모듈과 state 경계를 정한다. 분리는 cross-state 의존·순서 비용도 만든다. 예산·정책 검사, 최소 권한, 삭제 보호와 backup을 적용한다.

**판단 연습:** 네트워크 기반과 자주 바뀌는 앱 배포를 같은 state로 관리할까? 변경 주기·실패 영향·권한을 기준으로 결정하자.

참고: [Terraform State](https://developer.hashicorp.com/terraform/language/state), [Terraform Plan](https://developer.hashicorp.com/terraform/cli/commands/plan).
<!-- quizzes -->
[{"level":1,"question":"IaC 코드에서 자원을 제거할 때 중요한 사실은?","choices":["문서만 사라짐","실제 삭제·교체가 계획될 수 있음","항상 무료","상태는 무관"],"answer_index":1,"explanation":"구성 차이가 실제 인프라 변경으로 이어질 수 있습니다. plan과 대상 환경·복구를 확인해야 합니다."},{"level":2,"question":"Terraform sensitive 표시의 한계는?","choices":["비밀을 항상 state에서 제거","모든 권한 자동 제한","출력 숨김과 실제 상태의 비밀 저장은 구분","암호화 키를 생성하지 않음"],"answer_index":2,"explanation":"민감 출력 표시만으로 state 보안이 해결되지 않습니다. 접근권한·암호화·보관·secret 관리가 필요합니다."},{"level":3,"question":"동시 apply의 충돌을 줄이는 운영 설계는?","choices":["지원되는 중앙 state 잠금과 일관 실행 경로","각자 state 복사 후 적용","실패 때 state 삭제","항상 force-unlock"],"answer_index":0,"explanation":"상태 매핑과 동시 변경을 통제해야 합니다. 잠금 해제는 실제 실행 상태를 확인해 신중히 수행합니다."},{"level":4,"question":"state 경계를 나눌 기준은?","choices":["무조건 파일 개수 최대화","전체 회사 하나로 고정","인프라 이름만","소유권·변경 주기·실패 영향·의존성 비용"],"answer_index":3,"explanation":"경계는 영향 범위와 검토를 제한하지만 의존·실행 순서를 복잡하게 합니다. 실제 운영 요구로 균형을 잡습니다."}]
